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
    student: "Студент",
    master: "Магистр",
    phd: "Аспирант",
    professor: "Профессор",
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
        <SelectTrigger className="w-72 bg-card border-border">
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Выберите пользователя" />
          </div>
        </SelectTrigger>
        <SelectContent className="max-h-80">
          <SelectItem value="__none__">
            <span className="text-muted-foreground">Без персонализации</span>
          </SelectItem>
          {users.map((user) => (
            <SelectItem key={user.user_id} value={user.user_id.toString()}>
              <div className="flex items-center gap-2">
                {getRoleIcon(user.role)}
                <span>{user.username}</span>
                <Badge variant="outline" className="text-xs ml-1">
                  {user.specialization || user.role}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {}
      {selectedUser && (
        <div className="absolute top-full right-0 mt-2 w-72 p-3 rounded-lg bg-card border border-border shadow-lg z-50 pointer-events-none animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              {getRoleIcon(selectedUser.role)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{selectedUser.username}</p>
              <p className="text-xs text-muted-foreground">
                {getRoleLabel(selectedUser.role)}
                {selectedUser.course && `, ${selectedUser.course} курс`}
              </p>
              {selectedUser.specialization && (
                <p className="text-xs text-primary mt-1">📚 {selectedUser.specialization}</p>
              )}
              {selectedUser.interests && selectedUser.interests.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedUser.interests.slice(0, 3).map((interest, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
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
