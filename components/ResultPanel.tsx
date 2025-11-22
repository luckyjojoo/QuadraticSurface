import React from 'react';
import { AnalysisResult, Theme } from '../types.ts';
import { Calculator, Move, Rotate3d, Grid3X3, Sigma } from 'lucide-react';

interface Props {
  result: AnalysisResult;
  theme: Theme;
}

// GCD Helper
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

// Smart formatting utility
const formatSmart = (val: number): string => {
  const ABS_TOLERANCE = 1e-5;
  
  // Handle Zero
  if (Math.abs(val) < ABS_TOLERANCE) return "0";

  const sign = val < 0 ? "-" : "";
  const absVal = Math.abs(val);

  // 1. Check Integer
  if (Math.abs(absVal - Math.round(absVal)) < ABS_TOLERANCE) {
    return sign + Math.round(absVal).toString();
  }

  // 2. Check Rational Fraction (e.g. 0.5 -> 1/2, 0.666 -> 2/3)
  // Limit denominator to 50 for reasonable display
  for (let q = 2; q <= 50; q++) {
      const p = absVal * q;
      if (Math.abs(p - Math.round(p)) < ABS_TOLERANCE) {
          const pInt = Math.round(p);
          // Simplify
          const common = gcd(pInt, q);
          return `${sign}${pInt/common}/${q/common}`; 
      }
  }

  // 3. Check Square Root of Rational (covers sqrt(n), 1/sqrt(n), sqrt(a)/b, k/sqrt(n) etc)
  // Logic: If x = sqrt(p/q), then x^2 = p/q.
  const sq = absVal * absVal;
  
  for (let q = 1; q <= 100; q++) {
      const p = sq * q;
      // Check if sq*q is an integer
      if (Math.abs(p - Math.round(p)) < ABS_TOLERANCE) {
          const pInt = Math.round(p);
          
          // fraction is pInt / q
          // Simplify fraction first: x^2 = num/den
          const common = gcd(pInt, q);
          const num = pInt / common;
          const den = q / common;

          // We have val = sqrt(num) / sqrt(den)
          
          // Simplification helper: factor out squares from radical
          // e.g. 8 -> coeff: 2, rad: 2 (2*sqrt(2))
          const simplifyRoot = (n: number) => {
              for (let i = Math.floor(Math.sqrt(n)); i >= 1; i--) {
                  if (n % (i*i) === 0) {
                      return { coeff: i, rad: n / (i*i) };
                  }
              }
              return { coeff: 1, rad: n };
          };

          const sNum = simplifyRoot(num);
          const sDen = simplifyRoot(den);

          // Construct Numerator String
          let numStr = "";
          if (sNum.rad === 1) {
              numStr = sNum.coeff.toString();
          } else {
              if (sNum.coeff === 1) numStr = `√${sNum.rad}`;
              else numStr = `${sNum.coeff}√${sNum.rad}`;
          }

          // Construct Denominator String
          let denStr = "";
          if (sDen.rad === 1) {
              if (sDen.coeff === 1) {
                  // Denom is 1
                  return `${sign}${numStr}`;
              }
              denStr = sDen.coeff.toString();
          } else {
               if (sDen.coeff === 1) denStr = `√${sDen.rad}`;
               else denStr = `${sDen.coeff}√${sDen.rad}`;
          }

          return `${sign}${numStr}/${denStr}`;
      }
  }

  // Fallback to decimal
  return val.toFixed(4);
};

const MatrixDisplay = ({ matrix, label, theme }: { matrix: number[][], label: string, theme: Theme }) => (
  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <div className={`px-3 py-2 text-xs font-bold uppercase tracking-wider border-b border-slate-100 ${theme.secondary} bg-slate-50`}>
      {label}
    </div>
    <div className="p-3 overflow-x-auto">
      <div className="grid grid-cols-3 gap-px bg-slate-200 border border-slate-200 rounded">
        {matrix.map((row, i) => (
          <React.Fragment key={i}>
            {row.map((val, j) => (
              <div key={`${i}-${j}`} className="bg-white py-2 px-1 text-center font-mono text-sm text-slate-700 flex items-center justify-center">
                {formatSmart(val)}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  </div>
);

const VectorDisplay = ({ vector, label, theme }: { vector: number[], label: string, theme: Theme }) => (
  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm h-full">
    <div className={`px-3 py-2 text-xs font-bold uppercase tracking-wider border-b border-slate-100 ${theme.secondary} bg-slate-50`}>
      {label}
    </div>
    <div className="p-3 flex flex-col gap-1 h-[calc(100%-36px)] justify-center">
      {vector.map((val, i) => (
        <div key={i} className="bg-slate-50 border border-slate-200 rounded py-2 px-3 text-center font-mono text-sm text-slate-700">
          {formatSmart(val)}
        </div>
      ))}
    </div>
  </div>
);

const ResultPanel: React.FC<Props> = ({ result, theme }) => {
  return (
    <div className={`p-6 rounded-xl shadow-xl border ${theme.panel} ${theme.accent} space-y-8 bg-white/90`}>
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h2 className={`text-xl font-bold ${theme.text} flex items-center gap-2`}>
          <Calculator className="w-6 h-6" />
          <span>Analytical Solution</span>
        </h2>
        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm border ${theme.accent} ${theme.primary} bg-white`}>
            {result.surfaceType}
        </span>
      </div>

      {/* Standard Form */}
      <div className={`relative overflow-hidden rounded-xl p-6 text-center border ${theme.accent} bg-gradient-to-br from-white to-slate-50`}>
        <div className="absolute top-0 left-0 p-2 opacity-10">
            <Sigma className={`w-16 h-16 ${theme.primary}`} />
        </div>
        <h3 className={`text-xs font-bold ${theme.secondary} uppercase tracking-widest mb-3`}>Standard Canonical Form</h3>
        <div className={`text-2xl sm:text-3xl font-serif italic ${theme.primary} leading-relaxed`}>
           {result.standardForm}
        </div>
        <p className="text-xs text-slate-400 mt-3 font-mono">
            Coordinate System (x', y', z')
        </p>
      </div>

      {/* Transformation Params */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Rotation Matrix */}
        <div className="md:col-span-2 space-y-2">
            <div className="flex items-center gap-2 mb-1">
                <Rotate3d className={`w-4 h-4 ${theme.secondary}`} />
                <h3 className={`text-sm font-semibold ${theme.text}`}>Rotation Matrix M ∈ SO(3)</h3>
            </div>
            <MatrixDisplay matrix={result.rotationMatrix} label="M (Eigenvectors)" theme={theme} />
            <p className="text-[10px] text-slate-400 pl-1">
                Columns are normalized eigenvectors of A.
            </p>
        </div>

        {/* Translation Vector */}
        <div className="space-y-2">
            <div className="flex items-center gap-2 mb-1">
                <Move className={`w-4 h-4 ${theme.secondary}`} />
                <h3 className={`text-sm font-semibold ${theme.text}`}>Translation τ</h3>
            </div>
            <VectorDisplay vector={result.translationVector} label="τ Vector" theme={theme} />
             <p className="text-[10px] text-slate-400 pl-1">
                Center/Vertex offset in original coords.
            </p>
        </div>
      </div>
      
      {/* Equation Logic Hint */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-xs text-slate-600 font-mono space-y-1">
         <div className="font-bold text-slate-700 border-b border-slate-200 pb-1 mb-2">Transformation Logic</div>
         <p>1. X = M · X' + τ</p>
         <p>2. X' = Mᵀ · (X - τ)</p>
         <p>3. A_diagonal = diag(λ₁, λ₂, λ₃)</p>
      </div>

      {/* Eigenvalues */}
      <div>
        <h3 className={`text-xs font-bold ${theme.secondary} uppercase mb-3 flex items-center gap-2`}>
            <Grid3X3 className="w-4 h-4" />
            Eigenvalues (λ) of Matrix A
        </h3>
        <div className="flex flex-wrap gap-4">
            {result.eigenvalues.map((lambda, idx) => (
                <div key={idx} className="flex-1 min-w-[100px] text-center p-3 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-[10px] text-slate-400 font-mono mb-1 uppercase">Lambda {idx+1}</div>
                    <div className={`text-lg font-bold ${theme.primary} font-mono`}>{formatSmart(lambda)}</div>
                </div>
            ))}
        </div>
      </div>

    </div>
  );
};

export default ResultPanel;