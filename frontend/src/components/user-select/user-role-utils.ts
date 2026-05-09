import { GraduationCap, BookOpen, Microscope, LucideIcon } from "lucide-react";
import { getLanguage } from '@/lib/i18n';
import { ru } from '@/lib/i18n/translations.ru';
import { en } from '@/lib/i18n/translations.en';

const DICTS = { ru, en } as const;

const KNOWN_ROLES = ['bachelor', 'master', 'phd', 'professor'] as const;

export const ROLE_LABELS: Record<string, string> = Object.fromEntries(
  KNOWN_ROLES.map((role) => [role, ru[`role.${role}`] ?? role]),
) as Record<string, string>;

export const getRoleLabel = (role: string): string => {
  const dict = DICTS[getLanguage()] ?? DICTS.ru;
  return dict[`role.${role}`] ?? role;
};

export const getRoleIconComponent = (role: string): LucideIcon => {
  switch (role) {
    case "bachelor":
    case "master":
      return GraduationCap;
    case "phd":
    case "professor":
      return Microscope;
    default:
      return BookOpen;
  }
};
