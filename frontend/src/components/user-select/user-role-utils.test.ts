import { describe, expect, it } from "vitest";
import { GraduationCap, BookOpen, Microscope } from "lucide-react";
import {
  ROLE_LABELS,
  getRoleLabel,
  getRoleIconComponent,
} from "./user-role-utils";

describe("ROLE_LABELS", () => {
  it("contains Russian labels for all known roles", () => {
    expect(ROLE_LABELS.bachelor).toBe("Бакалавр");
    expect(ROLE_LABELS.master).toBe("Магистр");
    expect(ROLE_LABELS.phd).toBe("Аспирант");
    expect(ROLE_LABELS.professor).toBe("Преподаватель");
  });
});

describe("getRoleLabel", () => {
  it.each([
    ["bachelor", "Бакалавр"],
    ["master", "Магистр"],
    ["phd", "Аспирант"],
    ["professor", "Преподаватель"],
  ])("maps %s to %s", (role, expected) => {
    expect(getRoleLabel(role)).toBe(expected);
  });

  it("falls back to raw value for unknown role", () => {
    expect(getRoleLabel("alien")).toBe("alien");
  });

  it("falls back to raw value for empty string", () => {
    expect(getRoleLabel("")).toBe("");
  });
});

describe("getRoleIconComponent", () => {
  it("returns GraduationCap for bachelor and master", () => {
    expect(getRoleIconComponent("bachelor")).toBe(GraduationCap);
    expect(getRoleIconComponent("master")).toBe(GraduationCap);
  });

  it("returns Microscope for phd and professor", () => {
    expect(getRoleIconComponent("phd")).toBe(Microscope);
    expect(getRoleIconComponent("professor")).toBe(Microscope);
  });

  it("returns BookOpen as fallback for unknown role", () => {
    expect(getRoleIconComponent("unknown")).toBe(BookOpen);
    expect(getRoleIconComponent("")).toBe(BookOpen);
  });
});
