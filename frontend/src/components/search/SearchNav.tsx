import { Link } from 'react-router-dom';
import { GitCompare, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UserSelect from '@/components/UserSelect';

interface SearchNavProps {
  selectedUserId: number | null;
  onUserChange: (userId: number | null) => void;
}

export function SearchNav({ selectedUserId, onUserChange }: SearchNavProps) {
  return (
    <nav className="flex items-center gap-4">
      <Link to="/settings">
        <Button variant="outline" size="sm" className="gap-2 rounded-notion">
          <Settings className="h-4 w-4" />
          Настройки
        </Button>
      </Link>
      <Link to="/compare">
        <Button variant="outline" size="sm" className="gap-2 rounded-notion">
          <GitCompare className="h-4 w-4" />
          Сравнение
        </Button>
      </Link>
      <UserSelect
        selectedUserId={selectedUserId}
        onUserChange={onUserChange}
      />
    </nav>
  );
}
