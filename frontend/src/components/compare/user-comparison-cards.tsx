import UserSelect from '@/components/user-select';
import type { User } from '@/lib/types';

interface UserComparisonCardsProps {
  leftUserId: number | null;
  rightUserId: number | null;
  onLeftUserChange: (userId: number | null) => void;
  onRightUserChange: (userId: number | null) => void;
  onLeftUserLoaded: (user: User | null) => void;
  onRightUserLoaded: (user: User | null) => void;
}

function ColumnPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-notion border border-notion-border bg-notion-bg p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-notion-text-tertiary">
        {title}
      </p>
      {children}
    </div>
  );
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
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
      <ColumnPanel title="Пользователь 1">
        <UserSelect
          selectedUserId={leftUserId}
          onUserChange={onLeftUserChange}
          onUserLoaded={onLeftUserLoaded}
          showPreviewCard={false}
        />
      </ColumnPanel>

      <ColumnPanel title="Пользователь 2">
        <UserSelect
          selectedUserId={rightUserId}
          onUserChange={onRightUserChange}
          onUserLoaded={onRightUserLoaded}
          showPreviewCard={false}
        />
      </ColumnPanel>
    </div>
  );
}
