import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Column,
  DataTable,
  FilterToolbar,
  Icon,
  PageHeader,
  SearchBox,
  SelectFilter,
  StatusBadge,
  useConfirm,
} from '@cp/ui';
import { IShopItem, ShopItemCategory } from '@cp/shared';

import { useDeleteShopItem, useManageShopItems } from '../../../api/shop.queries';
import { usePortalBase } from '../../../hooks/usePortalBase';

const CATEGORY_FILTERS: (ShopItemCategory | 'all')[] = ['all', ...Object.values(ShopItemCategory)];

export default function ShopListPage() {
  const { t } = useTranslation();
  const base = usePortalBase();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ShopItemCategory | 'all'>('all');

  const { data, isError, isLoading, error } = useManageShopItems();
  const deleteItem = useDeleteShopItem();

  const rows = useMemo(() => {
    const items = data ?? [];
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (category !== 'all' && it.category !== category) return false;
      if (q && !`${it.name} ${it.code}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, search, category]);

  const columns: Column<IShopItem>[] = useMemo(
    () => [
      {
        key: 'item',
        header: t('pages.shopAdmin.columns.item'),
        cell: (it) => (
          <div className="flex items-center gap-sm min-w-0">
            <div className="w-10 h-10 rounded-lg bg-surface-container-high grid place-items-center overflow-hidden shrink-0">
              {it.imageUrl ? (
                <img src={it.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : it.payload?.color ? (
                <span className="w-5 h-5 rounded-full border border-outline" style={{ backgroundColor: it.payload.color }} />
              ) : (
                <Icon name={it.icon || 'redeem'} size={22} className="text-on-surface-variant" />
              )}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-on-surface truncate" title={it.name}>
                {it.name}
              </div>
              <div className="font-mono text-[12px] text-on-surface-variant truncate">{it.code}</div>
            </div>
          </div>
        ),
      },
      {
        key: 'category',
        header: t('pages.shopAdmin.columns.category'),
        cell: (it) => (
          <span className="text-body-sm text-on-surface-variant">{t(`pages.shopAdmin.cat.${it.category}`)}</span>
        ),
      },
      {
        key: 'kind',
        header: t('pages.shopAdmin.columns.kind'),
        cell: (it) => (
          <span className="text-body-sm text-on-surface-variant">{t(`pages.shopAdmin.kind.${it.kind}`)}</span>
        ),
      },
      {
        key: 'price',
        header: t('pages.shopAdmin.columns.price'),
        cell: (it) => (
          <span className="inline-flex items-center gap-1 text-body-sm font-semibold text-amber-700 dark:text-amber-300 tabular-nums">
            <Icon name="diamond" size={14} /> {it.price}
          </span>
        ),
      },
      {
        key: 'status',
        header: t('pages.shopAdmin.columns.status'),
        cell: (it) => (
          <StatusBadge tone={it.isActive ? 'success' : 'neutral'}>
            {it.isActive ? t('pages.shopAdmin.active') : t('pages.shopAdmin.inactive')}
          </StatusBadge>
        ),
      },
      {
        key: 'actions',
        header: '',
        align: 'right',
        cell: (it) => (
          <div className="inline-flex justify-end gap-xs opacity-0 group-hover:opacity-100 transition-opacity">
            <Link
              to={`${base}/shop/${it.id}/edit`}
              className="p-1 rounded text-on-surface-variant hover:text-primary transition-colors inline-grid place-items-center"
              title={t('common.edit')}
            >
              <Icon name="edit" size={18} />
            </Link>
            <button
              type="button"
              className="p-1 rounded text-on-surface-variant hover:text-error transition-colors inline-grid place-items-center"
              title={t('common.delete')}
              disabled={deleteItem.isPending}
              onClick={async () => {
                const ok = await confirm({
                  title: t('common.confirmDelete', 'Confirm Delete'),
                  message: t('pages.shopAdmin.deleteConfirm'),
                  intent: 'danger',
                });
                if (ok) deleteItem.mutate(it.id);
              }}
            >
              <Icon name="delete" size={18} />
            </button>
          </div>
        ),
      },
    ],
    [base, confirm, deleteItem, t],
  );

  return (
    <div className="flex flex-col gap-lg">
      <PageHeader
        title={t('pages.shopAdmin.title')}
        subtitle={t('pages.shopAdmin.subtitle')}
        actions={
          <Button leadingIcon={<Icon name="add" size={18} />} onClick={() => navigate(`${base}/shop/new`)}>
            {t('pages.shopAdmin.create')}
          </Button>
        }
      />

      <FilterToolbar>
        <SearchBox value={search} onChange={setSearch} placeholder={t('pages.shopAdmin.searchPlaceholder')} />
        <SelectFilter
          label={t('pages.shopAdmin.columns.category')}
          value={category}
          onChange={(e) => setCategory(e.target.value as ShopItemCategory | 'all')}
          options={CATEGORY_FILTERS.map((value) => ({
            value,
            label: value === 'all' ? t('pages.shopAdmin.cat.all') : t(`pages.shopAdmin.cat.${value}`),
          }))}
        />
      </FilterToolbar>

      <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-lg shadow-elev-1 overflow-hidden">
        {isError ? (
          <div className="p-xl text-center">
            <Icon name="error" size={36} className="mx-auto mb-sm text-error" />
            <p className="text-body-md text-on-surface">{(error as Error).message}</p>
          </div>
        ) : (
          <DataTable
            rows={rows}
            columns={columns}
            rowKey={(it) => it.id}
            emptyState={isLoading ? t('common.loading') : t('pages.shopAdmin.empty')}
          />
        )}
        <footer className="flex items-center justify-end gap-sm p-md border-t border-outline-variant/30">
          <div className="text-label-sm text-on-surface-variant">
            {t('pages.shopAdmin.showing', { count: rows.length })}
          </div>
        </footer>
      </div>
    </div>
  );
}
