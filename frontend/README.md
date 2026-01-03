# NSU Library Search — Frontend

React-приложение для персонализированной поисковой системы библиотеки НГУ.

## Технологии

- React 18
- TypeScript
- Vite
- Tailwind CSS (Notion-style design system)
- shadcn/ui
- React Query

## Запуск

```bash
# Установка зависимостей
npm install

# Запуск dev-сервера
npm run dev

# Сборка
npm run build
```

## Структура

```
src/
├── components/
│   ├── ui/           # Базовые компоненты (shadcn)
│   ├── search/       # Компоненты поиска
│   ├── settings/     # Панель настроек весов
│   └── users/        # Выбор пользователя
├── pages/
│   ├── Search.tsx    # Основной поиск
│   └── Compare.tsx   # A/B сравнение
├── hooks/
│   ├── use-search.ts
│   ├── use-settings.ts
│   └── use-users.ts
└── lib/
    ├── api.ts        # API client
    └── types.ts      # TypeScript типы
```

## Design System

Используется Notion-style дизайн:
- Тёплые серые цвета (`#37352f`, `#f7f6f3`)
- Subtle тени и эффекты
- Border-radius: 6px
- Много whitespace
