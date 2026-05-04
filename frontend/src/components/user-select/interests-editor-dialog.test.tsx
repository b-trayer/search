import {
  describe,
  expect,
  it,
  vi,
  beforeEach,
  afterEach,
} from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { User } from "@/lib/api";
import { ApiError } from "@/lib/api";

const { updateUserInterestsMock, toastMock } = vi.hoisted(() => ({
  updateUserInterestsMock: vi.fn(),
  toastMock: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    updateUserInterests: updateUserInterestsMock,
  };
});

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
  toast: toastMock,
}));

import { InterestsEditorDialog } from "./interests-editor-dialog";

const baseUser: User = {
  user_id: 42,
  username: "Иван Петров",
  email: "ivan@nsu.ru",
  role: "bachelor",
  specialization: "Физика",
  faculty: "Физический факультет",
  course: 3,
  interests: ["механика", "оптика"],
};

function renderDialog(overrides: Partial<{
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (user: User) => void;
}> = {}) {
  const onOpenChange = overrides.onOpenChange ?? vi.fn();
  const onSaved = overrides.onSaved ?? vi.fn();
  const user = overrides.user ?? baseUser;
  const open = overrides.open ?? true;

  const utils = render(
    <InterestsEditorDialog
      user={user}
      open={open}
      onOpenChange={onOpenChange}
      onSaved={onSaved}
    />,
  );

  return { ...utils, onOpenChange, onSaved };
}

describe("InterestsEditorDialog", () => {
  beforeEach(() => {
    updateUserInterestsMock.mockReset();
    toastMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders read-only user info: name, role, course, faculty, specialization", () => {
    renderDialog();

    expect(screen.getByText("Иван Петров")).toBeInTheDocument();
    expect(screen.getByText(/Бакалавр/)).toBeInTheDocument();
    expect(screen.getByText(/3 курс/)).toBeInTheDocument();
    expect(screen.getByText(/Физический факультет/)).toBeInTheDocument();
    expect(screen.getByText(/📚 Физика/)).toBeInTheDocument();
  });

  it("renders existing interests as removable badges", () => {
    renderDialog();

    expect(screen.getByText("механика")).toBeInTheDocument();
    expect(screen.getByText("оптика")).toBeInTheDocument();
    expect(screen.getByLabelText("Удалить «механика»")).toBeInTheDocument();
    expect(screen.getByLabelText("Удалить «оптика»")).toBeInTheDocument();
  });

  it("shows empty-state hint when interests are missing", () => {
    renderDialog({ user: { ...baseUser, interests: [] } });

    expect(
      screen.getByText(/Список пуст\. Добавьте темы/),
    ).toBeInTheDocument();
  });

  it("disables Save until something changes", async () => {
    const user = userEvent.setup();
    renderDialog();

    const saveBtn = screen.getByRole("button", { name: /Сохранить/i });
    expect(saveBtn).toBeDisabled();

    await user.click(screen.getByLabelText("Удалить «оптика»"));

    expect(saveBtn).toBeEnabled();
  });

  it("adds a new interest via the Add button", async () => {
    const user = userEvent.setup();
    renderDialog();

    const input = screen.getByPlaceholderText(/Например/);
    await user.type(input, "  плазма  ");

    const addBtn = screen.getByRole("button", { name: /Добавить/i });
    expect(addBtn).toBeEnabled();

    await user.click(addBtn);

    expect(screen.getByText("плазма")).toBeInTheDocument();
    expect(input).toHaveValue("");
  });

  it("adds a new interest via Enter key", async () => {
    const user = userEvent.setup();
    renderDialog();

    const input = screen.getByPlaceholderText(/Например/);
    await user.type(input, "лазер{Enter}");

    expect(screen.getAllByText("лазер").length).toBeGreaterThan(0);
  });

  it("removes an interest when clicking its X button", async () => {
    const user = userEvent.setup();
    renderDialog();

    expect(screen.getByText("механика")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Удалить «механика»"));
    expect(screen.queryByText("механика")).not.toBeInTheDocument();
  });

  it("blocks duplicate (case-insensitive) and shows a hint", async () => {
    const user = userEvent.setup();
    renderDialog();

    const input = screen.getByPlaceholderText(/Например/);
    await user.type(input, "МЕХАНИКА");

    expect(screen.getByText(/уже добавлен/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Добавить/i })).toBeDisabled();
  });

  it("blocks adding a value longer than the limit", async () => {
    const user = userEvent.setup();
    renderDialog();

    const input = screen.getByPlaceholderText(/Например/);
    await user.type(input, "x".repeat(55));

    expect(screen.getByText(/Максимум 50 символов/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Добавить/i })).toBeDisabled();
  });

  it("disables input and shows hint when reaching the 20-item limit", () => {
    const interests = Array.from({ length: 20 }, (_, i) => `int_${i}`);
    renderDialog({ user: { ...baseUser, interests } });

    expect(screen.getByText(/лимит в 20 интересов/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Например/)).toBeDisabled();
    expect(screen.getByRole("button", { name: /Добавить/i })).toBeDisabled();
  });

  it("calls API and onSaved on successful save, then closes dialog", async () => {
    const user = userEvent.setup();
    const updated: User = {
      ...baseUser,
      interests: ["механика"],
    };
    updateUserInterestsMock.mockResolvedValueOnce(updated);

    const { onSaved, onOpenChange } = renderDialog();

    await user.click(screen.getByLabelText("Удалить «оптика»"));
    await user.click(screen.getByRole("button", { name: /Сохранить/i }));

    await waitFor(() => {
      expect(updateUserInterestsMock).toHaveBeenCalledWith(42, ["механика"]);
    });
    expect(onSaved).toHaveBeenCalledWith(updated);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Интересы обновлены" }),
    );
  });

  it("does not close the dialog and shows error toast on API failure", async () => {
    const user = userEvent.setup();
    updateUserInterestsMock.mockRejectedValueOnce(
      new ApiError("Database is down", 500, "DATABASE_ERROR"),
    );

    const { onSaved, onOpenChange } = renderDialog();

    await user.click(screen.getByLabelText("Удалить «оптика»"));
    await user.click(screen.getByRole("button", { name: /Сохранить/i }));

    await waitFor(() => {
      expect(updateUserInterestsMock).toHaveBeenCalledTimes(1);
    });

    expect(onSaved).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Ошибка сохранения",
        variant: "destructive",
      }),
    );
  });

  it("falls back to a generic message for non-ApiError failures", async () => {
    const user = userEvent.setup();
    updateUserInterestsMock.mockRejectedValueOnce(new Error("boom"));

    renderDialog();

    await user.click(screen.getByLabelText("Удалить «оптика»"));
    await user.click(screen.getByRole("button", { name: /Сохранить/i }));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Ошибка сохранения",
          description: "Не удалось сохранить интересы",
        }),
      );
    });
  });

  it("Cancel button closes the dialog without calling API", async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderDialog();

    await user.click(screen.getByRole("button", { name: /Отмена/i }));

    expect(updateUserInterestsMock).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("displays counter as N / 20", () => {
    renderDialog();
    const counter = screen.getByText(/2 \/ 20/);
    expect(counter).toBeInTheDocument();

    const sectionLabel = within(counter.parentElement as HTMLElement).getByText(
      /Интересы/,
    );
    expect(sectionLabel).toBeInTheDocument();
  });
});
