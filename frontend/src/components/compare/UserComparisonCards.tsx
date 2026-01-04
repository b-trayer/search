import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import UserSelect from '@/components/UserSelect';
import type { User } from '@/lib/types';

interface UserComparisonCardsProps {
  leftUserId: number | null;
  rightUserId: number | null;
  onLeftUserChange: (userId: number | null) => void;
  onRightUserChange: (userId: number | null) => void;
  onLeftUserLoaded: (user: User | null) => void;
  onRightUserLoaded: (user: User | null) => void;
}

export function UserComparisonCards({
  leftUserId,
  rightUserId,
  onLeftUserChange,
  onRightUserChange,
  onLeftUserLoaded,
  onRightUserLoaded,
}: UserComparisonCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
      <Card className="border-notion-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-notion-text-secondary">
            Пользователь 1
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UserSelect
            selectedUserId={leftUserId}
            onUserChange={onLeftUserChange}
            onUserLoaded={onLeftUserLoaded}
          />
        </CardContent>
      </Card>

      <Card className="border-notion-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-notion-text-secondary">
            Пользователь 2
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UserSelect
            selectedUserId={rightUserId}
            onUserChange={onRightUserChange}
            onUserLoaded={onRightUserLoaded}
          />
        </CardContent>
      </Card>
    </div>
  );
}
