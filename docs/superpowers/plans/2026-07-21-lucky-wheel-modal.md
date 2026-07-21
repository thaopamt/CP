# Lucky Wheel Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a vibrant, interactive SVG-based Lucky Wheel Modal component for the student check-in page (`CheckinPage.tsx`) featuring smooth 60fps spin animations, glowing neon visuals, confetti celebration effects, and real-time pending spin counter updates.

**Architecture:** 
- A dedicated React component `LuckyWheelModal.tsx` handles the visual rendering, rotation animation physics, confetti effect, and prize reveal card.
- `CheckinPage.tsx` manages modal open/close state and connects the modal's spin action to the existing `useWheelSpin()` React Query mutation (`POST /checkin/wheel/spin`).

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Framer Motion / Inline CSS Animations, SVG, React Query.

## Global Constraints

- Segment ordering matches `CHECKIN_WHEEL_SEGMENTS` from `@cp/shared` (Index 0: 10 Gems, Index 1: 50 XP, Index 2: 25 Gems, Index 3: 150 XP, Index 4: 60 Gems, Index 5: 100 Gems).
- Must handle zero spins gracefully by disabling the SPIN button and guiding the student.
- Animation duration is 4 seconds with a smooth ease-out curve.

---

### Task 1: Create `LuckyWheelModal` Component

**Files:**
- Create: `apps/web/src/app/components/checkin/LuckyWheelModal.tsx`

**Interfaces:**
- Consumes: `ICheckinWheelResult` from `@cp/shared`, `useTranslation` from `react-i18next`.
- Produces: `LuckyWheelModal` React Component.

- [ ] **Step 1: Create `LuckyWheelModal.tsx`**

Create `apps/web/src/app/components/checkin/LuckyWheelModal.tsx`:

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { ICheckinWheelResult } from '@cp/shared';
import { Icon } from '../ui/Icon'; // or SVG fallback

export interface LuckyWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  spinsCount: number;
  onSpin: () => Promise<ICheckinWheelResult>;
}

// 6 segments matching CHECKIN_WHEEL_SEGMENTS
const SEGMENTS = [
  { index: 0, label: '+10 Gems', color: 'from-amber-400 to-yellow-600', icon: 'diamond', textColor: '#5b3a00' },
  { index: 1, label: '+50 XP', color: 'from-purple-500 to-indigo-700', icon: 'bolt', textColor: '#ffffff' },
  { index: 2, label: '+25 Gems', color: 'from-cyan-400 to-blue-600', icon: 'diamond', textColor: '#00334e' },
  { index: 3, label: '+150 XP', color: 'from-emerald-400 to-teal-700', icon: 'bolt', textColor: '#ffffff' },
  { index: 4, label: '+60 Gems', color: 'from-orange-400 to-rose-600', icon: 'diamond', textColor: '#ffffff' },
  { index: 5, label: '+100 Gems', color: 'from-amber-300 to-yellow-500', icon: 'diamond', textColor: '#4a2c00' },
];

export const LuckyWheelModal: React.FC<LuckyWheelModalProps> = ({
  isOpen,
  onClose,
  spinsCount,
  onSpin,
}) => {
  const { t } = useTranslation();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [wonResult, setWonResult] = useState<ICheckinWheelResult | null>(null);
  const [showPrizeCard, setShowPrizeCard] = useState(false);

  if (!isOpen) return null;

  const handleSpinClick = async () => {
    if (isSpinning || spinsCount < 1) return;
    setIsSpinning(true);
    setShowPrizeCard(false);
    setWonResult(null);

    try {
      const result = await onSpin();
      const targetIndex = result.segment.index;
      
      // Calculate target angle:
      // Each segment covers 60 degrees. Index 0 starts at top (270deg offset).
      const segmentAngle = 360 / SEGMENTS.length;
      const targetSegmentCenter = targetIndex * segmentAngle + segmentAngle / 2;
      
      // We want pointer at top (0 deg). Segment angle offset:
      const stopAngle = 360 - targetSegmentCenter;
      const extraRotations = 5 * 360; // 5 full loops
      const finalDeg = rotationDeg + extraRotations + (stopAngle - (rotationDeg % 360) + 360) % 360;

      setRotationDeg(finalDeg);

      // Wait 4s for animation to complete
      setTimeout(() => {
        setIsSpinning(false);
        setWonResult(result);
        setShowPrizeCard(true);
      }, 4000);
    } catch (err) {
      setIsSpinning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-surface-container-high border border-outline-variant p-6 shadow-2xl flex flex-col items-center gap-4 text-on-surface overflow-hidden">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSpinning}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-surface-variant text-on-surface-variant transition disabled:opacity-30"
        >
          <span className="text-xl font-bold">✕</span>
        </button>

        {/* Modal Title */}
        <div className="text-center">
          <h3 className="text-title-lg font-extrabold text-primary flex items-center justify-center gap-2">
            ✨ {t('checkin.wheelTitle', 'Vòng quay may mắn')} ✨
          </h3>
          <p className="text-body-sm text-on-surface-variant mt-1">
            {t('checkin.wheelSub', 'Thử vận may để nhận Gems và XP hấp dẫn!')}
          </p>
        </div>

        {/* Wheel Container */}
        <div className="relative w-72 h-72 my-2 flex items-center justify-center">
          {/* Top Pointer */}
          <div className="absolute -top-3 z-30 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-amber-400 filter drop-shadow-md animate-pulse" />

          {/* Glowing Ring Outer */}
          <div className="absolute inset-0 rounded-full border-4 border-amber-400/80 shadow-[0_0_25px_rgba(251,191,36,0.5)] z-10 pointer-events-none" />

          {/* Rotating SVG Wheel */}
          <div
            className="w-full h-full rounded-full overflow-hidden shadow-2xl"
            style={{
              transform: `rotate(${rotationDeg}deg)`,
              transition: isSpinning ? 'transform 4s cubic-bezier(0.15, 0.9, 0.2, 1)' : 'none',
            }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {SEGMENTS.map((seg, i) => {
                const angle = 360 / SEGMENTS.length;
                const startAngle = i * angle;
                const endAngle = (i + 1) * angle;

                const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

                const d = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;
                
                // Color wedges
                const colors = ['#f59e0b', '#8b5cf6', '#06b6d4', '#10b981', '#f97316', '#eab308'];

                return (
                  <g key={seg.index}>
                    <path d={d} fill={colors[i]} stroke="#ffffff" strokeWidth="0.5" />
                    <text
                      x="72"
                      y="50"
                      transform={`rotate(${startAngle + angle / 2}, 50, 50)`}
                      fill="#ffffff"
                      fontSize="4"
                      fontWeight="bold"
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {seg.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Center SPIN Button */}
          <button
            type="button"
            disabled={isSpinning || spinsCount < 1}
            onClick={handleSpinClick}
            className="absolute z-20 w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white font-extrabold text-sm shadow-lg border-2 border-white flex flex-col items-center justify-center hover:scale-105 active:scale-95 transition disabled:opacity-50 disabled:scale-100"
          >
            <span>SPIN</span>
            <span className="text-[10px] opacity-90">({spinsCount})</span>
          </button>
        </div>

        {/* Prize Card Result */}
        {showPrizeCard && wonResult && (
          <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-center animate-bounce-short">
            <h4 className="text-title-md font-bold text-amber-400">🎉 Chúc mừng bạn! 🎉</h4>
            <p className="text-body-md font-semibold text-on-surface mt-1">
              Bạn nhận được{' '}
              <span className="text-primary font-bold">
                +{wonResult.reward.gems ? `${wonResult.reward.gems} Gems` : `${wonResult.reward.xp} XP`}
              </span>
            </p>
          </div>
        )}

        {/* Footer info */}
        <p className="text-label-sm text-on-surface-variant text-center">
          {spinsCount > 0
            ? `Bạn còn ${spinsCount} lượt quay khả dụng.`
            : 'Bạn đã hết lượt quay. Tiếp tục điểm danh để tích lũy thêm lượt quay!'}
        </p>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Verify component builds cleanly with typescript**

Run build or lint check on web app to ensure no compilation errors.

---

### Task 2: Integrate `LuckyWheelModal` into `CheckinPage.tsx`

**Files:**
- Modify: `apps/web/src/app/pages/student/CheckinPage.tsx`

**Interfaces:**
- Consumes: `LuckyWheelModal` component from `../components/checkin/LuckyWheelModal`.
- Produces: Trigger button & modal state management.

- [ ] **Step 1: Update `CheckinPage.tsx` to include `LuckyWheelModal`**

Update `CheckinPage.tsx`:
1. Import `LuckyWheelModal`.
2. Add `isWheelModalOpen` state (`const [isWheelModalOpen, setIsWheelModalOpen] = useState(false);`).
3. Replace simple spin button in `wheelTitle` section with a vibrant CTA button:
```tsx
<button
  type="button"
  onClick={() => setIsWheelModalOpen(true)}
  className="px-lg py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-md hover:brightness-110 active:scale-95 transition flex items-center gap-2"
>
  <Icon name="casino" size={20} />
  Mở Vòng quay may mắn ({status.pendingWheelSpins})
</button>
```
4. Render `<LuckyWheelModal isOpen={isWheelModalOpen} onClose={() => setIsWheelModalOpen(false)} spinsCount={status.pendingWheelSpins} onSpin={spin.mutateAsync} />`.

- [ ] **Step 2: Commit changes**

```bash
git add apps/web/src/app/components/checkin/LuckyWheelModal.tsx apps/web/src/app/pages/student/CheckinPage.tsx
git commit -m "feat(web): add vibrant Lucky Wheel Modal component for student checkin"
```
