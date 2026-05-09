export type DemoCategory = 'topic' | 'role' | 'interest';

export interface DemoScenario {
  id: string;
  category: DemoCategory;
  titleKey: string;
  descriptionKey: string;
  expectedDeltaKey: string;
  query: string;
  leftUsername: string;
  rightUsername: string;
}

export const DEMO_CATEGORY_LABEL_KEY: Record<DemoCategory, string> = {
  topic: 'compare.demoCategory.topic',
  role: 'compare.demoCategory.role',
  interest: 'compare.demoCategory.interest',
};

export const DEMO_CATEGORY_HINT_KEY: Record<DemoCategory, string> = {
  topic: 'compare.demoHint.topic',
  role: 'compare.demoHint.role',
  interest: 'compare.demoHint.interest',
};

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'analiz-math-vs-chem',
    category: 'topic',
    titleKey: 'scenario.s1.title',
    descriptionKey: 'scenario.s1.desc',
    expectedDeltaKey: 'scenario.s1.delta',
    query: 'анализ',
    leftUsername: 'Мария Соколова',
    rightUsername: 'Кирилл Лебедев',
  },
  {
    id: 'yadro-phys-vs-geo',
    category: 'topic',
    titleKey: 'scenario.s2.title',
    descriptionKey: 'scenario.s2.desc',
    expectedDeltaKey: 'scenario.s2.delta',
    query: 'ядро',
    leftUsername: 'Дмитрий Соколов',
    rightUsername: 'Артем Лебедев',
  },
  {
    id: 'evolution-bio-vs-history',
    category: 'topic',
    titleKey: 'scenario.s3.title',
    descriptionKey: 'scenario.s3.desc',
    expectedDeltaKey: 'scenario.s3.delta',
    query: 'эволюция',
    leftUsername: 'Анна Громова',
    rightUsername: 'Ольга Кузнецова',
  },
  {
    id: 'vlast-law-vs-history',
    category: 'topic',
    titleKey: 'scenario.s4.title',
    descriptionKey: 'scenario.s4.desc',
    expectedDeltaKey: 'scenario.s4.delta',
    query: 'власть',
    leftUsername: 'Дарья Соколова',
    rightUsername: 'Ольга Кузнецова',
  },
  {
    id: 'tolstoy-philology-vs-history',
    category: 'topic',
    titleKey: 'scenario.s5.title',
    descriptionKey: 'scenario.s5.desc',
    expectedDeltaKey: 'scenario.s5.delta',
    query: 'Толстой',
    leftUsername: 'Алина Соловьева',
    rightUsername: 'Елена Морозова',
  },
  {
    id: 'optics-bachelor-vs-phd',
    category: 'role',
    titleKey: 'scenario.s6.title',
    descriptionKey: 'scenario.s6.desc',
    expectedDeltaKey: 'scenario.s6.delta',
    query: 'оптика лазер',
    leftUsername: 'Иван Петров',
    rightUsername: 'Дмитрий Соколов',
  },
];
