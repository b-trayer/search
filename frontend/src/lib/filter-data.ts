
export interface FilterItem {
  name: string;
  count: number;
}

export const COLLECTIONS: FilterItem[] = [
  { name: 'Издания НГУ', count: 2000 },
  { name: 'Статьи штатных преподавателей НГУ', count: 1439 },
  { name: 'Книги редкого фонда НБ НГУ', count: 1386 },
  { name: 'Периодические издания прочие', count: 698 },
  { name: 'Вестник НГУ', count: 507 },
  { name: 'Учебно-методические пособия СУНЦ НГУ', count: 312 },
  { name: 'Видеокурсы преподавателей НГУ', count: 287 },
  { name: 'Диссертации преподавателей НГУ', count: 245 },
  { name: 'Газета «Университетская жизнь»', count: 198 },
  { name: 'Презентации преподавателей НГУ', count: 156 },
  { name: 'Виртуальные выставки', count: 89 },
  { name: 'Труды конференций', count: 214 },
];

export const SUBJECTS: FilterItem[] = [
  { name: 'Физико-математические науки', count: 1845 },
  { name: 'История. Исторические науки', count: 892 },
  { name: 'Химические науки', count: 654 },
  { name: 'Биологические науки', count: 578 },
  { name: 'Науки о Земле', count: 423 },
  { name: 'Языкознание', count: 367 },
  { name: 'Экономика. Экономические науки', count: 312 },
  { name: 'Философские науки', count: 287 },
  { name: 'Литературоведение', count: 234 },
  { name: 'Социология', count: 198 },
  { name: 'Право. Юридические науки', count: 176 },
  { name: 'Психология', count: 145 },
  { name: 'Информатика', count: 423 },
  { name: 'Медицина и здравоохранение', count: 98 },
];

export const LANGUAGES: FilterItem[] = [
  { name: 'Русский', count: 6234 },
  { name: 'English', count: 987 },
  { name: 'Немецкий', count: 156 },
  { name: 'Французский', count: 89 },
  { name: 'Другие', count: 65 },
];
