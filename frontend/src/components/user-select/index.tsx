import { useEffect, useState } from "react";
import { User as UserIcon, Loader2, Pencil } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getUsers, User } from "@/lib/api";
import { getRoleLabel, getRoleIconComponent } from "./user-role-utils";
import { UserPreviewCard } from "./user-preview-card";
import { InterestsEditorDialog } from "./interests-editor-dialog";

interface UserSelectProps {
  selectedUserId: number | null;
  onUserChange: (userId: number | null) => void;
  onUserLoaded?: (user: User | null) => void;
  showPreviewCard?: boolean;
}

const UserSelect = ({
  selectedUserId,
  onUserChange,
  onUserLoaded,
  showPreviewCard = true,
}: UserSelectProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);

  useEffect(() => {
    getUsers(undefined, 130)
      .then(setUsers)
      .catch(() => setError("Не удалось загрузить пользователей"))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (onUserLoaded) {
      onUserLoaded(users.find((u) => u.user_id === selectedUserId) || null);
    }
  }, [selectedUserId, users, onUserLoaded]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Загрузка пользователей...</span>
      </div>
    );
  }
  if (error) return <div className="text-sm text-red-500">{error}</div>;

  const selectedUser = users.find((u) => u.user_id === selectedUserId);

  const handleUserSaved = (updated: User) => {
    setUsers((prev) =>
      prev.map((u) => (u.user_id === updated.user_id ? updated : u)),
    );
  };

  return (
    <div className="relative flex items-center gap-2">
      <Select
        value={selectedUserId?.toString() || "__none__"}
        onValueChange={(v) => onUserChange(v === "__none__" ? null : parseInt(v, 10))}
        open={selectOpen}
        onOpenChange={setSelectOpen}
      >
        <SelectTrigger className="w-[280px] h-9 px-3 rounded-notion border border-notion-border bg-notion-bg text-sm font-medium text-notion-text hover:bg-notion-bg-hover transition-colors focus:ring-0 focus:ring-offset-0">
          <div className="flex items-center gap-2 min-w-0">
            <UserIcon className="h-4 w-4 text-notion-text-secondary shrink-0" />
            {selectedUser ? (
              <span className="truncate">{selectedUser.username}</span>
            ) : (
              <span className="text-notion-text-secondary truncate">
                {selectedUserId === null ? "Без персонализации" : "Выберите пользователя"}
              </span>
            )}
          </div>
        </SelectTrigger>
        <SelectContent
          className="max-h-80 w-[324px] rounded-notion border border-notion-border bg-notion-bg p-1 shadow-notion-md"
          align="start"
        >
          <SelectItem
            value="__none__"
            className="rounded-notion pl-2 py-1.5 text-sm text-notion-text-secondary focus:bg-notion-bg-hover focus:text-notion-text data-[state=checked]:bg-notion-bg-active [&>span:first-child]:hidden"
          >
            Без персонализации
          </SelectItem>
          {users.map((user) => {
            const RoleIcon = getRoleIconComponent(user.role);
            return (
              <SelectItem
                key={user.user_id}
                value={user.user_id.toString()}
                className="rounded-notion pl-2 py-2 text-sm focus:bg-notion-bg-hover focus:text-notion-text data-[state=checked]:bg-notion-bg-active [&>span:first-child]:hidden"
                textValue={user.username}
              >
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex items-center gap-2 text-notion-text">
                    <RoleIcon className="h-3.5 w-3.5 text-notion-text-secondary" />
                    <span className="font-medium">{user.username}</span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-[22px]">
                    <Badge
                      variant="outline"
                      className="text-xs font-normal border-notion-border bg-notion-bg-secondary text-notion-text-secondary"
                    >
                      {getRoleLabel(user.role)}
                    </Badge>
                    {user.specialization && (
                      <Badge
                        variant="outline"
                        className="text-xs font-normal border-notion-border bg-notion-bg-secondary text-notion-text-secondary"
                      >
                        {user.specialization}
                      </Badge>
                    )}
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {selectedUser && (
        <button
          type="button"
          onClick={() => setEditorOpen(true)}
          title="Редактировать интересы"
          aria-label="Редактировать интересы"
          className="inline-flex items-center justify-center h-9 w-9 shrink-0 rounded-notion border border-notion-border bg-notion-bg text-notion-text-secondary hover:bg-notion-bg-hover hover:text-notion-text transition-colors"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}

      {showPreviewCard && selectedUser && !selectOpen && !editorOpen && (
        <UserPreviewCard user={selectedUser} />
      )}

      {selectedUser && (
        <InterestsEditorDialog
          user={selectedUser}
          open={editorOpen}
          onOpenChange={setEditorOpen}
          onSaved={handleUserSaved}
        />
      )}
    </div>
  );
};

export default UserSelect;
