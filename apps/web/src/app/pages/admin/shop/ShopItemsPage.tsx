import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon, useConfirm, useToast } from '@cp/ui';
import {
  BadgeRarity,
  CharacterGender,
  ICharacterEquip,
  ICharacterTransform,
  IShopItem,
  ShopItemCategory,
  ShopItemKind,
  isCharacterSlot,
} from '@cp/shared';
import { CharacterViewer } from '../../../lib/character';
import {
  useAdminShopItems,
  useCreateShopItem,
  useDeleteShopItem,
  useUpdateShopItem,
} from '../../../api/shop-admin.queries';

const CATEGORIES: (ShopItemCategory | 'all')[] = ['all', ...Object.values(ShopItemCategory)];

const CAT_LABEL: Record<string, string> = {
  all: 'Tất cả',
  HAT: 'Mũ',
  OUTFIT: 'Trang phục',
  WEAPON: 'Vũ khí',
  PET: 'Thú cưng',
  WINGS: 'Cánh',
  BACKGROUND: 'Nền',
  AVATAR_FRAME: 'Khung',
  PROFILE_THEME: 'Theme',
  NAME_COLOR: 'Màu tên',
  TITLE: 'Danh hiệu',
  CONSUMABLE: 'Tiêu hao',
};

/** Sensible starting placement per slot when an item has none yet. */
const DEFAULT_TRANSFORM: Record<string, ICharacterTransform> = {
  HAT: { x: 50, y: 17, scale: 0.27, rotation: 0 },
  OUTFIT: { x: 50, y: 60, scale: 0.55, rotation: 0 },
  WEAPON: { x: 72, y: 55, scale: 0.22, rotation: 0 },
  PET: { x: 20, y: 84, scale: 0.2, rotation: 0 },
  WINGS: { x: 50, y: 50, scale: 0.72, rotation: 0 },
};

/** Slots that use the visual position editor (background fills the canvas). */
const positionable = (cat: ShopItemCategory) => isCharacterSlot(cat) && cat !== ShopItemCategory.BACKGROUND;

interface Draft {
  name: string;
  price: number;
  rarity: BadgeRarity;
  isActive: boolean;
  emoji: string;
  imageUrl: string;
  color: string;
  transform: ICharacterTransform;
}

const INPUT = 'w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-sm text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none';
const LABEL = 'block text-xs font-bold text-on-surface-variant uppercase mb-1';

export default function ShopItemsPage() {
  const toast = useToast();
  const confirm = useConfirm();
  const { data: items, isLoading } = useAdminShopItems();
  const updateItem = useUpdateShopItem();
  const deleteItem = useDeleteShopItem();
  const createItem = useCreateShopItem();

  const [cat, setCat] = useState<ShopItemCategory | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const filtered = useMemo(
    () => (items ?? []).filter((i) => cat === 'all' || i.category === cat),
    [items, cat],
  );
  const selected = useMemo(() => (items ?? []).find((i) => i.id === selectedId) ?? null, [items, selectedId]);

  return (
    <div className="mx-auto w-full max-w-7xl py-lg text-on-surface">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-manrope text-headline-md font-extrabold text-on-surface flex items-center gap-3">
            <Icon name="storefront" className="text-primary" /> Quản lý Cửa hàng
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">Sửa vật phẩm và căn vị trí trang bị trên nhân vật.</p>
        </div>
        <button onClick={() => setShowCreate((s) => !s)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-primary text-on-primary hover:opacity-90">
          <Icon name="add" size={18} /> Tạo vật phẩm
        </button>
      </header>

      {showCreate && <CreatePanel onClose={() => setShowCreate(false)} onCreate={async (p) => {
        try {
          const created = await createItem.mutateAsync(p);
          toast.success('Đã tạo vật phẩm.');
          setShowCreate(false);
          setSelectedId(created.id);
        } catch (e) {
          toast.error((e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Không tạo được.');
        }
      }} />}

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCat(c)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${cat === c ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'}`}>
            {CAT_LABEL[c] ?? c}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_420px] gap-6 items-start">
        {/* Item list */}
        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-3 shadow-elev-1">
          {isLoading ? (
            <div className="py-16 grid place-items-center"><Icon name="sync" className="animate-spin text-primary" size={36} /></div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${selectedId === item.id ? 'border-primary bg-primary/10 ring-1 ring-primary/40' : 'border-outline-variant bg-surface-container hover:bg-surface-container-high'}`}
                >
                  <ItemThumb item={item} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-on-surface truncate">{item.name}</p>
                    <p className="text-[10px] text-on-surface-variant truncate">{CAT_LABEL[item.category]} · {item.price}💎{item.isActive ? '' : ' · ẩn'}</p>
                  </div>
                </button>
              ))}
              {filtered.length === 0 && <p className="col-span-full text-center text-sm text-on-surface-variant py-10">Không có vật phẩm.</p>}
            </div>
          )}
        </div>

        {/* Editor */}
        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-elev-1 lg:sticky lg:top-4">
          {selected ? (
            <Editor
              key={selected.id}
              item={selected}
              saving={updateItem.isPending}
              onSave={async (draft) => {
                const payload = {
                  ...(selected.payload ?? {}),
                  emoji: draft.emoji.trim() || undefined,
                  imageUrl: draft.imageUrl.trim() || undefined,
                  color: draft.color.trim() || undefined,
                  ...(positionable(selected.category) ? { transform: draft.transform } : {}),
                };
                try {
                  await updateItem.mutateAsync({ id: selected.id, patch: { name: draft.name, price: draft.price, rarity: draft.rarity, isActive: draft.isActive, payload } });
                  toast.success('Đã lưu.');
                } catch {
                  toast.error('Không lưu được.');
                }
              }}
              onDelete={async () => {
                const ok = await confirm({ title: 'Xoá vật phẩm?', message: `Xoá "${selected.name}"? Không thể hoàn tác.`, intent: 'danger', confirmLabel: 'Xoá' });
                if (!ok) return;
                try {
                  await deleteItem.mutateAsync(selected.id);
                  toast.success('Đã xoá.');
                  setSelectedId(null);
                } catch {
                  toast.error('Không xoá được.');
                }
              }}
            />
          ) : (
            <div className="py-16 text-center text-on-surface-variant text-sm">Chọn một vật phẩm để chỉnh sửa.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ItemThumb({ item }: { item: IShopItem }) {
  const p = item.payload;
  return (
    <span className="w-10 h-10 rounded-lg bg-surface-container-high grid place-items-center overflow-hidden shrink-0" style={p?.color && !p?.emoji && !p?.imageUrl ? { backgroundColor: p.color } : undefined}>
      {p?.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-contain" /> : p?.emoji ? <span className="text-xl">{p.emoji}</span> : <Icon name={item.icon || 'redeem'} size={20} className="text-on-surface-variant" />}
    </span>
  );
}

function Editor({ item, saving, onSave, onDelete }: { item: IShopItem; saving: boolean; onSave: (d: Draft) => void; onDelete: () => void }) {
  const slotKey = item.category.toLowerCase() as keyof ICharacterEquip;
  const [draft, setDraft] = useState<Draft>(() => ({
    name: item.name,
    price: item.price,
    rarity: item.rarity,
    isActive: item.isActive,
    emoji: item.payload?.emoji ?? '',
    imageUrl: item.payload?.imageUrl ?? '',
    color: item.payload?.color ?? '',
    transform: item.payload?.transform ?? DEFAULT_TRANSFORM[item.category] ?? { x: 50, y: 50, scale: 0.3, rotation: 0 },
  }));
  useEffect(() => {
    setDraft({
      name: item.name, price: item.price, rarity: item.rarity, isActive: item.isActive,
      emoji: item.payload?.emoji ?? '', imageUrl: item.payload?.imageUrl ?? '', color: item.payload?.color ?? '',
      transform: item.payload?.transform ?? DEFAULT_TRANSFORM[item.category] ?? { x: 50, y: 50, scale: 0.3, rotation: 0 },
    });
  }, [item]);

  const [previewGender, setPreviewGender] = useState<CharacterGender>('male');
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const setT = (k: keyof ICharacterTransform, v: number) => setDraft((d) => ({ ...d, transform: { ...d.transform, [k]: v } }));

  // Drag the item on the preview to set X/Y.
  const previewRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const moveTo = (clientX: number, clientY: number) => {
    const el = previewRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100));
    const y = Math.min(100, Math.max(0, ((clientY - r.top) / r.height) * 100));
    setDraft((d) => ({ ...d, transform: { ...d.transform, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 } }));
  };

  const previewChar: ICharacterEquip = positionable(item.category)
    ? { gender: previewGender, [slotKey]: { code: item.code, emoji: draft.emoji || null, imageUrl: draft.imageUrl || null, transform: draft.transform } }
    : {};

  return (
    <div className="space-y-3">
      {/* Position editor */}
      {positionable(item.category) && (
        <div className="flex flex-col items-center gap-3 pb-3 border-b border-outline-variant">
          <div
            ref={previewRef}
            className="relative cursor-move touch-none"
            style={{ width: 260, height: 260 }}
            onPointerDown={(e) => {
              dragging.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              moveTo(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => dragging.current && moveTo(e.clientX, e.clientY)}
            onPointerUp={() => (dragging.current = false)}
            onPointerLeave={() => (dragging.current = false)}
          >
            <CharacterViewer character={previewChar} size={260} />
            {/* drag marker at current X/Y */}
            <span
              className="absolute pointer-events-none w-5 h-5 rounded-full border-2 border-primary bg-primary/20 shadow"
              style={{ left: `${draft.transform.x}%`, top: `${draft.transform.y}%`, transform: 'translate(-50%, -50%)' }}
            />
          </div>
          <p className="text-[11px] text-on-surface-variant">Kéo trên ảnh để di chuyển · dùng thanh trượt để chỉnh cỡ/xoay</p>
          <div className="flex gap-2">
            {(['male', 'female'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setPreviewGender(g)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${previewGender === g ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'}`}
              >
                <Icon name={g === 'male' ? 'man' : 'woman'} size={15} />
                {g === 'male' ? 'Nam' : 'Nữ'}
              </button>
            ))}
          </div>
          <div className="w-full grid grid-cols-2 gap-x-4 gap-y-2">
            <Slider label="Ngang (X)" value={draft.transform.x} min={0} max={100} step={0.5} onChange={(v) => setT('x', v)} fmt={(v) => `${v}%`} />
            <Slider label="Dọc (Y)" value={draft.transform.y} min={0} max={100} step={0.5} onChange={(v) => setT('y', v)} fmt={(v) => `${v}%`} />
            <Slider label="Cỡ" value={draft.transform.scale} min={0.05} max={1.5} step={0.01} onChange={(v) => setT('scale', v)} fmt={(v) => v.toFixed(2)} />
            <Slider label="Xoay" value={draft.transform.rotation} min={-180} max={180} step={1} onChange={(v) => setT('rotation', v)} fmt={(v) => `${v}°`} />
          </div>
          <button onClick={() => set('transform', DEFAULT_TRANSFORM[item.category] ?? { x: 50, y: 50, scale: 0.3, rotation: 0 })} className="text-xs font-semibold text-primary hover:underline">
            Đặt lại vị trí mặc định
          </button>
        </div>
      )}

      {/* Fields */}
      <div>
        <label className={LABEL}>Tên</label>
        <input className={INPUT} value={draft.name} onChange={(e) => set('name', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Giá (💎)</label>
          <input type="number" className={INPUT} value={draft.price} onChange={(e) => set('price', parseInt(e.target.value, 10) || 0)} />
        </div>
        <div>
          <label className={LABEL}>Độ hiếm</label>
          <select className={INPUT} value={draft.rarity} onChange={(e) => set('rarity', e.target.value as BadgeRarity)}>
            {Object.values(BadgeRarity).map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LABEL}>Emoji</label>
          <input className={INPUT} value={draft.emoji} onChange={(e) => set('emoji', e.target.value)} placeholder="🧢" />
        </div>
        <div>
          <label className={LABEL}>Màu (nền/tên)</label>
          <input className={INPUT} value={draft.color} onChange={(e) => set('color', e.target.value)} placeholder="#e0f2fe" />
        </div>
      </div>
      <div>
        <label className={LABEL}>Ảnh (URL)</label>
        <input className={INPUT} value={draft.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} placeholder="/characters/hat/hat_crown.svg" />
      </div>
      <label className="flex items-center gap-2 text-sm text-on-surface">
        <input type="checkbox" checked={draft.isActive} onChange={(e) => set('isActive', e.target.checked)} /> Đang bán (hiện trong shop)
      </label>

      <div className="flex items-center justify-between pt-2">
        <button onClick={onDelete} className="text-sm font-semibold text-error hover:underline">Xoá</button>
        <button onClick={() => onSave(draft)} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-primary text-on-primary hover:opacity-90 disabled:opacity-60">
          <Icon name={saving ? 'sync' : 'save'} size={18} className={saving ? 'animate-spin' : ''} /> Lưu
        </button>
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, fmt }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; fmt: (v: number) => string }) {
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] font-semibold text-on-surface-variant mb-0.5">
        <span>{label}</span>
        <span className="tabular-nums text-on-surface">{fmt(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full accent-primary" />
    </div>
  );
}

function CreatePanel({ onClose, onCreate }: { onClose: () => void; onCreate: (p: { code: string; name: string; category: ShopItemCategory; kind: ShopItemKind; price: number; payload?: { emoji?: string } }) => void }) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ShopItemCategory>(ShopItemCategory.HAT);
  const [price, setPrice] = useState(100);
  const [emoji, setEmoji] = useState('');
  return (
    <div className="mb-4 rounded-2xl border border-outline-variant bg-surface-container p-4 grid sm:grid-cols-5 gap-3 items-end">
      <div className="sm:col-span-1"><label className={LABEL}>Mã (CODE)</label><input className={INPUT} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="HAT_NEW" /></div>
      <div className="sm:col-span-1"><label className={LABEL}>Tên</label><input className={INPUT} value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div><label className={LABEL}>Loại</label>
        <select className={INPUT} value={category} onChange={(e) => setCategory(e.target.value as ShopItemCategory)}>
          {Object.values(ShopItemCategory).map((c) => <option key={c} value={c}>{CAT_LABEL[c] ?? c}</option>)}
        </select>
      </div>
      <div><label className={LABEL}>Giá / Emoji</label>
        <div className="flex gap-2">
          <input type="number" className={INPUT} value={price} onChange={(e) => setPrice(parseInt(e.target.value, 10) || 0)} />
          <input className={`${INPUT} w-16`} value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="🧢" />
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => code && name && onCreate({ code, name, category, kind: ShopItemKind.COSMETIC, price, payload: emoji ? { emoji } : undefined })} className="flex-1 px-3 py-2 rounded-lg text-sm font-bold bg-primary text-on-primary hover:opacity-90">Tạo</button>
        <button onClick={onClose} className="px-3 py-2 rounded-lg text-sm font-bold bg-surface-container-high text-on-surface-variant">Huỷ</button>
      </div>
    </div>
  );
}
