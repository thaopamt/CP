import { CSSProperties } from 'react';
import { ICharacterEquip, ICharacterSlotItem } from '@cp/shared';

/**
 * Renders a student's equipped character (paper-doll, chibi-3D / Gunny style).
 *
 * Each character item can carry a `transform` ({x,y,scale,rotation}, set in the
 * admin position editor) — the layer is then placed at that spot. Without a
 * transform the layer fills the whole 768×768 canvas (art pre-positioned by the
 * artist). Emoji are used as a fallback when an item has no `imageUrl`.
 *
 * A gendered base body (`character.gender`) is an always-present layer the
 * outfit/items are dressed onto: /characters/base/{male|female}.svg
 */

const DEFAULT_BODY = '🧑';
const baseBodyUrl = (gender?: string | null) => (gender ? `/characters/base/${gender}.svg` : null);

export function hasCharacter(c?: ICharacterEquip | null): boolean {
  if (!c) return false;
  return !!(c.gender || c.hat || c.outfit || c.weapon || c.pet || c.wings || c.background);
}

function hasArt(c: ICharacterEquip): boolean {
  return !!(
    c.gender ||
    c.background?.imageUrl ||
    c.wings?.imageUrl ||
    c.outfit?.imageUrl ||
    c.pet?.imageUrl ||
    c.hat?.imageUrl ||
    c.weapon?.imageUrl
  );
}

const hideOnError = (e: { currentTarget: HTMLImageElement }) => {
  e.currentTarget.style.display = 'none';
};

/** Full-canvas image layer (art pre-positioned → stack inset-0). */
function ImgLayer({ src, cover, fit }: { src: string; cover?: boolean; fit?: 'top' }) {
  return (
    <img
      src={src}
      alt=""
      onError={hideOnError}
      className={`absolute inset-0 w-full h-full select-none pointer-events-none ${cover ? 'object-cover' : 'object-contain'} ${
        fit === 'top' ? 'object-top' : ''
      }`}
    />
  );
}

/** One slot: image/emoji, positioned by transform when present, else legacy. */
function Layer({
  item,
  canvasPx,
  emojiPx,
  emojiStyle,
  fallbackEmoji,
  cover,
  fit,
}: {
  item?: ICharacterSlotItem | null;
  canvasPx: number;
  emojiPx: number;
  emojiStyle: CSSProperties;
  fallbackEmoji?: string;
  cover?: boolean;
  fit?: 'top';
}) {
  const t = item?.transform ?? undefined;

  if (t) {
    const box: CSSProperties = {
      left: `${t.x}%`,
      top: `${t.y}%`,
      width: `${t.scale * 100}%`,
      height: `${t.scale * 100}%`,
      transform: `translate(-50%, -50%) rotate(${t.rotation}deg)`,
    };
    if (item?.imageUrl) {
      return <img src={item.imageUrl} alt="" onError={hideOnError} className="absolute object-contain select-none pointer-events-none" style={box} />;
    }
    const emoji = item?.emoji ?? fallbackEmoji;
    if (!emoji) return null;
    return (
      <span className="absolute grid place-items-center leading-none select-none pointer-events-none" style={{ ...box, fontSize: t.scale * canvasPx * 0.9 }}>
        {emoji}
      </span>
    );
  }

  if (item?.imageUrl) return <ImgLayer src={item.imageUrl} cover={cover} fit={fit} />;
  const emoji = item?.emoji ?? fallbackEmoji;
  if (!emoji) return null;
  return (
    <span className="absolute select-none leading-none pointer-events-none" style={{ fontSize: emojiPx, ...emojiStyle }}>
      {emoji}
    </span>
  );
}

/** The composed layer stack (no frame) — shared by the viewer and the avatar. */
export function CharacterLayers({ character, size }: { character?: ICharacterEquip | null; size: number }) {
  const c = character ?? {};
  const center: CSSProperties = { left: '50%', transform: 'translateX(-50%)' };
  const baseUrl = baseBodyUrl(c.gender);

  return (
    <>
      {/* Background */}
      {c.background?.imageUrl ? (
        <ImgLayer src={c.background.imageUrl} cover />
      ) : (
        c.background?.emoji && (
          <span className="absolute inset-0 grid place-items-center opacity-25 select-none pointer-events-none" style={{ fontSize: size * 0.7 }}>
            {c.background.emoji}
          </span>
        )
      )}
      {/* Wings (behind body) */}
      <Layer item={c.wings} canvasPx={size} emojiPx={size * 0.62} emojiStyle={{ ...center, top: '46%', transform: 'translate(-50%, -50%)', opacity: 0.85 }} />
      {/* Base body */}
      {baseUrl && <ImgLayer src={baseUrl} />}
      {/* Outfit */}
      <Layer item={c.outfit} fallbackEmoji={baseUrl ? undefined : DEFAULT_BODY} canvasPx={size} emojiPx={size * 0.5} emojiStyle={{ ...center, top: '54%', transform: 'translate(-50%, -50%)' }} />
      {/* Pet */}
      <Layer item={c.pet} canvasPx={size} emojiPx={size * 0.22} emojiStyle={{ left: '10%', bottom: '8%' }} />
      {/* Hat */}
      <Layer item={c.hat} canvasPx={size} emojiPx={size * 0.3} emojiStyle={{ ...center, top: '26%', transform: 'translate(-50%, -50%)' }} />
      {/* Weapon */}
      <Layer item={c.weapon} canvasPx={size} emojiPx={size * 0.26} emojiStyle={{ right: '12%', top: '56%', transform: 'translateY(-50%)' }} />
    </>
  );
}

/** Large character preview (profile, admin editor). `size` is the square px. */
export function CharacterViewer({
  character,
  size = 220,
  className = '',
}: {
  character?: ICharacterEquip | null;
  size?: number;
  className?: string;
}) {
  const c = character ?? {};
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-outline-variant ${className}`}
      style={{ width: size, height: size, background: c.background?.color ?? 'var(--color-surface-container-high)' }}
    >
      <CharacterLayers character={c} size={size} />
    </div>
  );
}

/**
 * Compact circular character for avatar slots. With art it zooms into the head;
 * with emoji it shows background tint + body + hat.
 */
export function CharacterAvatar({
  character,
  size = 32,
  className = '',
}: {
  character?: ICharacterEquip | null;
  size?: number;
  className?: string;
}) {
  const c = character ?? {};

  if (hasArt(c)) {
    const inner = size * 1.9; // zoom in so the face fills the circle
    return (
      <span
        className={`relative inline-block rounded-full overflow-hidden shrink-0 ${className}`}
        style={{ width: size, height: size, background: c.background?.color ?? 'var(--color-surface-container-high)' }}
      >
        <span className="absolute" style={{ width: inner, height: inner, left: '50%', top: 0, transform: 'translateX(-50%) translateY(-16%)' }}>
          <CharacterLayers character={c} size={inner} />
        </span>
      </span>
    );
  }

  // Emoji mode.
  const body = c.outfit?.emoji ?? DEFAULT_BODY;
  return (
    <span
      className={`relative inline-grid place-items-center rounded-full overflow-hidden shrink-0 ${className}`}
      style={{ width: size, height: size, background: c.background?.color ?? 'var(--color-surface-container-high)' }}
    >
      <span className="leading-none select-none" style={{ fontSize: size * 0.6 }}>{body}</span>
      {c.hat?.emoji && (
        <span className="absolute select-none leading-none" style={{ fontSize: size * 0.42, top: -size * 0.04, left: '50%', transform: 'translateX(-50%)' }}>
          {c.hat.emoji}
        </span>
      )}
    </span>
  );
}
