import { Badge } from "@/components/ui/badge";
import type { User } from "@/lib/api";
import { getRoleLabel, getRoleIconComponent } from "./user-role-utils";

interface UserPreviewCardProps {
  user: User;
}

export const UserPreviewCard = ({ user }: UserPreviewCardProps) => {
  const RoleIcon = getRoleIconComponent(user.role);

  return (
    <div className="absolute top-full right-0 mt-2 w-[420px] p-3 rounded-lg bg-card border border-border shadow-lg z-50 pointer-events-none animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <RoleIcon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{user.username}</p>
          <p className="text-xs text-muted-foreground">
            {getRoleLabel(user.role)}
            {user.course && `, ${user.course} курс`}
          </p>
          {user.faculty && (
            <p className="text-xs text-muted-foreground mt-1">🏛 {user.faculty}</p>
          )}
          {user.specialization && (
            <p className="text-xs text-primary">📚 {user.specialization}</p>
          )}
          {user.interests && user.interests.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {user.interests.slice(0, 3).map((interest, i) => (
                <Badge key={i} variant="secondary" className="text-xs text-center justify-center">
                  {interest}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
