import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { DemoScenarioButtons } from './demo-scenario-buttons';
import type { DemoScenario } from './constants';
import { setLanguage } from '@/lib/i18n';

const SCENARIOS: DemoScenario[] = [
  {
    id: 'topic-1',
    category: 'topic',
    titleKey: 'scenario.s1.title',
    descriptionKey: 'scenario.s1.desc',
    expectedDeltaKey: 'scenario.s1.delta',
    query: 'анализ',
    leftUsername: 'Мария',
    rightUsername: 'Кирилл',
  },
  {
    id: 'topic-2',
    category: 'topic',
    titleKey: 'scenario.s2.title',
    descriptionKey: 'scenario.s2.desc',
    expectedDeltaKey: 'scenario.s2.delta',
    query: 'ядро',
    leftUsername: 'Дмитрий',
    rightUsername: 'Артем',
  },
  {
    id: 'role-1',
    category: 'role',
    titleKey: 'scenario.s6.title',
    descriptionKey: 'scenario.s6.desc',
    expectedDeltaKey: 'scenario.s6.delta',
    query: 'оптика лазер',
    leftUsername: 'Иван',
    rightUsername: 'Дмитрий',
  },
];

describe('DemoScenarioButtons', () => {
  beforeEach(() => {
    setLanguage('ru');
  });

  it('renders only categories that have scenarios', () => {
    render(<DemoScenarioButtons scenarios={SCENARIOS} onSelect={vi.fn()} />);

    expect(screen.getByText('Тема решает')).toBeInTheDocument();
    expect(screen.getByText('Роль решает')).toBeInTheDocument();
    expect(screen.queryByText('Интерес решает')).not.toBeInTheDocument();
  });

  it('renders all scenario titles, queries and descriptions', () => {
    render(<DemoScenarioButtons scenarios={SCENARIOS} onSelect={vi.fn()} />);

    expect(screen.getByText('Математик vs Химик')).toBeInTheDocument();
    expect(screen.getByText('Физик vs Геолог')).toBeInTheDocument();
    expect(screen.getByText('Бакалавр-физик vs Аспирант-физик')).toBeInTheDocument();
    expect(screen.getByText('анализ')).toBeInTheDocument();
    expect(screen.getByText('ядро')).toBeInTheDocument();
    expect(screen.getByText('оптика лазер')).toBeInTheDocument();
  });

  it('calls onSelect with the correct scenario when a card is clicked', () => {
    const onSelect = vi.fn();
    render(<DemoScenarioButtons scenarios={SCENARIOS} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: /Физик vs Геолог/ }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'topic-2', query: 'ядро' }),
    );
  });

  it('disables all scenario cards when disabled', () => {
    render(<DemoScenarioButtons scenarios={SCENARIOS} onSelect={vi.fn()} disabled />);

    expect(screen.getByRole('button', { name: /Математик vs Химик/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Физик vs Геолог/ })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Бакалавр-физик vs Аспирант-физик/ })).toBeDisabled();
  });

  it('shows category description as plain text under heading', () => {
    render(<DemoScenarioButtons scenarios={SCENARIOS} onSelect={vi.fn()} />);

    expect(
      screen.getByText(/Один и тот же запрос для двух специализаций/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Одна специализация, разные академические роли/i),
    ).toBeInTheDocument();
  });

  it('renders nothing in disabled categories when scenarios list is empty', () => {
    const { container } = render(
      <DemoScenarioButtons scenarios={[]} onSelect={vi.fn()} />,
    );

    expect(within(container).queryByText('Тема решает')).not.toBeInTheDocument();
    expect(within(container).queryByText('Роль решает')).not.toBeInTheDocument();
    expect(within(container).queryByText('Интерес решает')).not.toBeInTheDocument();
  });
});
