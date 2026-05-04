import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { DemoScenarioButtons } from './demo-scenario-buttons';
import type { DemoScenario } from './constants';

const SCENARIOS: DemoScenario[] = [
  {
    id: 'topic-1',
    category: 'topic',
    title: 'Математик vs Химик',
    description: 'desc 1',
    query: 'анализ',
    leftUsername: 'Мария',
    rightUsername: 'Кирилл',
    expectedDelta: 'effect 1',
  },
  {
    id: 'topic-2',
    category: 'topic',
    title: 'Физик vs Геолог',
    description: 'desc 2',
    query: 'ядро',
    leftUsername: 'Дмитрий',
    rightUsername: 'Артем',
    expectedDelta: 'effect 2',
  },
  {
    id: 'role-1',
    category: 'role',
    title: 'Бакалавр vs Аспирант',
    description: 'desc 3',
    query: 'оптика лазер',
    leftUsername: 'Иван',
    rightUsername: 'Дмитрий',
    expectedDelta: 'effect 3',
  },
];

describe('DemoScenarioButtons', () => {
  it('renders only categories that have scenarios', () => {
    render(<DemoScenarioButtons scenarios={SCENARIOS} onSelect={vi.fn()} />);

    expect(screen.getByText('Тема решает')).toBeInTheDocument();
    expect(screen.getByText('Роль решает')).toBeInTheDocument();
    expect(screen.queryByText('Интерес решает')).not.toBeInTheDocument();
  });

  it('renders all scenario titles, queries and descriptions', () => {
    render(<DemoScenarioButtons scenarios={SCENARIOS} onSelect={vi.fn()} />);

    for (const scenario of SCENARIOS) {
      expect(screen.getByText(scenario.title)).toBeInTheDocument();
      expect(screen.getByText(scenario.query)).toBeInTheDocument();
      expect(screen.getByText(scenario.description)).toBeInTheDocument();
      expect(screen.getByText(scenario.expectedDelta)).toBeInTheDocument();
    }
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

    for (const scenario of SCENARIOS) {
      const card = screen.getByRole('button', { name: new RegExp(scenario.title) });
      expect(card).toBeDisabled();
    }
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
