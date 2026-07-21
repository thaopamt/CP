# Gem Box Opening Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement an interactive 3D/CSS animated Gem Chest Opening Modal (`GemBoxModal.tsx`) for the student shop page (`ShopPage.tsx`) when purchasing or opening the `GEM_BOX` item.

**Architecture:**
- Create `GemBoxModal.tsx` in `apps/web/src/app/components/shop/GemBoxModal.tsx` with 3-stage opening physics (Idle -> Shake & Unlock -> Glowing Reveal with profit/loss metrics).
- Modify `ShopPage.tsx` so clicking Buy on `GEM_BOX` opens `GemBoxModal` instead of a plain confirm dialog.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Material Icons / SVG, React Query (`usePurchaseItem`).

## Global Constraints

- Item code `GEM_BOX` triggers `GemBoxModal`.
- Price is 100 Gems (`item.price`).
- Handles profit (>100 Gems), break-even (=100 Gems), and loss (<100 Gems) feedback gracefully with appropriate celebratory visuals.

---

### Task 1: Create `GemBoxModal` Component

**Files:**
- Create: `apps/web/src/app/components/shop/GemBoxModal.tsx`

**Interfaces:**
- Consumes: `IShopItem`, `IPurchaseResult` from `@cp/shared`.
- Produces: `GemBoxModal` React Component.

- [ ] **Step 1: Create `GemBoxModal.tsx`**

Create `apps/web/src/app/components/shop/GemBoxModal.tsx`:

```tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { IShopCatalogEntry, IPurchaseResult } from '@cp/shared';
import { Icon } from '../ui/Icon';

export interface GemBoxModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: IShopCatalogEntry | null;
  userGems: number;
  onOpenBox: (itemId: string) => Promise<IPurchaseResult>;
}

export const GemBoxModal: React.FC<GemBoxModalProps> = ({
  isOpen,
  onClose,
  entry,
  userGems,
  onOpenBox,
}) => {
  const { t } = useTranslation();
  const [openingState, setOpeningState] = useState<'idle' | 'opening' | 'revealed'>('idle');
  const [purchaseResult, setPurchaseResult] = useState<IPurchaseResult | null>(null);

  if (!isOpen || !entry) return null;

  const item = entry.item;
  const cost = item.price;
  const canAfford = userGems >= cost;

  const handleOpenClick = async () => {
    if (openingState === 'opening' || !canAfford) return;

    setOpeningState('opening');
    setPurchaseResult(null);

    try {
      const res = await onOpenBox(item.id);
      
      // Wait 2.5s for shaking and chest light animation
      setTimeout(() => {
        setPurchaseResult(res);
        setOpeningState('revealed');
      }, 2500);
    } catch {
      setOpeningState('idle');
    }
  };

  const handleResetOrClose = () => {
    setOpeningState('idle');
    setPurchaseResult(null);
    onClose();
  };

  const awarded = purchaseResult?.awardedGems ?? 0;
  const profit = awarded - cost; // Can be positive (profit) or negative (loss)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/40 p-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] flex flex-col items-center gap-4 text-white overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleResetOrClose}
          disabled={openingState === 'opening'}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition disabled:opacity-30 cursor-pointer z-30"
        >
          <span className="text-lg font-bold">✕</span>
        </button>

        {/* Header */}
        <div className="text-center pt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider mb-2">
            ✨ MYSTERY CHEST ✨
          </div>
          <h3 className="text-2xl font-black bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
            HỘP QUÀ ĐÁ QUÝ
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Mở rương bí ẩn — Nhận ngẫu nhiên 20–140 Gems
          </p>
        </div>

        {/* Chest Visual Container */}
        <div className="relative w-64 h-56 my-2 flex items-center justify-center">
          {/* Ambient Ray Background */}
          {openingState !== 'idle' && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500/30 to-purple-500/30 blur-2xl animate-pulse pointer-events-none" />
          )}

          {/* Treasure Chest Artwork & Animation */}
          <div className={`relative flex flex-col items-center justify-center transition-all duration-300 ${
            openingState === 'opening' ? 'animate-[bounce_0.4s_infinite]' : ''
          }`}>
            <div className={`w-36 h-36 rounded-3xl bg-gradient-to-br from-amber-600 via-purple-700 to-slate-900 border-4 border-amber-400/80 shadow-[0_0_40px_rgba(245,158,11,0.5)] flex flex-col items-center justify-center relative overflow-hidden ${
              openingState === 'revealed' ? 'scale-105 border-amber-300 shadow-[0_0_60px_rgba(251,191,36,0.8)]' : ''
            }`}>
              {/* Chest Keyhole / Lock */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-b from-amber-300 to-amber-600 border-2 border-white/60 flex items-center justify-center shadow-lg">
                <span className="text-xl">{openingState === 'revealed' ? '🔓' : '💎'}</span>
              </div>
              
              <span className="text-xs font-black text-amber-200 mt-2 tracking-widest uppercase">
                {openingState === 'idle' ? 'LOCKED' : openingState === 'opening' ? 'OPENING...' : 'UNLOCKED'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button / Result Display */}
        {openingState === 'idle' && (
          <div className="w-full flex flex-col items-center gap-3">
            <button
              type="button"
              disabled={!canAfford}
              onClick={handleOpenClick}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 text-slate-950 font-black text-base shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:brightness-110 active:scale-95 transition disabled:opacity-40 disabled:scale-100 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>🎁 MỞ HỘP QUÀ ({cost} GEMS)</span>
            </button>
            {!canAfford && (
              <p className="text-xs text-rose-400 font-semibold">
                Bạn không đủ Gems (Hiện có: {userGems} Gems)
              </p>
            )}
          </div>
        )}

        {openingState === 'opening' && (
          <div className="py-3 text-amber-300 text-sm font-bold animate-pulse flex items-center gap-2">
            <span>✨ Đang mở rương quà bí ẩn... ✨</span>
          </div>
        )}

        {openingState === 'revealed' && purchaseResult && (
          <div className="w-full flex flex-col gap-3 animate-fade-in">
            <div className={`p-4 rounded-2xl border text-center ${
              profit >= 0
                ? 'bg-amber-500/20 border-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                : 'bg-slate-800/80 border-slate-700'
            }`}>
              <h4 className="text-sm font-extrabold text-amber-300 uppercase tracking-wider">
                {profit > 0 ? '🎉 BẠN ĐÃ TRÚNG LỚN! 🎉' : profit === 0 ? '⚖️ HÒA VỐN! ⚖️' : '✨ KẾT QUẢ MỞ HỘP ✨'}
              </h4>
              <div className="text-3xl font-black text-white mt-1 tabular-nums">
                +{awarded} <span className="text-amber-400">💎 Gems</span>
              </div>
              <p className={`text-xs font-bold mt-1.5 ${profit > 0 ? 'text-emerald-400' : profit === 0 ? 'text-amber-300' : 'text-slate-400'}`}>
                {profit > 0
                  ? `Lời +${profit} Gems so với giá mở!`
                  : profit === 0
                  ? 'Hòa vốn 100 Gems!'
                  : `Nhận ${awarded} Gems (Chi phí 100 Gems)`}
              </p>
            </div>

            <div className="flex gap-2">
              {canAfford && (
                <button
                  type="button"
                  onClick={handleOpenClick}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 font-black text-xs shadow-md hover:brightness-110 active:scale-95 transition cursor-pointer"
                >
                  MỞ TIẾP (100 GEMS)
                </button>
              )}
              <button
                type="button"
                onClick={handleResetOrClose}
                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer"
              >
                ĐÓNG
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

### Task 2: Integrate `GemBoxModal` into `ShopPage.tsx`

**Files:**
- Modify: `apps/web/src/app/pages/student/ShopPage.tsx`

- [ ] **Step 1: Import and hook `GemBoxModal` in `ShopPage.tsx`**

1. Import `GemBoxModal` from `../../components/shop/GemBoxModal`.
2. Add state `const [selectedGemBoxEntry, setSelectedGemBoxEntry] = useState<IShopCatalogEntry | null>(null);`.
3. In `onBuy(entry)` handler: If `entry.item.code === 'GEM_BOX'`, open `GemBoxModal` by setting `setSelectedGemBoxEntry(entry)` instead of calling standard confirm dialog.
4. Render `<GemBoxModal isOpen={!!selectedGemBoxEntry} onClose={() => setSelectedGemBoxEntry(null)} entry={selectedGemBoxEntry} userGems={gems} onOpenBox={(itemId) => purchase.mutateAsync(itemId)} />`.
