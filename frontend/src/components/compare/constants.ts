export interface DemoScenario {
  id: string;
  title: string;
  description: string;
  query: string;
  leftUserId: number | null;
  rightUserId: number | null;
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'physicist-vs-mathematician',
    title: 'Физик vs Математик',
    description: '«теория» — у каждого своя теория в топе',
    query: 'теория',
    leftUserId: 1,
    rightUserId: 13,
  },
  {
    id: 'physicist-vs-biologist',
    title: 'Физик vs Биолог',
    description: '«методы анализа» — геном vs хроматография',
    query: 'методы анализа',
    leftUserId: 1,
    rightUserId: 45,
  },
  {
    id: 'student-vs-phd',
    title: 'Студент vs Аспирант',
    description: 'Разные роли → студент ищет учебники, PhD — диссертации',
    query: 'оптика лазер',
    leftUserId: 1,
    rightUserId: 3,
  },
];
