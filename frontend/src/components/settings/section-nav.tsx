import { useEffect, useState } from 'react';

export interface SectionNavItem {
  id: string;
  label: string;
}

interface SectionNavProps {
  items: SectionNavItem[];
  offsetTop?: number;
}

export function SectionNav({ items, offsetTop = 80 }: SectionNavProps) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: `-${offsetTop}px 0px -60% 0px`,
        threshold: 0,
      },
    );

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [items, offsetTop]);

  const handleClick = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - offsetTop;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <nav
      aria-label="Разделы настроек"
      className="hidden lg:block sticky top-20 self-start"
    >
      <ul className="space-y-0.5 border-l border-notion-border pl-3">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                onClick={handleClick(item.id)}
                className={`block rounded-notion px-2 py-1.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-notion-bg-hover font-medium text-notion-text'
                    : 'text-notion-text-secondary hover:bg-notion-bg-hover hover:text-notion-text'
                }`}
                aria-current={isActive ? 'true' : undefined}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
