import { useEffect, useState } from "react";
import { User as UserIcon, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getUsers, User } from "@/lib/api";
import { getRoleLabel, getRoleIconComponent } from "./user-role-utils";
import { UserPreviewCard } from "./user-preview-card";

interface UserSelectProps {
  selectedUserId: number | null;
  onUserChange: (userId: number | null) => void;
  onUserLoaded?: (user: User | null) => void;
}

const UserSelect = ({ selectedUserId, onUserChange, onUserLoaded }: UserSelectProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="relative">
      <Select
        value={selectedUserId?.toString() || "__none__"}
        onValueChange={(v) => onUserChange(v === "__none__" ? null : parseInt(v, 10))}
      >
        <SelectTrigger className="w-[420px] bg-card border-border">
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            {selectedUser ? (
              <span>{selectedUser.username}</span>
            ) : (
              <span className="text-muted-foreground">
                {selectedUserId === null ? "Без персонализации" : "Выберите пользователя"}
              </span>
            )}
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-80 w-[420px]" align="end">
          <SelectItem value="__none__">
            <span className="text-muted-foreground">Без персонализации</span>
          </SelectItem>
          {users.map((user) => {
            const RoleIcon = getRoleIconComponent(user.role);
            return (
              <SelectItem key={user.user_id} value={user.user_id.toString()} className="py-2" textValue={user.username}>
                <div className="flex flex-col gap-1 w-full">
                  <div className="flex items-center gap-2">
                    <RoleIcon className="h-3 w-3" />
                    <span className="font-medium">{user.username}</span>
                  </div>
                  <div className="flex items-center gap-2 ml-5">
                    <Badge variant="secondary" className="text-xs">{getRoleLabel(user.role)}</Badge>
                    {user.specialization && (
                      <Badge variant="outline" className="text-xs border-border bg-background">{user.specialization}</Badge>
                    )}
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {selectedUser && <UserPreviewCard user={selectedUser} />}
    </div>
  );
};

export default UserSelect;
