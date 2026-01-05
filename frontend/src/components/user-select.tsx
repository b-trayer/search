import { useEffect, useState } from "react";
import { User as UserIcon, Loader2, GraduationCap, BookOpen, Microscope } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { getUsers, User } from "@/lib/api";

interface UserSelectProps {
  selectedUserId: number | null;
  onUserChange: (userId: number | null) => void;
  onUserLoaded?: (user: User | null) => void;
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case "student":
    case "master":
      return <GraduationCap className="h-3 w-3" />;
    case "phd":
    case "professor":
      return <Microscope className="h-3 w-3" />;
    default:
      return <BookOpen className="h-3 w-3" />;
  }
};

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    student: "Бакалавр",
    master: "Магистр",
    phd: "Аспирант",
    professor: "Преподаватель",
  };
  return labels[role] || role;
};

const UserSelect = ({ selectedUserId, onUserChange, onUserLoaded }: UserSelectProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getUsers(undefined, 130);
        setUsers(data);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setError("Не удалось загрузить пользователей");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);


  useEffect(() => {
    if (onUserLoaded) {
      const selectedUser = users.find((u) => u.user_id === selectedUserId) || null;
      onUserLoaded(selectedUser);
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

  if (error) {
    return <div className="text-sm text-red-500">{error}</div>;
  }

  const selectedUser = users.find((u) => u.user_id === selectedUserId);

  return (
    <div className="relative">
      <Select
        value={selectedUserId?.toString() || "__none__"}
        onValueChange={(value) => onUserChange(value === "__none__" ? null : parseInt(value, 10))}
      >
        <SelectTrigger className="w-[420px] bg-card border-border">
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            {selectedUser ? (
              <span>{selectedUser.username}</span>
            ) : selectedUserId === null ? (
              <span className="text-muted-foreground">Без персонализации</span>
            ) : (
              <span className="text-muted-foreground">Выберите пользователя</span>
            )}
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-80 w-[420px]" align="end">
          <SelectItem value="__none__">
            <span className="text-muted-foreground">Без персонализации</span>
          </SelectItem>
          {users.map((user) => (
            <SelectItem key={user.user_id} value={user.user_id.toString()} className="py-2" textValue={user.username}>
              <div className="flex flex-col gap-1 w-full">
                <div className="flex items-center gap-2">
                  {getRoleIcon(user.role)}
                  <span className="font-medium">{user.username}</span>
                </div>
                <div className="flex items-center gap-2 ml-5">
                  <Badge variant="secondary" className="text-xs">
                    {getRoleLabel(user.role)}
                  </Badge>
                  {user.specialization && (
                    <Badge variant="outline" className="text-xs border-border bg-background">
                      {user.specialization}
                    </Badge>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {}
      {selectedUser && (
        <div className="absolute top-full right-0 mt-2 w-[420px] p-3 rounded-lg bg-card border border-border shadow-lg z-50 pointer-events-none animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              {getRoleIcon(selectedUser.role)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{selectedUser.username}</p>
              <p className="text-xs text-muted-foreground">
                {getRoleLabel(selectedUser.role)}
                {selectedUser.course && `, ${selectedUser.course} курс`}
              </p>
              {selectedUser.faculty && (
                <p className="text-xs text-muted-foreground mt-1">🏛 {selectedUser.faculty}</p>
              )}
              {selectedUser.specialization && (
                <p className="text-xs text-primary">📚 {selectedUser.specialization}</p>
              )}
              {selectedUser.interests && selectedUser.interests.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedUser.interests.slice(0, 3).map((interest, i) => (
                    <Badge key={i} variant="secondary" className="text-xs text-center justify-center">
                      {interest}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSelect;
