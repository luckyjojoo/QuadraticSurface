import { Theme, ThemeOption, Coefficients } from './types';

export const INITIAL_COEFFICIENTS: Coefficients = {
  a11: 1,
  a22: 1,
  a33: -1,
  a12: 0,
  a23: 0,
  a13: 0,
  b1: 0,
  b2: 0,
  b3: 0,
  c: -1,
};

export const THEMES: Record<ThemeOption, Theme> = {
  indigo: {
    name: 'indigo',
    primary: 'text-indigo-600',
    secondary: 'text-indigo-400',
    accent: 'border-indigo-500',
    bg: 'bg-slate-50',
    panel: 'bg-white/80 backdrop-blur-md border-slate-200',
    text: 'text-slate-800',
    inputBorder: 'focus:ring-indigo-500',
    button: 'bg-indigo-600 hover:bg-indigo-700',
    groupA: 'bg-blue-500',
    groupB: 'bg-indigo-400',
    groupC: 'bg-slate-500'
  },
  emerald: {
    name: 'emerald',
    primary: 'text-emerald-600',
    secondary: 'text-emerald-400',
    accent: 'border-emerald-500',
    bg: 'bg-green-50',
    panel: 'bg-white/80 backdrop-blur-md border-emerald-100',
    text: 'text-emerald-900',
    inputBorder: 'focus:ring-emerald-500',
    button: 'bg-emerald-600 hover:bg-emerald-700',
    groupA: 'bg-emerald-500',
    groupB: 'bg-teal-400',
    groupC: 'bg-green-600'
  },
  rose: {
    name: 'rose',
    primary: 'text-rose-600',
    secondary: 'text-rose-400',
    accent: 'border-rose-500',
    bg: 'bg-rose-50',
    panel: 'bg-white/80 backdrop-blur-md border-rose-100',
    text: 'text-rose-900',
    inputBorder: 'focus:ring-rose-500',
    button: 'bg-rose-600 hover:bg-rose-700',
    groupA: 'bg-rose-500',
    groupB: 'bg-pink-400',
    groupC: 'bg-red-400'
  },
  amber: {
    name: 'amber',
    primary: 'text-amber-600',
    secondary: 'text-amber-500',
    accent: 'border-amber-500',
    bg: 'bg-amber-50',
    panel: 'bg-white/80 backdrop-blur-md border-amber-100',
    text: 'text-amber-900',
    inputBorder: 'focus:ring-amber-500',
    button: 'bg-amber-600 hover:bg-amber-700',
    groupA: 'bg-amber-500',
    groupB: 'bg-orange-400',
    groupC: 'bg-yellow-500'
  },
};