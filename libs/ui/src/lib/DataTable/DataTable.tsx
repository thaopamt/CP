import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../cn';

export interface Column<T> {
  /** Stable key — also rendered in the column header by default */
  key: string;
  header: ReactNode;
  /** Cell renderer */
  cell: (row: T, index: number) => ReactNode;
  className?: string;
  headerClassName?: string;
  align?: 'left' | 'right' | 'center';
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string | number;
  /** Optional: add a leading checkbox column for bulk select */
  selectable?: boolean;
  selectedKeys?: Set<string | number>;
  onToggleRow?: (key: string | number) => void;
  onToggleAll?: () => void;
  emptyState?: ReactNode;
  className?: string;
}

const ALIGN: Record<NonNullable<Column<unknown>['align']>, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

/**
 * Generic table primitive. Designed for the Admin pages — compact density,
 * 1px outline borders, hover states, and optional bulk-select column.
 *
 *   <DataTable
 *     rows={students}
 *     rowKey={(s) => s.id}
 *     columns={[
 *       { key: 'name', header: 'Student', cell: (s) => ... },
 *       { key: 'status', header: 'Status', cell: (s) => <EnrollmentStatusBadge status={s.status} /> },
 *     ]}
 *   />
 */
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  selectable,
  selectedKeys,
  onToggleRow,
  onToggleAll,
  emptyState,
  className,
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const allSelected =
    selectable && selectedKeys && rows.length > 0 && rows.every((r) => selectedKeys.has(rowKey(r)));

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-left border-collapse">
        <thead className="bg-surface-container-low text-label-sm text-on-surface-variant">
          <tr className="border-b border-outline-variant/30">
            {selectable && (
              <th className="p-sm md:p-md w-10">
                <input
                  type="checkbox"
                  checked={!!allSelected}
                  onChange={onToggleAll}
                  className="rounded text-primary focus:ring-primary"
                  aria-label={t('ui.dataTable.selectAll')}
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'p-sm md:p-md font-semibold whitespace-nowrap',
                  ALIGN[col.align ?? 'left'],
                  col.headerClassName,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-body-md divide-y divide-outline-variant/20">
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="p-xl text-center text-on-surface-variant"
              >
                {emptyState ?? t('ui.dataTable.empty')}
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => {
              const key = rowKey(row);
              const checked = !!selectedKeys?.has(key);
              return (
                <tr
                  key={key}
                  className="group hover:bg-surface-container-highest/30 transition-colors"
                >
                  {selectable && (
                    <td className="p-sm md:p-md">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleRow?.(key)}
                        className="rounded text-primary focus:ring-primary"
                        aria-label={t('ui.dataTable.selectRow')}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn('p-sm md:p-md', ALIGN[col.align ?? 'left'], col.className)}
                    >
                      {col.cell(row, idx)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
