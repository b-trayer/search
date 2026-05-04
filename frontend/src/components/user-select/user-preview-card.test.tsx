import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import type { User } from "@/lib/api";
import { UserPreviewCard } from "./user-preview-card";

const baseUser: User = {
  user_id: 1,
  username: "Иван Петров",
  email: "ivan@nsu.ru",
  role: "bachelor",
  specialization: "Физика",
  faculty: "Физический факультет",
  course: 3,
  interests: ["механика", "оптика", "лазер"],
};

describe("UserPreviewCard", () => {
  it("renders username and Russian role label with course", () => {
    render(<UserPreviewCard user={baseUser} />);

    expect(screen.getByText("Иван Петров")).toBeInTheDocument();
    expect(screen.getByText(/Бакалавр/)).toBeInTheDocument();
    expect(screen.getByText(/3 курс/)).toBeInTheDocument();
  });

  it("renders faculty and specialization rows", () => {
    render(<UserPreviewCard user={baseUser} />);

    expect(screen.getByText(/Физический факультет/)).toBeInTheDocument();
    expect(screen.getByText(/Физика/)).toBeInTheDocument();
  });

  it("renders only the first three interests", () => {
    const user: User = {
      ...baseUser,
      interests: ["a", "b", "c", "d", "e"],
    };
    render(<UserPreviewCard user={user} />);

    expect(screen.getByText("a")).toBeInTheDocument();
    expect(screen.getByText("b")).toBeInTheDocument();
    expect(screen.getByText("c")).toBeInTheDocument();
    expect(screen.queryByText("d")).not.toBeInTheDocument();
    expect(screen.queryByText("e")).not.toBeInTheDocument();
  });

  it("hides course suffix when course is null", () => {
    render(
      <UserPreviewCard user={{ ...baseUser, course: null }} />,
    );

    expect(screen.queryByText(/курс/)).not.toBeInTheDocument();
  });

  it("hides faculty/specialization when missing", () => {
    render(
      <UserPreviewCard
        user={{ ...baseUser, faculty: null, specialization: null }}
      />,
    );

    expect(screen.queryByText(/🏛/)).not.toBeInTheDocument();
    expect(screen.queryByText(/📚/)).not.toBeInTheDocument();
  });

  it("hides interests block when list is empty", () => {
    const { container } = render(
      <UserPreviewCard user={{ ...baseUser, interests: [] }} />,
    );

    expect(container.querySelectorAll(".flex-wrap").length).toBe(0);
  });

  it("hides interests block when interests is null", () => {
    const { container } = render(
      <UserPreviewCard user={{ ...baseUser, interests: null }} />,
    );

    expect(container.querySelectorAll(".flex-wrap").length).toBe(0);
  });
});
