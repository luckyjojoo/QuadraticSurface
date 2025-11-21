export interface Coefficients {
  a11: number;
  a22: number;
  a33: number;
  a12: number;
  a23: number;
  a13: number;
  b1: number;
  b2: number;
  b3: number;
  c: number;
}

export type ThemeOption = 'indigo' | 'emerald' | 'rose' | 'amber';

export interface Theme {
  name: ThemeOption;
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  panel: string;
  text: string;
  inputBorder: string;
  button: string;
  groupA: string; // Color for Quadratic terms
  groupB: string; // Color for Linear terms
  groupC: string; // Color for Constant term
}

export interface AnalysisResult {
  eigenvalues: number[];
  rotationMatrix: number[][]; // 3x3
  translationVector: number[]; // 3x1
  standardForm: string;
  centerType: 'Point' | 'Line' | 'Plane' | 'None' | 'Unknown';
  surfaceType: string;
}