import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Icon,
  Button,
  StatusBadge,
  useToast,
  useConfirm,
} from '@cp/ui';
import { DayOfWeek, IStudentScheduleSession, ICreateStudentSchedulePayload } from '@cp/shared';

import {
  useStudentSchedule,
  useAddCustomSession,
  useUpdateCustomSession,
  useDeleteCustomSession,
  useClearCustomSchedule,
} from '../../../api/studentSchedule.queries';

const DAY_ORDER: DayOfWeek[] = [
  DayOfWeek.MON,
  DayOfWeek.TUE,
  DayOfWeek.WED,
  DayOfWeek.THU,
  DayOfWeek.FRI,
  DayOfWeek.SAT,
  DayOfWeek.SUN,
];

const formatTime = (t: string) => t.split(':').slice(0, 2).join(':');

interface Props {
  /** The student's user-ID (from enrollment / StudentProfile.userId) */
  studentId: string;
}

// ── Modal for add/edit ──────────────────────────────────────────────────

interface SessionFormData {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;

  note: string;
}

function SessionModal({
  open,
  editing,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  editing: IStudentScheduleSession | null;
  onClose: () => void;
  onSubmit: (data: SessionFormData) => void;
  isSubmitting: boolean;
}) {
  const { t } = useTranslation();
  const pfx = 'pages.admin.studentProfile.schedule';

  const [form, setForm] = useState<SessionFormData>(() => ({
    dayOfWeek: editing?.dayOfWeek ?? DayOfWeek.MON,
    startTime: editing ? formatTime(editing.startTime) : '08:00',
    endTime: editing ? formatTime(editing.endTime) : '09:00',

    note: editing?.note ?? '',
  }));

  const update = useCallback(
    <K extends keyof SessionFormData>(key: K, value: SessionFormData[K]) =>
      setForm((prev) => ({ ...prev, [key]: value })),
    [],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/50" onClick={onClose}>
      <div
        className="bg-surface-container-lowest rounded-2xl shadow-elev-3 w-full max-w-md mx-md animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-lg pt-lg pb-sm">
          <h3 className="font-manrope text-headline-sm text-on-surface">
            {editing ? t(`${pfx}.editSession`) : t(`${pfx}.addSession`)}
          </h3>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-surface-container-high">
            <Icon name="close" size={20} />
          </button>
        </header>

        <form
          className="px-lg pb-lg flex flex-col gap-md"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(form);
          }}
        >
          {/* Day */}
          <label className="flex flex-col gap-xs">
            <span className="text-label-sm text-on-surface-variant">{t(`${pfx}.fields.dayOfWeek`)}</span>
            <select
              className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface"
              value={form.dayOfWeek}
              onChange={(e) => update('dayOfWeek', e.target.value as DayOfWeek)}
            >
              {DAY_ORDER.map((d) => (
                <option key={d} value={d}>
                  {t(`enums.dayOfWeek.${d}`)}
                </option>
              ))}
            </select>
          </label>

          {/* Time row */}
          <div className="grid grid-cols-2 gap-md">
            <label className="flex flex-col gap-xs">
              <span className="text-label-sm text-on-surface-variant">{t(`${pfx}.fields.startTime`)}</span>
              <input
                type="time"
                className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface"
                value={form.startTime}
                onChange={(e) => update('startTime', e.target.value)}
                required
              />
            </label>
            <label className="flex flex-col gap-xs">
              <span className="text-label-sm text-on-surface-variant">{t(`${pfx}.fields.endTime`)}</span>
              <input
                type="time"
                className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface"
                value={form.endTime}
                onChange={(e) => update('endTime', e.target.value)}
                required
              />
            </label>
          </div>


          {/* Note */}
          <label className="flex flex-col gap-xs">
            <span className="text-label-sm text-on-surface-variant">{t(`${pfx}.fields.note`)}</span>
            <textarea
              className="bg-surface-container-low border border-outline-variant rounded-lg px-md py-sm text-body-md text-on-surface resize-none"
              rows={2}
              value={form.note}
              onChange={(e) => update('note', e.target.value)}
            />
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-sm pt-sm">
            <Button variant="ghost" type="button" onClick={onClose}>
              {t(`${pfx}.cancel`)}
            </Button>
            <Button variant="admin" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Icon name="progress_activity" size={18} className="animate-spin" />
              ) : (
                t(`${pfx}.save`)
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main tab component ──────────────────────────────────────────────────

export default function StudentScheduleTab({ studentId }: Props) {
  const { t } = useTranslation();
  const toast = useToast();
  const pfx = 'pages.admin.studentProfile.schedule';

  const scheduleQuery = useStudentSchedule(studentId);
  const addSession = useAddCustomSession(studentId);
  const updateSession = useUpdateCustomSession(studentId);
  const deleteSession = useDeleteCustomSession(studentId);
  const clearCustom = useClearCustomSchedule(studentId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<IStudentScheduleSession | null>(null);

  const handleOpenAdd = useCallback(() => {
    setEditingSession(null);
    setIsModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((session: IStudentScheduleSession) => {
    setEditingSession(session);
    setIsModalOpen(true);
  }, []);

  const handleSubmit = useCallback(
    async (data: SessionFormData) => {
      const payload: ICreateStudentSchedulePayload = {
        classId: null,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,

        ...(data.note ? { note: data.note } : {}),
      };

      try {
        if (editingSession) {
          await updateSession.mutateAsync({ sessionId: editingSession.id, payload });
          toast.success(t(`${pfx}.updatedToast`));
        } else {
          await addSession.mutateAsync(payload);
          toast.success(t(`${pfx}.addedToast`));
        }
        setIsModalOpen(false);
        setEditingSession(null);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || err.message || 'Error');
      }
    },
    [editingSession, addSession, updateSession, toast, t],
  );

  const confirm = useConfirm();

  const handleDelete = useCallback(
    async (sessionId: string) => {
      const ok = await confirm({
        title: t('common.confirmDelete', 'Xác nhận xoá'),
        message: t(`${pfx}.deleteConfirm`),
        intent: 'danger'
      });
      if (!ok) return;
      try {
        await deleteSession.mutateAsync(sessionId);
        toast.success(t(`${pfx}.deletedToast`));
      } catch (err: any) {
        toast.error(err?.response?.data?.message || err.message || 'Error');
      }
    },
    [deleteSession, toast, t, confirm],
  );

  const handleClearAll = useCallback(async () => {
    const ok = await confirm({
      title: t('common.confirmDelete', 'Xác nhận xoá'),
      message: t(`${pfx}.resetConfirm`),
      intent: 'warning'
    });
    if (!ok) return;
    try {
      await clearCustom.mutateAsync();
      toast.success(t(`${pfx}.clearedToast`));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err.message || 'Error');
    }
  }, [clearCustom, toast, t, confirm]);

  // Loading state
  if (scheduleQuery.isLoading) {
    return (
      <div className="p-xl text-center text-on-surface-variant">
        <Icon name="progress_activity" size={28} className="animate-spin mx-auto" />
      </div>
    );
  }

  const schedule = scheduleQuery.data;
  if (!schedule) {
    return (
      <div className="p-xl text-center text-on-surface-variant">
        {t(`${pfx}.empty`)}
      </div>
    );
  }

  const { isCustom, sessions } = schedule;

  // Group sessions by day for the mini timetable
  const groupByDay = (items: IStudentScheduleSession[]) => {
    const map = new Map<DayOfWeek, IStudentScheduleSession[]>();
    for (const s of items) {
      const arr = map.get(s.dayOfWeek) ?? [];
      arr.push(s);
      map.set(s.dayOfWeek, arr);
    }
    return map;
  };

  const effectiveByDay = groupByDay(sessions);
  return (
    <div className="p-md md:p-lg flex flex-col gap-lg">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-sm">
        <div className="flex items-center gap-sm">
          <h4 className="font-manrope text-headline-md text-on-surface">
            {t(`${pfx}.effectiveSchedule`)}
          </h4>
          <StatusBadge tone={isCustom ? 'warning' : 'info'}>
            {isCustom ? t(`${pfx}.customBadge`) : t(`${pfx}.emptyBadge`)}
          </StatusBadge>
        </div>
        <div className="flex items-center gap-sm flex-wrap">
          {isCustom && (
            <Button
              variant="ghost"
              size="sm"
              leadingIcon={<Icon name="restart_alt" size={16} />}
              onClick={handleClearAll}
              disabled={clearCustom.isPending}
            >
              {t(`${pfx}.resetBtn`)}
            </Button>
          )}
          <Button
            variant="admin"
            size="sm"
            leadingIcon={<Icon name="add" size={16} />}
            onClick={handleOpenAdd}
          >
            {t(`${pfx}.addSession`)}
          </Button>
        </div>
      </div>

      {/* Effective timetable */}
      {sessions.length === 0 ? (
        <div className="text-center py-xl text-on-surface-variant text-body-md">
          <Icon name="event_busy" size={36} className="mx-auto mb-sm opacity-50" />
          <p>{isCustom ? t(`${pfx}.emptyCustom`) : t(`${pfx}.empty`)}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-sm">
          {DAY_ORDER.map((day) => {
            const daySessions = effectiveByDay.get(day) ?? [];
            return (
              <div
                key={day}
                className="bg-surface-container-low rounded-lg p-sm min-h-[100px]"
              >
                <div className="text-label-sm font-bold text-on-surface mb-sm">
                  {t(`enums.dayOfWeek.${day}`)}
                </div>
                <div className="flex flex-col gap-xs">
                  {daySessions.map((s) => (
                    <div
                      key={s.id}
                      className={`rounded-md border-l-4 px-sm py-xs cursor-pointer transition-colors hover:ring-1 hover:ring-primary/40 ${
                        isCustom
                          ? 'bg-tertiary-container/30 border-tertiary'
                          : 'bg-primary-container/30 border-primary'
                      }`}
                      onClick={() => isCustom && handleOpenEdit(s)}
                      title={s.note ?? undefined}
                    >
                      <div className="text-[12px] text-on-surface font-semibold">
                        {formatTime(s.startTime)}–{formatTime(s.endTime)}
                      </div>
                      {isCustom && (
                        <div className="flex justify-end mt-xs">
                          <button
                            type="button"
                            className="text-error hover:bg-error-container/20 rounded p-0.5 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(s.id);
                            }}
                            title={t(`${pfx}.deleteSession`)}
                          >
                            <Icon name="delete" size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Session modal */}
      <SessionModal
        key={editingSession?.id ?? 'new'}
        open={isModalOpen}
        editing={editingSession}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSession(null);
        }}
        onSubmit={handleSubmit}
        isSubmitting={addSession.isPending || updateSession.isPending}
      />
    </div>
  );
}
