// ───────────────────────────────────────────────────────────────────────────
// Preset character avatars. The SVGs live in apps/web/public/character/{male,
// female}/ and are served statically at /character/<gender>/<stem>.svg. A
// CHARACTER shop item stores one of these paths in its `imageUrl`; equipping
// it makes that image the student's avatar everywhere.
// ───────────────────────────────────────────────────────────────────────────

export type CharacterGender = 'male' | 'female';

/** File stems shared by both genders, in tier order (must match the assets). */
const TIERS = [
  '1-new-biew',
  '2-brown',
  '3-iron',
  '4-silver',
  '5-gold',
  '6-platinum',
  '7-diamond',
  '8-emerald',
  '9-ruby',
  '10-turquoise',
  '11-amethyst',
  '12-royal',
  '13-legend',
  '14-myth',
  '15-divine',
] as const;

export const CHARACTER_GENDERS: CharacterGender[] = ['male', 'female'];

export interface CharacterPreset {
  /** Public path served by the web app, e.g. /character/male/5-gold.svg */
  path: string;
  gender: CharacterGender;
  /** Human label, e.g. "Gold". */
  label: string;
}

/** '5-gold' → 'Gold', '1-new-biew' → 'New Biew'. */
function titleize(stem: string): string {
  return stem
    .replace(/^\d+-/, '')
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export const CHARACTER_PRESETS: CharacterPreset[] = CHARACTER_GENDERS.flatMap((gender) =>
  TIERS.map((stem) => ({
    path: `/character/${gender}/${stem}.svg`,
    gender,
    label: titleize(stem),
  })),
);

export function charactersByGender(gender: CharacterGender): CharacterPreset[] {
  return CHARACTER_PRESETS.filter((c) => c.gender === gender);
}
