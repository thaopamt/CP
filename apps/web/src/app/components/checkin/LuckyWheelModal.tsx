import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ICheckinWheelResult } from '@cp/shared';

export interface LuckyWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  spinsCount: number;
  onSpin: () => Promise<ICheckinWheelResult>;
}

interface SegmentConfig {
  index: number;
  label: string;
  subLabel: string;
  kind: 'gems' | 'xp';
  amount: number;
  color: string;
  darkColor: string;
  textColor: string;
}

// 6 segments matching CHECKIN_WHEEL_SEGMENTS:
// 0: 10 Gems, 1: 50 XP, 2: 25 Gems, 3: 150 XP, 4: 60 Gems, 5: 100 Gems
const SEGMENTS: SegmentConfig[] = [
  { index: 0, label: '10', subLabel: 'GEMS', kind: 'gems', amount: 10, color: '#fbbf24', darkColor: '#d97706', textColor: '#78350f' },
  { index: 1, label: '50', subLabel: 'XP', kind: 'xp', amount: 50, color: '#a855f7', darkColor: '#7e22ce', textColor: '#ffffff' },
  { index: 2, label: '25', subLabel: 'GEMS', kind: 'gems', amount: 25, color: '#06b6d4', darkColor: '#0991b1', textColor: '#ffffff' },
  { index: 3, label: '150', subLabel: 'XP', kind: 'xp', amount: 150, color: '#10b981', darkColor: '#047857', textColor: '#ffffff' },
  { index: 4, label: '60', subLabel: 'GEMS', kind: 'gems', amount: 60, color: '#f97316', darkColor: '#c2410c', textColor: '#ffffff' },
  { index: 5, label: '100', subLabel: 'GEMS', kind: 'gems', amount: 100, color: '#f59e0b', darkColor: '#b45309', textColor: '#78350f' },
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

      // Each segment = 60 deg
      const segmentAngle = 360 / SEGMENTS.length;
      const targetSegmentCenter = targetIndex * segmentAngle + segmentAngle / 2;

      // Pointer is top (0 deg). Inverse offset:
      const stopAngle = 360 - targetSegmentCenter;
      const extraRotations = 6 * 360; // 6 full rotations
      const currentMod = rotationDeg % 360;
      const neededDelta = (stopAngle - currentMod + 360) % 360;
      const finalDeg = rotationDeg + extraRotations + neededDelta;

      setRotationDeg(finalDeg);

      // 4 seconds smooth easing duration
      setTimeout(() => {
        setIsSpinning(false);
        setWonResult(result);
        setShowPrizeCard(true);
      }, 4100);
    } catch {
      setIsSpinning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in select-none">
      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 p-6 shadow-[0_0_50px_rgba(245,158,11,0.2)] flex flex-col items-center gap-4 text-white overflow-hidden">
        {/* Glow ambient background lights */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isSpinning}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition disabled:opacity-30 cursor-pointer"
        >
          <span className="text-lg font-bold">✕</span>
        </button>

        {/* Header */}
        <div className="text-center pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            ✨ Lucky Wheel ✨
          </div>
          <h3 className="text-2xl font-black bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent drop-shadow-sm">
            {t('checkin.wheelTitle', 'VÒNG QUAY MAY MẮN')}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {t('checkin.wheelSub', 'Quay thưởng để nhận thêm Đá quý & XP hấp dẫn!')}
          </p>
        </div>

        {/* Wheel Container */}
        <div className="relative w-80 h-80 my-2 flex items-center justify-center">
          {/* Top Pointer Indicator */}
          <div className="absolute -top-4 z-40 flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-b from-amber-300 to-amber-600 p-1 shadow-lg border border-white/40 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-red-600 shadow-inner" />
            </div>
            <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-amber-400 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)] -mt-2" />
          </div>

          {/* Outer Ring with LED Bulbs */}
          <div className="absolute inset-0 rounded-full border-8 border-amber-500/80 bg-gradient-to-b from-amber-400 to-amber-700 shadow-[0_0_35px_rgba(245,158,11,0.4)] z-10 pointer-events-none p-1">
            {/* 12 Decorative LED dots */}
            {Array.from({ length: 12 }).map((_, idx) => {
              const angle = (idx * 30 * Math.PI) / 180;
              const r = 48; // % from center
              const x = 50 + r * Math.cos(angle);
              const y = 50 + r * Math.sin(angle);
              return (
                <div
                  key={idx}
                  className={`absolute w-2.5 h-2.5 rounded-full border border-white/50 -translate-x-1/2 -translate-y-1/2 shadow-sm ${
                    idx % 2 === 0
                      ? 'bg-yellow-200 shadow-[0_0_8px_#fef08a] animate-pulse'
                      : 'bg-amber-400 shadow-[0_0_6px_#fbbf24]'
                  }`}
                  style={{ left: `${x}%`, top: `${y}%` }}
                />
              );
            })}
          </div>

          {/* Rotating SVG Wheel */}
          <div
            className="w-[91%] h-[91%] rounded-full overflow-hidden shadow-2xl relative z-20"
            style={{
              transform: `rotate(${rotationDeg}deg)`,
              transition: isSpinning ? 'transform 4.1s cubic-bezier(0.12, 0.8, 0.15, 1)' : 'none',
            }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <defs>
                {SEGMENTS.map((seg) => (
                  <linearGradient id={`grad-${seg.index}`} key={seg.index} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={seg.color} />
                    <stop offset="100%" stopColor={seg.darkColor} />
                  </linearGradient>
                ))}
              </defs>

              {SEGMENTS.map((seg, i) => {
                const angle = 360 / SEGMENTS.length;
                const startAngle = i * angle;
                const endAngle = (i + 1) * angle;

                const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

                const d = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;

                // Calculate center angle of the wedge
                const midAngle = startAngle + angle / 2;

                // Position content further out near the rim (radius = 34 out of 50)
                const textRadius = 34;
                const textX = 50 + textRadius * Math.cos((Math.PI * midAngle) / 180);
                const textY = 50 + textRadius * Math.sin((Math.PI * midAngle) / 180);

                return (
                  <g key={seg.index}>
                    {/* Wedge slice */}
                    <path
                      d={d}
                      fill={`url(#grad-${seg.index})`}
                      stroke="#ffffff"
                      strokeWidth="0.8"
                      strokeOpacity="0.8"
                    />

                    {/* Separator line shadow */}
                    <line
                      x1="50"
                      y1="50"
                      x2={x1}
                      y2={y1}
                      stroke="rgba(0,0,0,0.15)"
                      strokeWidth="1"
                    />

                    {/* Label & Icon positioned nicely near the outer rim */}
                    <g transform={`translate(${textX}, ${textY}) rotate(${midAngle + 90})`}>
                      {/* Icon */}
                      <text
                        x="0"
                        y="-4.5"
                        fill={seg.textColor}
                        fontSize="3.8"
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        {seg.kind === 'gems' ? '💎' : '⚡'}
                      </text>
                      {/* Amount */}
                      <text
                        x="0"
                        y="0.5"
                        fill={seg.textColor}
                        fontSize="4.2"
                        fontWeight="900"
                        textAnchor="middle"
                        dominantBaseline="central"
                        style={{ fontFamily: 'system-ui, sans-serif' }}
                      >
                        +{seg.label}
                      </text>
                      {/* Sub-label */}
                      <text
                        x="0"
                        y="4.5"
                        fill={seg.textColor}
                        fontSize="2.4"
                        fontWeight="700"
                        opacity="0.9"
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        {seg.subLabel}
                      </text>
                    </g>
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
            className="absolute z-30 w-20 h-20 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-orange-600 text-white font-black shadow-[0_0_20px_rgba(245,158,11,0.6)] border-4 border-slate-900 flex flex-col items-center justify-center hover:scale-105 active:scale-95 transition duration-200 disabled:opacity-60 disabled:scale-100 disabled:shadow-none cursor-pointer group"
          >
            <span className="text-base font-extrabold tracking-wider group-hover:text-yellow-100 drop-shadow">SPIN</span>
            <span className="text-[10px] font-bold bg-black/30 px-2 py-0.5 rounded-full mt-0.5 text-amber-200">
              {spinsCount} lượt
            </span>
          </button>
        </div>

        {/* Prize Reveal Card */}
        {showPrizeCard && wonResult && (
          <div className="w-full bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-400/40 rounded-2xl p-4 text-center animate-fade-in shadow-lg">
            <h4 className="text-base font-black text-amber-300 flex items-center justify-center gap-1.5">
              <span>🎉</span> BẠN ĐÃ TRÚNG THƯỞNG! <span>🎉</span>
            </h4>
            <p className="text-lg font-extrabold text-white mt-1">
              +
              {wonResult.reward.gems ? (
                <span className="text-amber-400">{wonResult.reward.gems} 💎 Gems</span>
              ) : (
                <span className="text-purple-400">{wonResult.reward.xp} ⚡ XP</span>
              )}
            </p>
          </div>
        )}

        {/* Footer Info */}
        <p className="text-xs text-slate-400 text-center font-medium">
          {spinsCount > 0
            ? `Bạn còn ${spinsCount} lượt quay. Nhấn SPIN để thử vận may!`
            : 'Đã hết lượt quay. Tích cực điểm danh hàng ngày để nhận thêm lượt quay!'}
        </p>
      </div>
    </div>
  );
};
