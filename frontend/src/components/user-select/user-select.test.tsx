import {
  describe,
  expect,
  it,
  vi,
  beforeEach,
  afterEach,
} from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { User } from "@/lib/api";

const { getUsersMock, updateUserInterestsMock, toastMock } = vi.hoisted(() => ({
  getUsersMock: vi.fn(),
  updateUserInterestsMock: vi.fn(),
  toastMock: vi.fn(),
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    getUsers: getUsersMock,
    updateUserInterests: updateUserInterestsMock,
  };
});

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
  toast: toastMock,
}));

import UserSelect from "./index";

const ivan: User = {
  user_id: 1,
  username: "Иван Петров",
  email: "ivan@nsu.ru",
  role: "bachelor",
  specialization: "Физика",
  faculty: "Физический факультет",
  course: 3,
  interests: ["механика"],
};

const maria: User = {
  user_id: 2,
  username: "Мария Соколова",
  email: "maria@nsu.ru",
  role: "phd",
  specialization: "Математика",
  faculty: "Механико-математический",
  course: null,
  interests: ["алгебра"],
};

describe("UserSelect", () => {
  beforeEach(() => {
    getUsersMock.mockReset();
    updateUserInterestsMock.mockReset();
    toastMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows a loading indicator while users are being fetched", () => {
    getUsersMock.mockReturnValue(new Promise(() => {}));

    render(<UserSelect selectedUserId={null} onUserChange={vi.fn()} />);

    expect(screen.getByText(/Загрузка пользователей/)).toBeInTheDocument();
  });

  it("renders an error message when getUsers rejects", async () => {
    getUsersMock.mockRejectedValueOnce(new Error("network down"));

    render(<UserSelect selectedUserId={null} onUserChange={vi.fn()} />);

    expect(
      await screen.findByText(/Не удалось загрузить пользователей/),
    ).toBeInTheDocument();
  });

  it("shows the placeholder when no user is selected", async () => {
    getUsersMock.mockResolvedValueOnce([ivan, maria]);

    render(<UserSelect selectedUserId={null} onUserChange={vi.fn()} />);

    expect(await screen.findByText(/Без персонализации/)).toBeInTheDocument();
  });

  it("hides the edit pencil button when no user is selected", async () => {
    getUsersMock.mockResolvedValueOnce([ivan, maria]);

    render(<UserSelect selectedUserId={null} onUserChange={vi.fn()} />);

    await screen.findByText(/Без персонализации/);
    expect(
      screen.queryByRole("button", { name: /Редактировать интересы/i }),
    ).not.toBeInTheDocument();
  });

  it("renders the selected user and shows the edit pencil button", async () => {
    getUsersMock.mockResolvedValueOnce([ivan, maria]);

    render(<UserSelect selectedUserId={1} onUserChange={vi.fn()} />);

    const matches = await screen.findAllByText("Иван Петров");
    expect(matches.length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: /Редактировать интересы/i }),
    ).toBeInTheDocument();
  });

  it("invokes onUserLoaded with the resolved user (and null when nothing selected)", async () => {
    getUsersMock.mockResolvedValueOnce([ivan, maria]);
    const onUserLoaded = vi.fn();

    const { rerender } = render(
      <UserSelect
        selectedUserId={1}
        onUserChange={vi.fn()}
        onUserLoaded={onUserLoaded}
      />,
    );

    await waitFor(() => {
      expect(onUserLoaded).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 1, username: "Иван Петров" }),
      );
    });

    rerender(
      <UserSelect
        selectedUserId={null}
        onUserChange={vi.fn()}
        onUserLoaded={onUserLoaded}
      />,
    );

    await waitFor(() => {
      expect(onUserLoaded).toHaveBeenLastCalledWith(null);
    });
  });

  it("calls onUserLoaded with null when selected id has no match in fetched list", async () => {
    getUsersMock.mockResolvedValueOnce([ivan, maria]);
    const onUserLoaded = vi.fn();

    render(
      <UserSelect
        selectedUserId={999}
        onUserChange={vi.fn()}
        onUserLoaded={onUserLoaded}
      />,
    );

    await waitFor(() => {
      expect(onUserLoaded).toHaveBeenCalledWith(null);
    });
  });

  it("shows preview card with selected user info", async () => {
    getUsersMock.mockResolvedValueOnce([ivan, maria]);

    render(<UserSelect selectedUserId={1} onUserChange={vi.fn()} />);

    await screen.findAllByText("Иван Петров");
    expect(screen.getByText(/Бакалавр/)).toBeInTheDocument();
    expect(screen.getByText(/Физический факультет/)).toBeInTheDocument();
    expect(screen.getByText(/Физика/)).toBeInTheDocument();
  });

  it("opens the editor dialog when clicking the pencil button", async () => {
    const user = userEvent.setup();
    getUsersMock.mockResolvedValueOnce([ivan, maria]);

    render(<UserSelect selectedUserId={1} onUserChange={vi.fn()} />);

    await screen.findAllByText("Иван Петров");
    await user.click(
      screen.getByRole("button", { name: /Редактировать интересы/i }),
    );

    expect(
      await screen.findByRole("heading", { name: /Редактирование интересов/i }),
    ).toBeInTheDocument();
  });

  it("updates local user list (and preview) after a successful save", async () => {
    const user = userEvent.setup();
    getUsersMock.mockResolvedValueOnce([ivan, maria]);
    const updated: User = { ...ivan, interests: ["лазер", "плазма"] };
    updateUserInterestsMock.mockResolvedValueOnce(updated);

    render(<UserSelect selectedUserId={1} onUserChange={vi.fn()} />);

    await screen.findAllByText("Иван Петров");
    await user.click(
      screen.getByRole("button", { name: /Редактировать интересы/i }),
    );
    await screen.findByRole("heading", { name: /Редактирование интересов/i });

    await user.click(screen.getByLabelText("Удалить «механика»"));
    await user.type(screen.getByPlaceholderText(/Например/), "лазер{Enter}");
    await user.type(screen.getByPlaceholderText(/Например/), "плазма{Enter}");
    await user.click(screen.getByRole("button", { name: /Сохранить/i }));

    await waitFor(() => {
      expect(updateUserInterestsMock).toHaveBeenCalledWith(1, [
        "лазер",
        "плазма",
      ]);
    });

    await waitFor(() => {
      expect(screen.getByText("лазер")).toBeInTheDocument();
      expect(screen.getByText("плазма")).toBeInTheDocument();
    });
  });

  it("hides the preview card while the editor dialog is open and shows it again after closing", async () => {
    const user = userEvent.setup();
    getUsersMock.mockResolvedValueOnce([ivan, maria]);

    render(<UserSelect selectedUserId={1} onUserChange={vi.fn()} />);

    await screen.findAllByText("Иван Петров");
    expect(
      screen.getAllByText(/🏛 Физический факультет/),
    ).toHaveLength(1);

    await user.click(
      screen.getByRole("button", { name: /Редактировать интересы/i }),
    );
    await screen.findByRole("heading", { name: /Редактирование интересов/i });

    expect(
      screen.getAllByText(/🏛 Физический факультет/),
    ).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: /Отмена/i }));

    await waitFor(() => {
      expect(
        screen.getAllByText(/🏛 Физический факультет/),
      ).toHaveLength(1);
    });
  });

  it("hides the preview card while the user dropdown is open and shows it again after closing", async () => {
    const user = userEvent.setup();
    getUsersMock.mockResolvedValueOnce([ivan, maria]);

    render(<UserSelect selectedUserId={1} onUserChange={vi.fn()} />);

    await screen.findAllByText("Иван Петров");
    expect(
      screen.getAllByText(/🏛 Физический факультет/),
    ).toHaveLength(1);

    const trigger = screen.getByRole("combobox");
    await user.click(trigger);

    await screen.findByRole("option", { name: /Без персонализации/i });

    expect(
      screen.queryAllByText(/🏛 Физический факультет/),
    ).toHaveLength(0);

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(
        screen.getAllByText(/🏛 Физический факультет/),
      ).toHaveLength(1);
    });
  });

  it("triggers a refetch-free re-emit of onUserLoaded after editing interests", async () => {
    const user = userEvent.setup();
    getUsersMock.mockResolvedValueOnce([ivan]);
    const updated: User = { ...ivan, interests: ["лазер"] };
    updateUserInterestsMock.mockResolvedValueOnce(updated);
    const onUserLoaded = vi.fn();

    render(
      <UserSelect
        selectedUserId={1}
        onUserChange={vi.fn()}
        onUserLoaded={onUserLoaded}
      />,
    );

    await screen.findAllByText("Иван Петров");
    onUserLoaded.mockClear();

    await user.click(
      screen.getByRole("button", { name: /Редактировать интересы/i }),
    );
    await user.type(screen.getByPlaceholderText(/Например/), "лазер{Enter}");
    await user.click(screen.getByRole("button", { name: /Сохранить/i }));

    await waitFor(() => {
      expect(onUserLoaded).toHaveBeenLastCalledWith(
        expect.objectContaining({ interests: ["лазер"] }),
      );
    });
    expect(getUsersMock).toHaveBeenCalledTimes(1);
  });
});
