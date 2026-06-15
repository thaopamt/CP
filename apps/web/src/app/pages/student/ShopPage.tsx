import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, useConfirm, useToast } from '@cp/ui';
import {
  BadgeRarity,
  IShopCatalogEntry,
  ShopItemCategory,
  ShopItemKind,
} from '@cp/shared';
import {
  useEquipItem,
  usePurchaseItem,
  useShopCatalog,
  useUnequipItem,
} from '../../api/shop.queries';

type TFn = (key: string, opts?: Record<string, unknown>) => string;

const CATEGORIES: (ShopItemCategory | 'all')[] = [
  'all',
  ShopItemCategory.CHARACTER,
  ShopItemCategory.AVATAR_FRAME,
  ShopItemCategory.PROFILE_THEME,
  ShopItemCategory.NAME_COLOR,
  ShopItemCategory.TITLE,
  ShopItemCategory.CONSUMABLE,
];

interface RarityStyle {
  border: string;
  glow: string;
  label: string;
}

const RARITY: Record<BadgeRarity, RarityStyle> = {
  COMMON: {
    border: 'border-outline-variant dark:border-white/10',
    glow: '',
    label: 'border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-300/20 dark:bg-slate-400/10 dark:text-slate-200',
  },
  RARE: {
    border: 'border-sky-300/60 dark:border-sky-400/40',
    glow: 'shadow-[0_8px_22px_rgba(2,132,199,0.14)] dark:shadow-[0_0_18px_rgba(56,189,248,0.18)]',
    label: 'border border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-300/20 dark:bg-sky-400/10 dark:text-sky-200',
  },
  EPIC: {
    border: 'border-fuchsia-300/60 dark:border-violet-400/40',
    glow: 'shadow-[0_8px_22px_rgba(192,38,211,0.14)] dark:shadow-[0_0_18px_rgba(139,92,246,0.22)]',
    label: 'border border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-300/20 dark:bg-fuchsia-400/10 dark:text-fuchsia-200',
  },
  LEGENDARY: {
    border: 'border-amber-300/70 dark:border-amber-400/50',
    glow: 'shadow-[0_8px_24px_rgba(217,119,6,0.18)] dark:shadow-[0_0_22px_rgba(251,191,36,0.28)]',
    label: 'border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-200',
  },
};

function errMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string | string[] } } };
  const m = e?.response?.data?.message;
  if (Array.isArray(m)) return m[0] ?? fallback;
  return m ?? fallback;
}

export default function StudentShopPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const confirm = useConfirm();
  const { data, isLoading } = useShopCatalog();
  const purchase = usePurchaseItem();
  const equip = useEquipItem();
  const unequip = useUnequipItem();
  const [cat, setCat] = useState<ShopItemCategory | 'all'>('all');

  const gems = data?.gems ?? 0;
  const entries = useMemo(
    () => (data?.entries ?? []).filter((e) => cat === 'all' || e.item.category === cat),
    [data, cat],
  );

  const busy = purchase.isPending || equip.isPending || unequip.isPending;

  async function onBuy(entry: IShopCatalogEntry) {
    const ok = await confirm({
      title: t('gamif.student.shop.confirmTitle'),
      message: t('gamif.student.shop.confirmBody', { name: entry.item.name, price: entry.item.price }),
      confirmLabel: t('gamif.student.shop.buy'),
      intent: 'primary',
    });
    if (!ok) return;
    try {
      const res = await purchase.mutateAsync(entry.item.id);
      toast.success(res.message || t('gamif.student.shop.purchased'));
    } catch (err) {
      toast.error(errMessage(err, t('gamif.student.shop.cantAfford')));
    }
  }

  async function onEquip(entry: IShopCatalogEntry) {
    try {
      if (entry.equipped) {
        await unequip.mutateAsync(entry.item.id);
        toast.success(t('gamif.student.shop.unequipDone'));
      } else {
        await equip.mutateAsync(entry.item.id);
        toast.success(t('gamif.student.shop.equipDone'));
      }
    } catch (err) {
      toast.error(errMessage(err, 'Error'));
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-lg py-lg text-on-surface">
      {/* ── Header ── */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-manrope text-headline-md md:text-headline-lg font-extrabold text-on-surface mb-2 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-tertiary-container text-on-tertiary-container flex items-center justify-center shadow-elev-1 dark:bg-fuchsia-400/15 dark:text-fuchsia-100 dark:ring-1 dark:ring-fuchsia-200/25">
              <Icon name="storefront" size={28} />
            </div>
            {t('gamif.student.shop.title')}
          </h1>
          <p className="text-body-md text-on-surface-variant max-w-lg">{t('gamif.student.shop.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 px-5 py-3 rounded-lg bg-amber-50 border border-amber-200 self-start dark:bg-amber-400/10 dark:border-amber-400/30">
          <Icon name="diamond" size={22} className="text-amber-600 dark:text-amber-300" />
          <span className="text-xs text-on-surface-variant mr-1">{t('gamif.student.shop.balance')}</span>
          <span className="text-xl font-black text-amber-700 dark:text-amber-300 tabular-nums">{gems.toLocaleString()}</span>
        </div>
      </header>

      {/* ── Category tabs ── */}
      <div className="flex gap-xs overflow-x-auto rounded-lg bg-surface-container-low p-xs dark:border dark:border-white/10">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              cat === c
                ? 'bg-primary text-on-primary shadow-elev-1 dark:bg-primary-container dark:text-on-primary-container'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            {c === 'all' ? t('gamif.student.shop.cat.all') : t(`gamif.student.shop.cat.${c}`)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Icon name="sync" className="animate-spin text-primary" size={48} />
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-outline-variant bg-surface-container-low py-24 text-center dark:border-white/10">
          <div className="w-20 h-20 rounded-lg bg-surface-container-high flex items-center justify-center mb-4 dark:bg-white/[0.06]">
            <Icon name="storefront" size={40} className="text-on-surface-variant" />
          </div>
          <p className="text-sm text-on-surface-variant">{t('gamif.student.shop.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {entries.map((e) => (
            <ShopCard
              key={e.item.id}
              entry={e}
              gems={gems}
              busy={busy}
              onBuy={() => onBuy(e)}
              onEquip={() => onEquip(e)}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ShopCard({
  entry,
  gems,
  busy,
  onBuy,
  onEquip,
  t,
}: {
  entry: IShopCatalogEntry;
  gems: number;
  busy: boolean;
  onBuy: () => void;
  onEquip: () => void;
  t: TFn;
}) {
  const { item, owned, equipped, unlocked } = entry;
  const r = RARITY[item.rarity] ?? RARITY.COMMON;
  const isCosmetic = item.kind === ShopItemKind.COSMETIC;
  const canAfford = gems >= item.price;
  const swatch = item.payload?.color;
  const image = item.imageUrl;
  const locked = !owned && !unlocked;

  return (
    <div
      className={`rounded-lg border bg-surface-container-lowest p-4 flex flex-col shadow-elev-1 dark:bg-[#18151f]/95 ${r.border} ${r.glow}`}
    >
      {/* Icon / preview */}
      <div
        className={`relative mb-3 rounded-lg bg-surface-container-high grid place-items-center overflow-hidden dark:bg-white/[0.06] ${
          image ? 'aspect-square' : 'h-20'
        }`}
      >
        {image ? (
          <img
            src={image}
            alt={item.name}
            className={`h-full w-full object-contain ${locked ? 'opacity-40 grayscale' : ''}`}
          />
        ) : swatch ? (
          <span className="w-10 h-10 rounded-full border-2 border-outline" style={{ backgroundColor: swatch }} />
        ) : (
          <Icon name={item.icon || 'redeem'} size={40} className="text-on-surface-variant" />
        )}
        {equipped && (
          <span className="absolute top-1.5 right-1.5 text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full dark:text-emerald-300 dark:bg-emerald-400/15">
            {t('gamif.student.shop.equipped')}
          </span>
        )}
        {locked && (
          <span className="absolute inset-0 grid place-items-center bg-black/40 text-white">
            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider">
              <Icon name="lock" size={14} /> Lv {item.minLevel}
            </span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 mb-1">
        <span className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${r.label}`}>
          {item.rarity}
        </span>
      </div>
      <h3 className="text-sm font-bold text-on-surface leading-tight mb-1">{item.name}</h3>
      <p className="text-[11px] text-on-surface-variant leading-snug mb-3 line-clamp-2 flex-1">{item.description}</p>

      {/* Price + action */}
      <div className="flex items-center justify-between gap-2 mt-auto">
        <span className="flex items-center gap-1 text-sm font-black text-amber-700 dark:text-amber-300 tabular-nums">
          <Icon name="diamond" size={14} /> {item.price}
        </span>

        {owned && isCosmetic ? (
          <button
            onClick={onEquip}
            disabled={busy}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
              equipped
                ? 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            {equipped ? t('gamif.student.shop.unequip') : t('gamif.student.shop.equip')}
          </button>
        ) : owned ? (
          <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-surface-container-high text-on-surface-variant">
            {t('gamif.student.shop.owned')}
          </span>
        ) : locked ? (
          <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-surface-container-high text-on-surface-variant">
            <Icon name="lock" size={13} /> {t('gamif.student.shop.locked', { level: item.minLevel })}
          </span>
        ) : (
          <button
            onClick={onBuy}
            disabled={busy || !canAfford}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-on-primary hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {canAfford ? t('gamif.student.shop.buy') : t('gamif.student.shop.cantAfford')}
          </button>
        )}
      </div>
    </div>
  );
}
