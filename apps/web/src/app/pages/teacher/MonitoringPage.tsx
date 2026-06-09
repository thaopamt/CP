import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  ClassroomStats,
  HelpQueueItem,
  Icon,
  PageHeader,
  StudentCodeCard,
} from '@cp/ui';
import {
  ClassroomStudentStatus,
  IClassroomStudent,
  IHelpRequest,
} from '@cp/shared';

type FilterValue = 'all' | 'active' | 'help';

export default function TeacherMonitoringPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterValue>('all');

  const students: IClassroomStudent[] = useMemo(
    () => [
      {
        id: 'm1',
        name: t('pages.teacher.monitoring.students.emma'),
        status: ClassroomStudentStatus.ACTIVE,
        currentCode: `def insert(self, value):
    if not self.root:
        self.root = TreeNode(value)
        return
    self._insert_recursive(self.root, value)

def _insert_recursive(self, node, value):
    if value < node.value:
        ...`,
      },
      {
        id: 'm2',
        name: t('pages.teacher.monitoring.students.james'),
        status: ClassroomStudentStatus.HELP_NEEDED,
        currentCode: `def insert(self, value):
    if not self.root
        self.root = TreeNode(value)
    self._insert_recursive(self.root, value)
    return value`,
      },
      {
        id: 'm3',
        name: t('pages.teacher.monitoring.students.sarah'),
        status: ClassroomStudentStatus.IDLE,
        idleMinutes: 5,
        currentCode: `class TreeNode:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None`,
      },
      {
        id: 'm4',
        name: t('pages.teacher.monitoring.students.marcus'),
        status: ClassroomStudentStatus.ACTIVE,
        currentCode: `def search(self, value):
    return self._search(self.root, value)

def _search(self, node, value):
    if node is None or node.value == value:
        return node
    return self._search(node.right, value) if value > node.value else self._search(node.left, value)`,
      },
      {
        id: 'm5',
        name: t('pages.teacher.monitoring.students.tara'),
        status: ClassroomStudentStatus.AWAY,
      },
      {
        id: 'm6',
        name: t('pages.teacher.monitoring.students.aiden'),
        status: ClassroomStudentStatus.ACTIVE,
        currentCode: `def in_order(self):
    out = []
    self._in_order(self.root, out)
    return out`,
      },
    ],
    [t],
  );

  const helpQueue: IHelpRequest[] = useMemo(
    () => [
      {
        id: 'h1',
        studentId: 'm2',
        studentName: t('pages.teacher.monitoring.students.james'),
        message: t('pages.teacher.monitoring.helpMessages.syntax'),
        requestedAt: new Date(Date.now() - 2 * 60_000).toISOString(),
      },
      {
        id: 'h2',
        studentId: 'm9',
        studentName: t('pages.teacher.monitoring.students.alex'),
        message: t('pages.teacher.monitoring.helpMessages.recursive'),
        requestedAt: new Date(Date.now() - 5 * 60_000).toISOString(),
      },
    ],
    [t],
  );

  const counts = useMemo(() => {
    let active = 0;
    let idle = 0;
    let help = 0;
    let online = 0;
    for (const s of students) {
      if (s.status !== ClassroomStudentStatus.AWAY) online++;
      if (s.status === ClassroomStudentStatus.ACTIVE) active++;
      if (s.status === ClassroomStudentStatus.IDLE) idle++;
      if (s.status === ClassroomStudentStatus.HELP_NEEDED) help++;
    }
    return { active, idle, help, online, total: students.length };
  }, [students]);

  const visible = useMemo(() => {
    if (filter === 'all') return students;
    if (filter === 'active') return students.filter((s) => s.status === ClassroomStudentStatus.ACTIVE);
    return students.filter((s) => s.status === ClassroomStudentStatus.HELP_NEEDED);
  }, [filter, students]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
      <section className="flex flex-col gap-md lg:col-span-8">
        <PageHeader
          title={t('pages.teacher.monitoring.title')}
          subtitle={t('pages.teacher.monitoring.subtitle')}
          actions={
            <>
              <Button variant="ghost" leadingIcon={<Icon name="grid_view" size={18} />}>
                {t('pages.teacher.monitoring.gridView')}
              </Button>
              <Button variant="teacher" leadingIcon={<Icon name="campaign" size={18} />}>
                {t('pages.teacher.monitoring.announce')}
              </Button>
            </>
          }
        />

        <div className="flex flex-wrap gap-sm">
          <FilterPill value="all" current={filter} onClick={setFilter}>
            {t('pages.teacher.monitoring.filters.all')} <Count>{counts.total}</Count>
          </FilterPill>
          <FilterPill value="active" current={filter} onClick={setFilter}>
            {t('pages.teacher.monitoring.filters.active')} <Count tone="text-tertiary">{counts.active}</Count>
          </FilterPill>
          <FilterPill value="help" current={filter} onClick={setFilter}>
            {t('pages.teacher.monitoring.filters.help')} <Count tone="text-error">{counts.help}</Count>
          </FilterPill>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">
          {visible.map((s) => (
            <StudentCodeCard key={s.id} student={s} language="python" errorLines={[4]} />
          ))}
        </div>
      </section>

      <aside className="flex flex-col gap-md lg:col-span-4 lg:sticky lg:top-md lg:self-start">
        <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-md">
          <h3 className="font-manrope text-headline-md text-on-surface mb-sm">
            {t('pages.teacher.monitoring.overview')}
          </h3>
          <ClassroomStats
            totalOnline={counts.online}
            totalEnrolled={counts.total}
            activeCoding={counts.active}
            idleOrAway={counts.idle + (counts.total - counts.online)}
          />
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-md">
          <header className="flex items-center justify-between mb-sm">
            <h3 className="font-manrope text-headline-md text-on-surface">
              {t('pages.teacher.monitoring.helpQueue')}
            </h3>
            <span className="text-[11px] font-bold uppercase tracking-wider px-md py-xs rounded-full bg-error-container text-on-error-container">
              {helpQueue.length}
            </span>
          </header>
          {helpQueue.length === 0 ? (
            <p className="text-label-sm text-on-surface-variant text-center py-md">
              {t('pages.teacher.monitoring.helpQueueEmpty')}
            </p>
          ) : (
            <ul className="flex flex-col gap-sm">
              {helpQueue.map((r) => (
                <HelpQueueItem key={r.id} request={r} />
              ))}
            </ul>
          )}
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-md">
          <h3 className="font-manrope text-headline-md text-on-surface mb-sm">
            {t('pages.teacher.monitoring.quickActions')}
          </h3>
          <div className="flex flex-col gap-sm">
            <Button variant="ghost" leadingIcon={<Icon name="campaign" size={18} />}>
              {t('pages.teacher.monitoring.announceClass')}
            </Button>
            <Button variant="ghost" leadingIcon={<Icon name="lock" size={18} />}>
              {t('pages.teacher.monitoring.lockAll')}
            </Button>
            <Button variant="ghost" leadingIcon={<Icon name="task_alt" size={18} />}>
              {t('pages.teacher.monitoring.markOnTask')}
            </Button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function FilterPill({
  value,
  current,
  onClick,
  children,
}: {
  value: FilterValue;
  current: FilterValue;
  onClick: (v: FilterValue) => void;
  children: React.ReactNode;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={
        active
          ? 'inline-flex items-center gap-xs px-md py-sm rounded-full bg-primary-container text-on-primary-container border border-primary text-label-sm font-semibold'
          : 'inline-flex items-center gap-xs px-md py-sm rounded-full bg-surface-container-low border border-outline-variant text-on-surface-variant text-label-sm font-semibold hover:bg-surface-container-high'
      }
    >
      {children}
    </button>
  );
}

function Count({ children, tone }: { children: React.ReactNode; tone?: string }) {
  return (
    <span className={`px-xs rounded-full bg-surface-container-high text-[11px] ${tone ?? 'text-on-surface-variant'}`}>
      {children}
    </span>
  );
}
