import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { PositionChip } from './position-chip';

describe('PositionChip', () => {
  it('renders the position number', () => {
    const { getByText } = render(<PositionChip n={3} />);
    expect(getByText('3')).toBeInTheDocument();
  });

  it('uses md size by default', () => {
    const { getByText } = render(<PositionChip n={1} />);
    const span = getByText('1');
    expect(span.className).toContain('h-6');
    expect(span.className).toContain('w-6');
  });

  it('applies sm size classes', () => {
    const { getByText } = render(<PositionChip n={1} size="sm" />);
    const span = getByText('1');
    expect(span.className).toContain('h-5');
    expect(span.className).toContain('text-[11px]');
  });

  it('applies lg size classes', () => {
    const { getByText } = render(<PositionChip n={1} size="lg" />);
    const span = getByText('1');
    expect(span.className).toContain('h-7');
    expect(span.className).toContain('w-7');
  });

  it('merges extra classNames', () => {
    const { getByText } = render(<PositionChip n={1} className="custom-class" />);
    expect(getByText('1').className).toContain('custom-class');
  });

  it('always uses tabular-nums for stable digit width', () => {
    const { getByText } = render(<PositionChip n={42} />);
    expect(getByText('42').className).toContain('tabular-nums');
  });
});
