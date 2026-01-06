import { GraduationCap, BookOpen, Microscope, LucideIcon } from "lucide-react";

export const ROLE_LABELS: Record<string, string> = {
  student: "Бакалавр",
  master: "Магистр",
  phd: "Аспирант",
  professor: "Преподаватель",
};

export const getRoleLabel = (role: string): string => ROLE_LABELS[role] || role;

export const getRoleIconComponent = (role: string): LucideIcon => {
  switch (role) {
    case "student":
    case "master":
      return GraduationCap;
    case "phd":
    case "professor":
      return Microscope;
    default:
      return BookOpen;
  }
};
