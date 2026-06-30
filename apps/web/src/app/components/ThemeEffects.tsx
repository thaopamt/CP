import { useEffect, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadFull } from 'tsparticles';
import type { ISourceOptions } from '@tsparticles/engine';
import { useCurrentStudent } from '../api/student.queries';

// Define configurations for each theme
const themeConfigs: Record<string, ISourceOptions> = {
  galaxy: {
    background: { color: { value: 'transparent' } },
    particles: {
      number: { value: 150, density: { enable: true } },
      color: { value: '#ffffff' },
      shape: { type: 'circle' },
      opacity: {
        value: { min: 0.1, max: 1 },
        animation: { enable: true, speed: 1, sync: false },
      },
      size: { value: { min: 1, max: 3 } },
      move: { enable: true, speed: 0.2, direction: 'none', outModes: 'out' },
    },
  },
  hacker: {
    background: { color: { value: 'transparent' } },
    particles: {
      number: { value: 80, density: { enable: true } },
      color: { value: '#22c55e' },
      shape: { 
        type: 'char', 
        character: { value: ['0', '1', 'A', 'Z', '$', '{', '}'], font: 'monospace', weight: 'bold' } 
      },
      opacity: { value: 0.8 },
      size: { value: 16 },
      move: { enable: true, speed: 3, direction: 'bottom', outModes: 'out', straight: true },
    },
  },
  ocean: {
    background: { color: { value: 'transparent' } },
    particles: {
      number: { value: 50 },
      color: { value: '#ffffff' },
      shape: { type: 'circle' },
      opacity: { value: 0.3 },
      size: { value: { min: 4, max: 15 } },
      move: { enable: true, speed: 2, direction: 'top', outModes: 'out', straight: true },
    },
  },
  forest: {
    background: { color: { value: 'transparent' } },
    particles: {
      number: { value: 60 },
      color: { value: ['#a3e635', '#4ade80'] }, // fireflies colors
      shape: { type: 'circle' },
      opacity: { 
        value: { min: 0.3, max: 0.8 }, 
        animation: { enable: true, speed: 1.5, sync: false } 
      },
      size: { value: { min: 2, max: 5 } },
      move: { enable: true, speed: 1, direction: 'none', random: true, outModes: 'out' },
    },
  },
  snow: {
    background: { color: { value: 'transparent' } },
    particles: {
      number: { value: 100 },
      color: { value: '#ffffff' },
      shape: { type: 'circle' },
      opacity: { value: 0.5 },
      size: { value: { min: 2, max: 5 } },
      move: { enable: true, speed: 2, direction: 'bottom', straight: false, random: false, outModes: 'out' },
      wobble: { enable: true, distance: 10, speed: 10 }
    },
  },
  sakura: {
    background: { color: { value: 'transparent' } },
    particles: {
      number: { value: 50 },
      color: { value: ['#fbcfe8', '#f472b6', '#ffffff'] },
      shape: { type: ['circle', 'polygon'] },
      opacity: { value: 0.8 },
      size: { value: { min: 4, max: 10 } },
      move: { enable: true, speed: 2, direction: 'bottom-right', outModes: 'out' },
      rotate: { value: { min: 0, max: 360 }, animation: { enable: true, speed: 5 } }
    },
  },
  volcano: {
    background: { color: { value: 'transparent' } },
    particles: {
      number: { value: 80 },
      color: { value: ['#ef4444', '#f97316', '#fbbf24'] },
      shape: { type: 'circle' },
      opacity: { value: { min: 0.5, max: 1 }, animation: { enable: true, speed: 3 } },
      size: { value: { min: 1, max: 4 } },
      move: { enable: true, speed: 4, direction: 'top', random: true, outModes: 'out' },
    },
  },
  party: {
    background: { color: { value: 'transparent' } },
    particles: {
      number: { value: 80 },
      color: { value: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'] },
      shape: { type: ['square', 'circle', 'polygon'] },
      opacity: { value: 1 },
      size: { value: { min: 5, max: 10 } },
      move: { enable: true, speed: 3, direction: 'bottom', outModes: 'out' },
      rotate: { value: { min: 0, max: 360 }, animation: { enable: true, speed: 15 } }
    },
  },
  cyberpunk: {
    background: { color: { value: 'transparent' } },
    particles: {
      number: { value: 40 },
      color: { value: ['#f472b6', '#22d3ee', '#fde047'] }, // neon pink, cyan, yellow
      shape: { type: ['triangle', 'polygon'] },
      opacity: { value: 0.6 },
      size: { value: { min: 10, max: 20 } },
      move: { enable: true, speed: 4, direction: 'none', outModes: 'out' },
    },
  },
  aurora: {
    background: { color: { value: 'transparent' } },
    particles: {
      number: { value: 15 },
      color: { value: ['#8b5cf6', '#3b82f6', '#10b981'] },
      shape: { type: 'circle' },
      opacity: { value: 0.4 },
      size: { value: { min: 100, max: 250 } }, // large orbs to be blurred
      move: { enable: true, speed: 1.5, direction: 'none', random: true, outModes: 'out' },
    },
  },
  sunset: {
    background: { color: { value: 'transparent' } },
    particles: {
      number: { value: 40 },
      color: { value: ['#fbbf24', '#f87171', '#f472b6'] },
      shape: { type: 'circle' },
      opacity: { value: 0.5 },
      size: { value: { min: 5, max: 15 } },
      move: { enable: true, speed: 1, direction: 'top-right', outModes: 'out' },
    },
  }
};

export function ThemeEffects() {
  const [init, setInit] = useState(false);
  const { data: student } = useCurrentStudent();
  const theme = student?.equippedTheme;

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      // Load all particle shapes, updaters, and presets
      await loadFull(engine);
    }).then(() => setInit(true));
  }, []);

  if (!init || !theme || !themeConfigs[theme]) return null;

  return (
    <div 
      className="fixed inset-0 z-[-1] pointer-events-none" 
      style={{ filter: theme === 'aurora' ? 'blur(60px)' : 'none' }}
    >
      <Particles 
        id="tsparticles-theme" 
        options={{
          ...themeConfigs[theme],
          fullScreen: { enable: false },
        }} 
        className="w-full h-full" 
      />
    </div>
  );
}
