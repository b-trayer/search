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
import UserSelect from '@/components/user-select';
import { HEADER_CHIP } from '@/components/layout/header-chip';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { useTranslation } from '@/lib/i18n';

interface SearchNavProps {
  selectedUserId: number | null;
  onUserChange: (userId: number | null) => void;
}

export function SearchNav({ selectedUserId, onUserChange }: SearchNavProps) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <nav className="hidden md:flex items-center gap-2">
        <LanguageSwitcher />
        <Link to="/settings" className={HEADER_CHIP}>
          <Settings className="h-4 w-4 text-notion-text-secondary" />
          {t('header.settings')}
        </Link>
        <Link to="/compare" className={HEADER_CHIP}>
          <GitCompare className="h-4 w-4 text-notion-text-secondary" />
          {t('header.compare')}
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
            <SheetTitle className="text-notion-text">{t('header.menu')}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-notion-text-secondary px-2">{t('lang.title')}</p>
              <LanguageSwitcher className="px-2" />
            </div>
            <div className="border-t border-notion-border pt-4 space-y-2">
              <p className="text-sm text-notion-text-secondary px-2">{t('header.userPicker')}</p>
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
                  {t('header.settings')}
                </Button>
              </Link>
              <Link to="/compare" onClick={() => setOpen(false)}>
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <GitCompare className="h-4 w-4" />
                  {t('header.compare')}
                </Button>
              </Link>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
