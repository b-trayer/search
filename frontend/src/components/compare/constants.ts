export type DemoCategory = 'topic' | 'role' | 'interest';

export interface DemoScenario {
  id: string;
  category: DemoCategory;
  title: string;
  description: string;
  query: string;
  leftUsername: string;
  rightUsername: string;
  expectedDelta: string;
}

export const DEMO_CATEGORY_LABELS: Record<DemoCategory, string> = {
  topic: 'Тема решает',
  role: 'Роль решает',
  interest: 'Интерес решает',
};

export const DEMO_CATEGORY_HINT: Record<DemoCategory, string> = {
  topic: 'Один и тот же запрос для двух специализаций — поднимутся разные тематические корпуса.',
  role: 'Одна специализация, разные академические роли — меняется тип документов в топе.',
  interest: 'Одна специализация и роль, но разные интересы — узкий интерес перестраивает топ.',
};

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'analiz-math-vs-chem',
    category: 'topic',
    title: 'Математик vs Химик',
    description: 'Один и тот же термин — два совершенно разных корпуса',
    query: 'анализ',
    leftUsername: 'Мария Соколова',
    rightUsername: 'Кирилл Лебедев',
    expectedDelta:
      'Слева — учебники по математическому анализу (Кудрявцев, задачники). Справа — аналитическая химия и объемный анализ.',
  },
  {
    id: 'yadro-phys-vs-geo',
    category: 'topic',
    title: 'Физик vs Геолог',
    description: 'Атомное ядро или земное ядро',
    query: 'ядро',
    leftUsername: 'Дмитрий Соколов',
    rightUsername: 'Артем Лебедев',
    expectedDelta:
      'Физик увидит «Атомное ядро», «Физика ядра». Геолог поднимет «Земное ядро», «Земля (геофизика)».',
  },
  {
    id: 'evolution-bio-vs-history',
    category: 'topic',
    title: 'Биолог vs Историк',
    description: 'Дарвин или эволюция государства',
    query: 'эволюция',
    leftUsername: 'Анна Громова',
    rightUsername: 'Ольга Кузнецова',
    expectedDelta:
      'Биолог получит дарвинизм и биологическую эволюцию. Историк — «Эволюция войн», политическая эволюция, история формирования государств.',
  },
  {
    id: 'vlast-law-vs-history',
    category: 'topic',
    title: 'Юрист vs Историк',
    description: 'Конституционная или политическая власть',
    query: 'власть',
    leftUsername: 'Дарья Соколова',
    rightUsername: 'Ольга Кузнецова',
    expectedDelta:
      'Юрист увидит конституционное право и судебную ветвь власти. Историк — политические учения, генеалогию власти.',
  },
  {
    id: 'tolstoy-philology-vs-history',
    category: 'topic',
    title: 'Филолог vs Историк',
    description: 'Литературоведение или исторический контекст',
    query: 'Толстой',
    leftUsername: 'Алина Соловьева',
    rightUsername: 'Елена Морозова',
    expectedDelta:
      'Филолог поднимет литературоведческие труды о Толстом. Историк — «Толстой и пролетариат», «Древо жизни: Толстой и Толстые», социальный контекст эпохи.',
  },
  {
    id: 'optics-bachelor-vs-phd',
    category: 'role',
    title: 'Бакалавр-физик vs Аспирант-физик',
    description: 'Одна тема, две академические роли',
    query: 'оптика лазер',
    leftUsername: 'Иван Петров',
    rightUsername: 'Дмитрий Соколов',
    expectedDelta:
      'Бакалавр — учебники Иродова и сборники задач. Аспирант — диссертации, монографии и периодика по лазерной физике.',
  },
];
