import { FormEvent, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Icon, useToast } from '@cp/ui';
import {
  BadgeRarity,
  ICreateShopItemPayload,
  IShopItem,
  IShopItemPayload,
  ShopItemCategory,
  ShopItemKind,
} from '@cp/shared';

import { useUploadShopImage } from '../../../api/shop.queries';
import { CHARACTER_GENDERS, charactersByGender } from '../../../lib/characters';

interface ShopFormProps {
  defaultValues?: IShopItem;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (payload: ICreateShopItemPayload) => Promise<void> | void;
}

const inputCls =
  'h-[42px] px-sm bg-surface-container-lowest border border-outline-variant rounded-md text-body-md focus:ring-2 focus:ring-primary outline-none transition-shadow w-full';

const CATEGORIES = Object.values(ShopItemCategory);
const RARITIES = Object.values(BadgeRarity);

export function ShopForm({ defaultValues, submitLabel, isSubmitting, onSubmit }: ShopFormProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const uploadImage = useUploadShopImage();
  const fileRef = useRef<HTMLInputElement>(null);

  const [code, setCode] = useState(defaultValues?.code ?? '');
  const [name, setName] = useState(defaultValues?.name ?? '');
  const [description, setDescription] = useState(defaultValues?.description ?? '');
  const [icon, setIcon] = useState(defaultValues?.icon ?? '');
  const [imageUrl, setImageUrl] = useState<string | null>(defaultValues?.imageUrl ?? null);
  const [kind, setKind] = useState<ShopItemKind>(defaultValues?.kind ?? ShopItemKind.COSMETIC);
  const [category, setCategory] = useState<ShopItemCategory>(
    defaultValues?.category ?? ShopItemCategory.CHARACTER,
  );
  const [rarity, setRarity] = useState<BadgeRarity>(defaultValues?.rarity ?? BadgeRarity.COMMON);
  const [price, setPrice] = useState(String(defaultValues?.price ?? 100));
  const [minLevel, setMinLevel] = useState(String(defaultValues?.minLevel ?? 0));
  const [sortOrder, setSortOrder] = useState(String(defaultValues?.sortOrder ?? 0));
  const [isActive, setIsActive] = useState(defaultValues?.isActive ?? true);

  // payload sub-fields (interpreted by category)
  const p = defaultValues?.payload ?? {};
  const [color, setColor] = useState(p.color ?? '#f97316');
  const [themeKey, setThemeKey] = useState(p.themeKey ?? '');
  const [titleText, setTitleText] = useState(p.title ?? '');
  const [xp, setXp] = useState(String(p.xp ?? ''));
  const [gemsMin, setGemsMin] = useState(String(p.gemsMin ?? ''));
  const [gemsMax, setGemsMax] = useState(String(p.gemsMax ?? ''));

  const [error, setError] = useState<string | null>(null);

  function buildPayload(): IShopItemPayload | null {
    const out: IShopItemPayload = {};
    switch (category) {
      case ShopItemCategory.NAME_COLOR:
        if (color) out.color = color;
        break;
      case ShopItemCategory.PROFILE_THEME:
        if (themeKey) out.themeKey = themeKey.trim();
        break;
      case ShopItemCategory.TITLE:
        if (titleText) out.title = titleText.trim();
        break;
      case ShopItemCategory.CONSUMABLE:
        if (xp) out.xp = Number(xp);
        if (gemsMin) out.gemsMin = Number(gemsMin);
        if (gemsMax) out.gemsMax = Number(gemsMax);
        break;
      default:
        break;
    }
    return Object.keys(out).length ? out : null;
  }

  async function pickImage(file: File) {
    try {
      const url = await uploadImage.mutateAsync(file);
      setImageUrl(url);
    } catch {
      toast.error(t('pages.shopAdmin.form.uploadImage'));
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await onSubmit({
        code: code.trim(),
        name: name.trim(),
        description,
        icon: icon.trim() || undefined,
        imageUrl: imageUrl || null,
        kind,
        category,
        rarity,
        price: Number(price) || 0,
        minLevel: Number(minLevel) || 0,
        sortOrder: Number(sortOrder) || 0,
        isActive,
        payload: buildPayload(),
      });
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
        ?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? (err as Error).message));
    }
  }

  const isCharacter = category === ShopItemCategory.CHARACTER;

  return (
    <form onSubmit={submit} className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-lg">
      <div className="space-y-lg">
        {error && (
          <div className="rounded-lg border border-error/30 bg-error-container/30 p-md text-body-sm text-on-error-container">
            {error}
          </div>
        )}

        <section className="space-y-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <Field label={t('pages.shopAdmin.form.code')}>
              <input
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t('pages.shopAdmin.form.codePlaceholder')}
                className={`${inputCls} font-mono`}
              />
            </Field>
            <Field label={t('pages.shopAdmin.form.name')}>
              <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
            </Field>
          </div>

          <Field label={t('pages.shopAdmin.form.description')}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-sm py-xs bg-surface-container-lowest border border-outline-variant rounded-md text-body-md focus:ring-2 focus:ring-primary outline-none resize-none transition-shadow"
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <Field label={t('pages.shopAdmin.form.category')}>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ShopItemCategory)}
                className={inputCls}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(`pages.shopAdmin.cat.${c}`)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t('pages.shopAdmin.form.kind')}>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as ShopItemKind)}
                className={inputCls}
              >
                <option value={ShopItemKind.COSMETIC}>{t('pages.shopAdmin.kind.COSMETIC')}</option>
                <option value={ShopItemKind.CONSUMABLE}>{t('pages.shopAdmin.kind.CONSUMABLE')}</option>
              </select>
            </Field>
          </div>

          {/* Category-specific effect fields */}
          <PayloadFields
            category={category}
            t={t}
            color={color}
            setColor={setColor}
            themeKey={themeKey}
            setThemeKey={setThemeKey}
            titleText={titleText}
            setTitleText={setTitleText}
            xp={xp}
            setXp={setXp}
            gemsMin={gemsMin}
            setGemsMin={setGemsMin}
            gemsMax={gemsMax}
            setGemsMax={setGemsMax}
          />
        </section>
      </div>

      <aside className="xl:sticky xl:top-20 self-start rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-md space-y-md">
        {/* Image */}
        <div className="flex flex-col gap-1">
          <span className="text-label-sm font-semibold text-on-surface">
            {isCharacter ? t('pages.shopAdmin.form.chooseCharacter') : t('pages.shopAdmin.form.image')}
          </span>
          <div className="flex flex-col gap-sm">
            <div className="h-32 rounded-lg border border-outline-variant bg-surface-container-high grid place-items-center overflow-hidden">
              {imageUrl ? (
                <img src={imageUrl} alt="" className="h-full w-full object-contain" />
              ) : (
                <Icon name={icon || 'image'} size={40} className="text-on-surface-variant" />
              )}
            </div>

            {isCharacter ? (
              <>
                <CharacterPicker value={imageUrl} onPick={setImageUrl} t={t} />
                {imageUrl && (
                  <Button type="button" variant="ghost" onClick={() => setImageUrl(null)}>
                    <Icon name="close" size={16} /> {t('pages.shopAdmin.form.removeImage')}
                  </Button>
                )}
                <p className="text-[11px] text-on-surface-variant">{t('pages.shopAdmin.form.chooseCharacterHint')}</p>
              </>
            ) : (
              <>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void pickImage(f);
                    e.target.value = '';
                  }}
                />
                <div className="flex gap-xs">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1"
                    disabled={uploadImage.isPending}
                    leadingIcon={
                      <Icon
                        name={uploadImage.isPending ? 'progress_activity' : 'upload'}
                        size={16}
                        className={uploadImage.isPending ? 'animate-spin' : undefined}
                      />
                    }
                    onClick={() => fileRef.current?.click()}
                  >
                    {uploadImage.isPending ? t('pages.shopAdmin.form.uploading') : t('pages.shopAdmin.form.uploadImage')}
                  </Button>
                  {imageUrl && (
                    <Button type="button" variant="ghost" onClick={() => setImageUrl(null)}>
                      <Icon name="close" size={16} />
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <Field label={t('pages.shopAdmin.form.icon')}>
          <input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="redeem"
            className={`${inputCls} font-mono`}
          />
        </Field>

        <div className="grid grid-cols-2 gap-md">
          <Field label={t('pages.shopAdmin.form.price')}>
            <input
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label={t('pages.shopAdmin.form.minLevel')}>
            <input
              type="number"
              min={0}
              value={minLevel}
              onChange={(e) => setMinLevel(e.target.value)}
              className={inputCls}
            />
          </Field>
        </div>

        <Field label={t('pages.shopAdmin.form.sortOrder')}>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className={inputCls}
          />
        </Field>

        <Field label={t('pages.shopAdmin.form.rarity')}>
          <select
            value={rarity}
            onChange={(e) => setRarity(e.target.value as BadgeRarity)}
            className={inputCls}
          >
            {RARITIES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>

        <label className="flex items-center gap-sm cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          <span className="text-label-sm text-on-surface">{t('pages.shopAdmin.form.isActive')}</span>
        </label>

        <Button
          type="submit"
          className="w-full"
          leadingIcon={
            <Icon
              name={isSubmitting ? 'progress_activity' : 'save'}
              size={18}
              className={isSubmitting ? 'animate-spin' : undefined}
            />
          }
          disabled={isSubmitting}
        >
          {submitLabel}
        </Button>
      </aside>
    </form>
  );
}

type TFn = (key: string, opts?: Record<string, unknown>) => string;

function PayloadFields({
  category,
  t,
  color,
  setColor,
  themeKey,
  setThemeKey,
  titleText,
  setTitleText,
  xp,
  setXp,
  gemsMin,
  setGemsMin,
  gemsMax,
  setGemsMax,
}: {
  category: ShopItemCategory;
  t: TFn;
  color: string;
  setColor: (v: string) => void;
  themeKey: string;
  setThemeKey: (v: string) => void;
  titleText: string;
  setTitleText: (v: string) => void;
  xp: string;
  setXp: (v: string) => void;
  gemsMin: string;
  setGemsMin: (v: string) => void;
  gemsMax: string;
  setGemsMax: (v: string) => void;
}) {
  switch (category) {
    case ShopItemCategory.NAME_COLOR:
      return (
        <Field label={t('pages.shopAdmin.form.color')}>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-[42px] w-20 rounded-md border border-outline-variant bg-surface-container-lowest" />
        </Field>
      );
    case ShopItemCategory.PROFILE_THEME:
      return (
        <Field label={t('pages.shopAdmin.form.themeKey')}>
          <input value={themeKey} onChange={(e) => setThemeKey(e.target.value)} placeholder="sunset" className={`${inputCls} font-mono`} />
        </Field>
      );
    case ShopItemCategory.TITLE:
      return (
        <Field label={t('pages.shopAdmin.form.titleText')}>
          <input value={titleText} onChange={(e) => setTitleText(e.target.value)} className={inputCls} />
        </Field>
      );
    case ShopItemCategory.CONSUMABLE:
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
          <Field label={t('pages.shopAdmin.form.xp')}>
            <input type="number" value={xp} onChange={(e) => setXp(e.target.value)} className={inputCls} />
          </Field>
          <Field label={t('pages.shopAdmin.form.gemsMin')}>
            <input type="number" value={gemsMin} onChange={(e) => setGemsMin(e.target.value)} className={inputCls} />
          </Field>
          <Field label={t('pages.shopAdmin.form.gemsMax')}>
            <input type="number" value={gemsMax} onChange={(e) => setGemsMax(e.target.value)} className={inputCls} />
          </Field>
        </div>
      );
    default:
      return null;
  }
}

function CharacterPicker({
  value,
  onPick,
  t,
}: {
  value: string | null;
  onPick: (path: string) => void;
  t: TFn;
}) {
  return (
    <div className="flex flex-col gap-sm max-h-72 overflow-y-auto pr-1">
      {CHARACTER_GENDERS.map((gender) => (
        <div key={gender}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant mb-1">
            {t(`pages.shopAdmin.form.${gender}`)}
          </p>
          <div className="grid grid-cols-4 gap-2">
            {charactersByGender(gender).map((c) => {
              const selected = value === c.path;
              return (
                <button
                  key={c.path}
                  type="button"
                  title={c.label}
                  onClick={() => onPick(c.path)}
                  className={`aspect-square rounded-lg border-2 p-1 bg-surface-container-high grid place-items-center overflow-hidden transition-colors ${
                    selected
                      ? 'border-primary ring-2 ring-primary/40'
                      : 'border-transparent hover:border-outline-variant'
                  }`}
                >
                  <img src={c.path} alt={c.label} className="w-full h-full object-contain" />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-label-sm font-semibold text-on-surface">{label}</span>
      {children}
    </label>
  );
}
