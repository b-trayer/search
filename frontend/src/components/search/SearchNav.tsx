import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GitCompare, Settings, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import UserSelect from '@/components/UserSelect';

interface SearchNavProps {
  selectedUserId: number | null;
  onUserChange: (userId: number | null) => void;
}

export function SearchNav({ selectedUserId, onUserChange }: SearchNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="hidden md:flex items-center gap-4">
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

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[280px] bg-notion-bg">
          <SheetHeader>
            <SheetTitle className="text-notion-text">Меню</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-notion-text-secondary px-2">Пользователь</p>
              <UserSelect
                selectedUserId={selectedUserId}
                onUserChange={(id) => {
                  onUserChange(id);
                }}
              />
            </div>
            <div className="border-t border-notion-border pt-4 space-y-2">
              <Link to="/settings" onClick={() => setOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <Settings className="h-4 w-4" />
                  Настройки
                </Button>
              </Link>
              <Link to="/compare" onClick={() => setOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <GitCompare className="h-4 w-4" />
                  Сравнение
                </Button>
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
