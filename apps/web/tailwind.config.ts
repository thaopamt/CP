import type { Config } from 'tailwindcss';
import { join } from 'node:path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const preset = require('../../libs/config/tailwind.preset.cjs');

export default {
  presets: [preset],
  safelist: [
    'theme-ocean',
    'theme-hacker',
    'theme-sunset',
    'theme-forest',
    'theme-cyberpunk',
    'theme-aurora',
    'theme-galaxy',
    'theme-snow',
    'theme-sakura',
    'theme-volcano',
    'theme-party',
  ],
  content: [
    join(__dirname, 'index.html'),
    join(__dirname, 'src/**/*!(*.stories|*.spec).{ts,tsx,html}'),
    // CRITICAL: include libs/ui so its Tailwind classes survive purge
    join(__dirname, '../../libs/ui/src/**/*!(*.stories|*.spec).{ts,tsx,html}'),
  ],
} satisfies Config;
