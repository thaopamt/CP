import { useEffect, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadFull } from 'tsparticles';
import type { ISourceOptions } from '@tsparticles/engine';
import { useTheme } from '../providers/ThemeProvider';
import { useThemeStore } from '../stores/theme.store';

const themeColors: Record<string, { light: string[]; dark: string[] }> = {
  galaxy: {
    dark: ['#ffffff', '#c084fc', '#60a5fa'],
    light: ['#ffffff', '#c084fc', '#60a5fa'],
  },
  hacker: {
    dark: ['#22c55e'],
    light: ['#15803d'],
  },
  ocean: {
    dark: ['#7dd3fc', '#e0f2fe', '#ffffff'],
    light: ['#0284c7', '#0ea5e9', '#38bdf8'],
  },
  forest: {
    dark: ['#a3e635', '#34d399', '#facc15'],
    light: ['#15803d', '#16a34a', '#ca8a04'],
  },
  snow: {
    dark: ['#ffffff'],
    light: ['#475569', '#0284c7'],
  },
  sakura: {
    dark: ['#fbcfe8', '#f472b6', '#fda4af'],
    light: ['#db2777', '#f472b6', '#c026d3'],
  },
  volcano: {
    dark: ['#ef4444', '#f97316', '#fbbf24'],
    light: ['#b91c1c', '#ea580c', '#d97706'],
  },
  party: {
    dark: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
    light: ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777'],
  },
  cyberpunk: {
    dark: ['#f472b6', '#22d3ee', '#fde047'],
    light: ['#db2777', '#0891b2', '#ca8a04'],
  },
  aurora: {
    dark: ['#c084fc', '#60a5fa', '#34d399'],
    light: ['#e879f9', '#93c5fd', '#6ee7b7'],
  },
  sunset: {
    dark: ['#fbbf24', '#f87171', '#f472b6'],
    light: ['#d97706', '#dc2626', '#db2777'],
  },
};

const themeConfigs: Record<string, ISourceOptions> = {
  galaxy: {
    background: { color: { value: 'transparent' } },
    particles: {
      number: { value: 180, density: { enable: true } },
      color: { value: ['#ffffff', '#c084fc', '#60a5fa'] },
      shape: { type: 'circle' },
      opacity: {
        value: { min: 0.1, max: 0.9 },
        animation: { enable: true, speed: 1.2, sync: false },
      },
      size: { value: { min: 0.8, max: 3.2 } },
      move: { enable: true, speed: 0.15, direction: 'none', outModes: 'out', random: true },
    },
    emitters: [
      {
        direction: 'none',
        rate: { quantity: 1, delay: 15 },
        size: { width: 100, height: 100, mode: 'percent' },
        position: { x: 50, y: 50 },
        particles: {
          shape: {
            type: 'image',
            options: {
              image: [
                { src: '/themes/galaxy/elenment_1.svg', width: 100, height: 100 },
                { src: '/themes/galaxy/elenment_2.svg', width: 100, height: 100 },
                { src: '/themes/galaxy/elenment_3.svg', width: 100, height: 100 },
                { src: '/themes/galaxy/elenment_4.svg', width: 100, height: 100 },
                { src: '/themes/galaxy/elenment_5.svg', width: 100, height: 100 },
                { src: '/themes/galaxy/elenment_6.svg', width: 100, height: 100 },
                { src: '/themes/galaxy/elenment_7.svg', width: 100, height: 100 },
                { src: '/themes/galaxy/elenment_8.svg', width: 100, height: 100 },
                { src: '/themes/galaxy/elenment_9.svg', width: 100, height: 100 },
                { src: '/themes/galaxy/elenment_10.svg', width: 100, height: 100 },
                { src: '/themes/galaxy/elenment_11.svg', width: 100, height: 100 },
              ]
            }
          },
          size: { value: { min: 14, max: 28 } },
          opacity: { value: { min: 0.4, max: 0.85 } },
          move: { enable: true, speed: 0.05, direction: 'none', outModes: 'out', random: true }
        }
      },
      {
        direction: 'none',
        rate: { quantity: 1, delay: 30 },
        size: { width: 100, height: 100, mode: 'percent' },
        position: { x: 50, y: 50 },
        particles: {
          shape: {
            type: 'image',
            options: {
              image: [
                { src: '/themes/galaxy/galaxy.svg', width: 100, height: 100 },
              ]
            }
          },
          size: { value: { min: 45, max: 80 } },
          opacity: { value: { min: 0.15, max: 0.35 } },
          move: { enable: true, speed: 0.02, direction: 'none', outModes: 'out', random: true }
        }
      }
    ]
  },
  hacker: {
    background: { color: { value: 'transparent' } },
    particles: {
      number: { value: 75, density: { enable: true } },
      color: { value: '#22c55e' },
      shape: {
        type: 'char',
        options: {
          char: {
            value: ['0', '1', 'A', 'F', 'X', '$', '{', '}', '<', '>', '/', ';', '[', ']', '+', '-', '*', '#', '@'],
            font: 'monospace',
            weight: 'bold'
          }
        }
      },
      opacity: {
        value: { min: 0.25, max: 0.9 },
        animation: { enable: true, speed: 1.5, sync: false }
      },
      size: { value: { min: 11, max: 18 } },
      shadow: {
        enable: true,
        color: '#22c55e',
        blur: 6
      },
      move: { 
        enable: true, 
        speed: { min: 2, max: 4.8 }, 
        direction: 'bottom', 
        outModes: 'out', 
        straight: true 
      },
    },
  },
  ocean: {
    background: { color: { value: 'transparent' } },
    particles: {
      number: { value: 60 },
      color: { value: ['#7dd3fc', '#e0f2fe', '#ffffff'] },
      shape: { type: 'circle' },
      opacity: {
        value: { min: 0.2, max: 0.7 },
        animation: { enable: true, speed: 0.8, sync: false }
      },
      size: { value: { min: 3, max: 9 } },
      move: { enable: true, speed: 1.5, direction: 'top', outModes: 'out', straight: false },
      wobble: { enable: true, distance: 8, speed: 5 }
    },
  },
  forest: {
    background: { color: { value: 'transparent' } },
    particles: {
      number: { value: 70 },
      color: { value: ['#a3e635', '#34d399', '#facc15'] },
      shape: { type: 'circle' },
      opacity: {
        value: { min: 0.1, max: 0.85 },
        animation: { enable: true, speed: 1.6, sync: false }
      },
      size: { value: { min: 1.8, max: 4.5 } },
      move: { enable: true, speed: 0.7, direction: 'none', random: true, outModes: 'out' },
    },
  },
  snow: {
    background: { color: { value: 'transparent' } },
    particles: {
      number: { value: 120 },
      color: { value: '#ffffff' },
      shape: { type: 'circle' },
      opacity: {
        value: { min: 0.3, max: 0.8 },
        animation: { enable: true, speed: 0.6 }
      },
      size: { value: { min: 1.5, max: 4.5 } },
      move: { enable: true, speed: 1.8, direction: 'bottom', straight: false, outModes: 'out' },
      wobble: { enable: true, distance: 10, speed: 4 }
    },
    emitters: [
      {
        direction: 'bottom',
        rate: { quantity: 1, delay: 3.5 },
        size: { width: 100, height: 0, mode: 'percent' },
        position: { x: 50, y: -5 },
        particles: {
          shape: {
            type: 'image',
            options: {
              image: [
                { src: '/themes/snow/snowflake.svg', width: 100, height: 100 },
                { src: '/themes/snow/snowman.svg', width: 100, height: 100 },
                { src: '/themes/snow/snowman-cartoon.svg', width: 100, height: 100 },

              ]
            }
          },
          size: { value: { min: 18, max: 32 } },
          opacity: { value: { min: 0.5, max: 0.95 } },
          move: { enable: true, speed: 1.5, direction: 'bottom', straight: false, outModes: 'out' },
          wobble: { enable: true, distance: 15, speed: 3 },
          rotate: { value: { min: 0, max: 360 }, animation: { enable: true, speed: 6 } }
        }
      }
    ]
  },
  sakura: {
    background: { color: { value: 'transparent' } },
    particles: {
      number: { value: 15 },
      shape: {
        type: 'image',
        options: {
          image: [
            { src: '/themes/sakura/SakuraPetals3DRender.svg', width: 400, height: 400 }
          ]
        }
      },
      opacity: {
        value: { min: 0.4, max: 0.85 },
        animation: { enable: true, speed: 0.5 }
      },
      size: { value: { min: 12, max: 24 } },
      move: { enable: false },
      rotate: { value: 0, animation: { enable: false } },
      wobble: { enable: false }
    }
  },
  volcano: {
    background: { color: { value: 'transparent' } },
    particles: {
      number: { value: 90 },
      color: { value: ['#ef4444', '#f97316', '#fbbf24'] },
      shape: { type: 'circle' },
      opacity: {
        value: { min: 0.4, max: 1 },
        animation: { enable: true, speed: 2.2, sync: false }
      },
      size: { value: { min: 1.5, max: 4.2 } },
      move: { enable: true, speed: 3.2, direction: 'top', random: true, outModes: 'out' },
    },
  },
  party: {
    background: { color: { value: 'transparent' } },
    particles: {
      number: { value: 95 },
      color: { value: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'] },
      shape: { type: ['square', 'circle', 'polygon'] },
      opacity: { value: 0.95 },
      size: { value: { min: 5, max: 11 } },
      move: { enable: true, speed: 4, direction: 'bottom', outModes: 'out', random: true },
      rotate: { value: { min: 0, max: 360 }, animation: { enable: true, speed: 18 } },
      wobble: { enable: true, distance: 18, speed: 10 }
    },
  },
  cyberpunk: {
    background: { color: { value: 'transparent' } },
    particles: {
      number: { value: 0 }
    },
    emitters: [
      {
        direction: 'top-right',
        rate: { quantity: 1, delay: 6 },
        size: { width: 0, height: 80, mode: 'percent' },
        position: { x: -5, y: 70 },
        particles: {
          shape: {
            type: 'image',
            options: {
              image: [
                { src: '/themes/cyberpunk/robot.png', width: 100, height: 100 },
                { src: '/themes/cyberpunk/spaceship.png', width: 100, height: 100 },
                { src: '/themes/cyberpunk/monster.png', width: 100, height: 100 }
              ]
            }
          },
          size: { value: { min: 25, max: 45 } },
          opacity: { value: { min: 0.6, max: 0.95 } },
          move: { enable: true, speed: 1.5, direction: 'top-right', outModes: 'out' },
          wobble: { enable: true, distance: 10, speed: 2 },
          rotate: { value: { min: 0, max: 360 }, animation: { enable: true, speed: 1 } }
        }
      }
    ]
  },
  aurora: {
    background: { color: { value: 'transparent' } },
    particles: {
      number: { value: 18 },
      color: { value: ['#c084fc', '#60a5fa', '#34d399'] },
      shape: { type: 'circle' },
      opacity: { value: { min: 0.25, max: 0.55 } },
      size: { value: { min: 140, max: 280 } },
      move: { enable: true, speed: 0.8, direction: 'none', random: true, outModes: 'out' },
    },
  },
  sunset: {
    background: { color: { value: 'transparent' } },
    particles: {
      number: { value: 45 },
      color: { value: ['#fbbf24', '#f87171', '#f472b6'] },
      shape: { type: 'circle' },
      opacity: {
        value: { min: 0.2, max: 0.8 },
        animation: { enable: true, speed: 0.8, sync: false }
      },
      size: { value: { min: 3, max: 8 } },
      move: { enable: true, speed: 1.2, direction: 'top-right', outModes: 'out' },
      wobble: { enable: true, distance: 8, speed: 3 }
    },
    emitters: [
      {
        direction: 'top-right',
        rate: { quantity: 1, delay: 9 },
        size: { width: 0, height: 80, mode: 'percent' },
        position: { x: -5, y: 60 },
        particles: {
          shape: {
            type: 'image',
            options: {
              image: [
                { src: '/themes/sunset/bird.svg', width: 64, height: 64 }
              ]
            }
          },
          size: { value: { min: 14, max: 28 } },
          opacity: { value: { min: 0.35, max: 0.65 } },
          move: { enable: true, speed: 1.8, direction: 'top-right', straight: true, outModes: 'out' }
        }
      },
      {
        direction: 'top-right',
        rate: { quantity: 1, delay: 8 },
        size: { width: 0, height: 80, mode: 'percent' },
        position: { x: -5, y: 70 },
        particles: {
          shape: {
            type: 'image',
            options: {
              image: [
                { src: '/themes/sunset/Sunset3DRender.svg', width: 100, height: 100 },
                { src: '/themes/sunset/SunsetFlatIcon.svg', width: 100, height: 100 }
              ]
            }
          },
          size: { value: { min: 22, max: 38 } },
          opacity: { value: { min: 0.45, max: 0.8 } },
          move: { enable: true, speed: 1.0, direction: 'top-right', outModes: 'out' },
          wobble: { enable: true, distance: 10, speed: 3 },
          rotate: { value: { min: 0, max: 360 }, animation: { enable: true, speed: 2 } }
        }
      }
    ]
  }
};

export function ThemeEffects() {
  const [init, setInit] = useState(false);
  const { activeTheme: theme } = useTheme();
  const isDark = useThemeStore((s) => s.isDark);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadFull(engine);
    }).then(() => setInit(true));
  }, []);

  if (!init || !theme || !themeConfigs[theme]) return null;

  const baseConfig = themeConfigs[theme];
  const colors = themeColors[theme]?.[isDark ? 'dark' : 'light'] || ['#ffffff'];

  const options: ISourceOptions = {
    ...baseConfig,
    particles: {
      ...baseConfig.particles,
      color: {
        value: colors,
      },
      shadow: baseConfig.particles?.shadow ? {
        ...baseConfig.particles.shadow,
        color: colors[0],
      } : undefined,
    },
  };

  return (
    <div
      className={`fixed inset-0 pointer-events-none ${theme === 'aurora' ? 'z-[-1]' : 'z-[50]'}`}
      style={{ 
        filter: theme === 'aurora' ? 'blur(80px)' : (theme === 'cyberpunk' && !isDark ? 'invert(1)' : 'none'),
        mixBlendMode: theme === 'cyberpunk' ? (isDark ? 'screen' : 'multiply') : 'normal'
      }}
    >
      <Particles
        id="tsparticles-theme"
        options={{
          ...options,
          fullScreen: { enable: false },
        }}
        className="w-full h-full"
      />
      {theme === 'aurora' && (
        <div className="aurora-bg">
          <div className="aurora-wave aurora-wave-1" />
          <div className="aurora-wave aurora-wave-2" />
          <div className="aurora-wave aurora-wave-3" />
        </div>
      )}

      {theme === 'sakura' && (
        <div className="absolute bottom-0 left-0 right-0 h-28 flex justify-around items-end overflow-hidden opacity-90 select-none">
          <img src="/themes/sakura/SakuraTreeRealistic.svg" className="h-32 w-auto object-contain transform translate-y-3" alt="" />
          <img src="/themes/sakura/SakuraTreeRealistic.svg" className="h-28 w-auto object-contain transform translate-y-2 hidden sm:block" alt="" />
          <img src="/themes/sakura/SakuraTreeRealistic.svg" className="h-32 w-auto object-contain transform translate-y-3" alt="" />
        </div>
      )}
    </div>
  );
}
