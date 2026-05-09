import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ApiError, updateUserInterests } from "@/lib/api";
import type { User } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/lib/i18n';

import { getRoleLabel } from "./user-role-utils";

const MAX_INTERESTS = 20;
const MAX_INTEREST_LENGTH = 50;

interface InterestsEditorDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (user: User) => void;
}

export const InterestsEditorDialog = ({
  user,
  open,
  onOpenChange,
  onSaved,
}: InterestsEditorDialogProps) => {
  const initial = useMemo(() => user.interests ?? [], [user.interests]);

  const [items, setItems] = useState<string[]>(initial);
  const [draft, setDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { t, plural } = useTranslation();

  useEffect(() => {
    if (open) {
      setItems(initial);
      setDraft("");
    }
  }, [open, initial]);

  const isDirty = useMemo(() => {
    if (items.length !== initial.length) return true;
    return items.some((value, idx) => value !== initial[idx]);
  }, [items, initial]);

  const trimmedDraft = draft.trim();
  const draftConflict =
    trimmedDraft.length > 0 &&
    items.some((value) => value.toLowerCase() === trimmedDraft.toLowerCase());
  const draftTooLong = trimmedDraft.length > MAX_INTEREST_LENGTH;
  const limitReached = items.length >= MAX_INTERESTS;

  const canAdd =
    trimmedDraft.length > 0 && !draftConflict && !draftTooLong && !limitReached;

  const handleAdd = () => {
    if (!canAdd) return;
    setItems((prev) => [...prev, trimmedDraft]);
    setDraft("");
  };

  const handleRemove = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await updateUserInterests(user.user_id, items);
      onSaved(updated);
      const savedCount = updated.interests?.length ?? 0;
      toast({
        title: t('interests.savedTitle'),
        description: t('interests.savedDesc', {
          count: savedCount,
          noun: plural('interests.savedNoun', savedCount),
        }),
      });
      onOpenChange(false);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.getUserMessage()
          : t('interests.errorFallback');
      toast({
        title: t('interests.errorTitle'),
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('interests.title')}</DialogTitle>
          <DialogDescription>
            {t('interests.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-notion border border-border bg-muted/30 p-3 space-y-1 text-sm">
          <div className="font-medium">{user.username}</div>
          <div className="text-muted-foreground text-xs">
            {getRoleLabel(user.role)}
            {user.course ? `, ${t('preview.userCourse', { n: user.course })}` : ""}
          </div>
          {user.faculty && (
            <div className="text-muted-foreground text-xs">🏛 {user.faculty}</div>
          )}
          {user.specialization && (
            <div className="text-primary text-xs">📚 {user.specialization}</div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t('interests.list')}</span>
            <span>
              {items.length} / {MAX_INTERESTS}
            </span>
          </div>

          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              {t('interests.empty')}
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {items.map((value, idx) => (
                <Badge
                  key={`${value}-${idx}`}
                  variant="secondary"
                  className="gap-1 pr-1"
                >
                  <span>{value}</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="rounded-full p-0.5 hover:bg-background/60"
                    aria-label={t('interests.removeAria', { value })}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              placeholder={t('interests.placeholder')}
              maxLength={MAX_INTEREST_LENGTH + 10}
              disabled={limitReached}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAdd}
              disabled={!canAdd}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              {t('common.add')}
            </Button>
          </div>

          {draftConflict && (
            <p className="text-xs text-amber-600">{t('interests.duplicate')}</p>
          )}
          {draftTooLong && (
            <p className="text-xs text-destructive">
              {t('interests.tooLong', { count: MAX_INTEREST_LENGTH })}
            </p>
          )}
          {limitReached && (
            <p className="text-xs text-amber-600">
              {t('interests.limitReached', { count: MAX_INTERESTS })}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!isDirty || isSaving} className="gap-2">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
