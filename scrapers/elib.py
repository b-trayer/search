#!/usr/bin/env python3

import argparse
import json
import time
import sys
import re
from pathlib import Path
from typing import Iterator, Optional
from urllib.parse import urljoin
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

try:
    from bs4 import BeautifulSoup
except ImportError:
    print("BeautifulSoup required: pip3 install beautifulsoup4")
    sys.exit(1)

BASE_URL = "https://e-lib.nsu.ru"
SEARCH_URL = f"{BASE_URL}/search/result"
REQUEST_DELAY = 0.3
RECORDS_PER_PAGE = 10
SOURCE_NAME = "E-library"

FIELD_MAPPING = {
    "название": "title",
    "авторы": "authors",
    "другие авторы": "other_authors",
    "организация": "organization",
    "выходные сведения": "publication_info",
    "электронная публикация": "electronic_publication",
    "коллекция": "collection",
    "тематика": "subjects",
    "ббк": "bbk",
    "удк": "udc",
    "литература по отраслям знания": "knowledge_area",
    "тип документа": "document_type",
    "язык": "language",
    "права доступа": "access_rights",
    "ключ записи": "record_key",
    "doi": "doi",
    "isbn": "isbn",
    "issn": "issn",
    "дата создания записи": "record_created",
    "группа": "user_group",
    "сеть": "network",
    "аннотация": "abstract",
    "содержание": "contents",
    "примечания": "notes",
    "серия": "series",
    "физическое описание": "physical_description",
}

TRANSLIT = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya', ' ': '_'
}


class ProgressTracker:
    def __init__(self):
        self.start_time = time.time()
        self.last_count = 0
        self.last_time = self.start_time
        self.speeds = []

    def update(self, fetched: int, total: int, page: int = 0, total_pages: int = 0):
        now = time.time()
        elapsed = now - self.start_time

        if now - self.last_time > 0.3:
            speed = (fetched - self.last_count) / (now - self.last_time)
            self.speeds.append(speed)
            if len(self.speeds) > 20:
                self.speeds.pop(0)
            self.last_count = fetched
            self.last_time = now

        avg_speed = sum(self.speeds) / len(self.speeds) if self.speeds else 0
        eta = (total - fetched) / avg_speed if avg_speed > 0 else 0

        pct = (fetched / total * 100) if total else 0
        filled = int(25 * fetched / total) if total else 0
        bar = "=" * filled + "-" * (25 - filled)

        page_info = f" | p{page}/{total_pages}" if page else ""
        speed_str = f"{avg_speed:.1f}" if avg_speed > 0 else "..."
        eta_str = format_time(eta) if avg_speed > 0 else "..."

        print(f"\r[{bar}] {pct:5.1f}% | {fetched:,}/{total:,}{page_info} | {speed_str}/s | {format_time(elapsed)} | ETA:{eta_str}   ", end="", flush=True)


def format_time(seconds: float) -> str:
    if seconds < 60:
        return f"{seconds:.0f}s"
    if seconds < 3600:
        m, s = divmod(int(seconds), 60)
        return f"{m}m {s}s"
    h, remainder = divmod(int(seconds), 3600)
    m, s = divmod(remainder, 60)
    return f"{h}h {m}m"


def clean_text(text: str) -> str:
    return re.sub(r'\s+', ' ', text).strip() if text else ""


def transliterate(text: str) -> str:
    result = "".join(TRANSLIT.get(c, c) for c in text.lower())
    result = re.sub(r'[^a-z0-9_]', '', result)
    return re.sub(r'_+', '_', result).strip('_') or "unknown_field"


def field_name_to_key(name: str) -> str:
    name_lower = name.lower().strip()
    return FIELD_MAPPING.get(name_lower) or transliterate(name_lower)


def create_session() -> requests.Session:
    session = requests.Session()
    retries = Retry(total=5, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
    adapter = HTTPAdapter(max_retries=retries)
    session.mount("https://", adapter)
    session.mount("http://", adapter)
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
    })
    return session


def parse_card_page(html: str, card_url: str) -> dict:
    soup = BeautifulSoup(html, "html.parser")
    record = {"source": SOURCE_NAME, "card_url": card_url}

    cover_img = soup.select_one(".docinfo__img img")
    if cover_img and cover_img.get("src"):
        record["cover_url"] = cover_img["src"]

    read_link = soup.select_one("#actionView_0")
    if read_link and read_link.get("href"):
        record["read_url"] = urljoin(BASE_URL, read_link["href"])
        record["pdf_url"] = record["read_url"].replace("/view", "")

    for table in soup.select(".docinfo__tab-table.table-info"):
        for row in table.select("tr"):
            th, td = row.select_one("th"), row.select_one("td")
            if not (th and td):
                continue

            field_name = clean_text(th.get_text())
            values = [clean_text(elem.get_text()) for elem in td.select("a, span")
                      if clean_text(elem.get_text()) not in ("", ";", ",")]

            if not values:
                text = clean_text(td.get_text())
                values = [text] if text else []

            if field_name and values:
                key = field_name_to_key(field_name)
                unique_values = list(dict.fromkeys(v for v in values if v))
                record[key] = unique_values[0] if len(unique_values) == 1 else unique_values

    stat_values = soup.select(".info-docinfo__stat-value")
    if len(stat_values) >= 2:
        try:
            record["views_total"] = int(stat_values[0].get_text().strip())
            record["views_30_days"] = int(stat_values[1].get_text().strip())
        except ValueError:
            pass

    return record


def get_card_urls_from_page(html: str) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")
    return [urljoin(BASE_URL, link["href"])
            for item in soup.select(".list-result__item")
            for link in [item.select_one(".list-result__name a")]
            if link and link.get("href")]


def get_total_pages(html: str) -> int:
    soup = BeautifulSoup(html, "html.parser")
    pages = [1]
    for link in soup.select(".pagination__list a"):
        match = re.search(r'p=(\d+)', link.get("href", ""))
        if match:
            pages.append(int(match.group(1)))
    return max(pages)


def get_total_records(html: str) -> int:
    soup = BeautifulSoup(html, "html.parser")
    stat = soup.select_one(".result__stat span")
    if stat:
        match = re.search(r'(\d[\d\s]*)', stat.get_text())
        if match:
            return int(match.group(1).replace(' ', '').replace('\xa0', ''))
    return 0


def iter_all_records(
    session: requests.Session,
    max_records: Optional[int] = None,
    delay: float = REQUEST_DELAY,
    progress: Optional[ProgressTracker] = None,
) -> Iterator[dict]:
    response = session.get(SEARCH_URL, timeout=30)
    response.encoding = 'utf-8'
    html = response.text

    total_pages = get_total_pages(html)
    total_records = get_total_records(html)

    if max_records:
        total_records = min(total_records, max_records)
        total_pages = min(total_pages, (max_records + RECORDS_PER_PAGE - 1) // RECORDS_PER_PAGE)

    fetched = 0

    for page in range(1, total_pages + 1):
        if page > 1:
            time.sleep(delay)
            response = session.get(SEARCH_URL, params={"p": page}, timeout=30)
            response.encoding = 'utf-8'
            html = response.text

        for card_url in get_card_urls_from_page(html):
            if max_records and fetched >= max_records:
                return

            time.sleep(delay)

            try:
                response = session.get(card_url, timeout=30)
                response.encoding = 'utf-8'
                record = parse_card_page(response.text, card_url)
                record["_page"] = page
                yield record
                fetched += 1

                if progress:
                    progress.update(fetched, total_records, page, total_pages)

            except requests.RequestException as e:
                print(f"\nError fetching {card_url}: {e}", file=sys.stderr)


def main():
    parser = argparse.ArgumentParser(description="NSU E-library parser (e-lib.nsu.ru)")
    parser.add_argument("--output", "-o", type=str, default="elib_full.jsonl", help="Output file path")
    parser.add_argument("--max-records", "-n", type=int, default=None, help="Maximum records")
    parser.add_argument("--delay", type=float, default=REQUEST_DELAY, help=f"Request delay (default {REQUEST_DELAY})")
    args = parser.parse_args()

    output_path = Path(args.output)
    print(f"E-library NSU Parser\nOutput: {output_path}")
    if args.max_records:
        print(f"Limit: {args.max_records}")
    print()

    session = create_session()

    print("Fetching info...")
    response = session.get(SEARCH_URL, timeout=30)
    response.encoding = 'utf-8'
    total_records = get_total_records(response.text)
    total_pages = get_total_pages(response.text)

    if args.max_records:
        total_records = min(total_records, args.max_records)

    print(f"Total records: {total_records:,}")
    print(f"Pages: {total_pages}")
    print(f"Estimated time: {format_time(total_records * args.delay * 1.5)}\n")

    progress = ProgressTracker()
    count = 0
    field_stats = {}

    with open(output_path, "w", encoding="utf-8") as f:
        for record in iter_all_records(session, args.max_records, args.delay, progress):
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
            count += 1
            for key in record:
                if not key.startswith("_"):
                    field_stats[key] = field_stats.get(key, 0) + 1

    total_time = time.time() - progress.start_time
    print(f"\n\nSaved {count:,} records to {output_path}")
    print(f"Time: {format_time(total_time)}")
    print(f"Speed: {count / total_time:.2f} records/sec\n")

    print("Fields found:")
    for field, cnt in sorted(field_stats.items(), key=lambda x: -x[1])[:20]:
        print(f"  {field:30} {cnt:>6} ({cnt / count * 100:5.1f}%)")

    print("\nSample record:")
    with open(output_path, "r", encoding="utf-8") as f:
        record = json.loads(f.readline())
        for key, value in list(record.items())[:12]:
            if isinstance(value, str) and len(value) > 60:
                value = value[:60] + "..."
            print(f"  {key}: {value}")


if __name__ == "__main__":
    main()
