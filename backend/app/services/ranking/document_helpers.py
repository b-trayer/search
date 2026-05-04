
from typing import Dict, List


def get_field(doc: Dict, *field_names: str, default: str = '') -> str:
    for name in field_names:
        value = doc.get(name)
        if value:
            return value if isinstance(value, str) else str(value)
    return default


def get_list_field(doc: Dict, field_name: str) -> List[str]:
    value = doc.get(field_name, [])
    if isinstance(value, list):
        return value
    return [str(value)] if value else []


def join_list_field(doc: Dict, field_name: str) -> str:
    items = get_list_field(doc, field_name)
    return ', '.join(items)


def fix_catalog_url(url: str) -> str:
    if not url:
        return ''
    url = url.replace('\\\\', '%5C').replace('\\', '%5C')
    if 'ruslan-neo.nsu.ru/pwb/action/rec?id=' in url:
        url = url.replace('/pwb/action/rec?id=', '/pwb/detail?db=BOOKS&id=')
    if 'e-lib.nsu.ru' in url and url.endswith('/view'):
        url = url[:-5] + '/info'
    return url


def get_title(doc: Dict) -> str:
    title = doc.get('title', '')
    if isinstance(title, list):
        return title[0] if title else 'Без названия'
    return str(title) if title else 'Без названия'
