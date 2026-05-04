import { useEffect, useState } from 'react';
import { ArrowDown, Beaker } from 'lucide-react';

interface PreviewFabProps {
  targetId?: string;
}

export function PreviewFab({ targetId = 'section-preview' }: PreviewFabProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;
    const el = document.getElementById(targetId);
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { rootMargin: '0px 0px -40% 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [targetId]);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => {
        const el = document.getElementById(targetId);
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }}
      style={{
        bottom: 'max(1.5rem, env(safe-area-inset-bottom))',
        right: 'max(1.5rem, env(safe-area-inset-right))',
      }}
      className="fixed z-40 inline-flex h-11 items-center gap-2 rounded-notion border border-notion-border bg-notion-bg px-4 text-sm font-medium text-notion-text shadow-notion-md transition-all hover:bg-notion-bg-hover"
      title="Перейти к тест-превью"
    >
      <Beaker className="h-4 w-4 text-notion-text-tertiary" />
      Тест-превью
      <ArrowDown className="h-3.5 w-3.5 text-notion-text-tertiary" />
    </button>
  );
}
