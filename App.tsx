import React, { useState, useEffect } from 'react';
import { Coefficients, ThemeOption, AnalysisResult } from './types.ts';
import { INITIAL_COEFFICIENTS, THEMES } from './constants.ts';
import { analyzeSurface } from './services/mathService.ts';
import CoefficientInput from './components/CoefficientInput.tsx';
import SurfaceVisualizer from './components/SurfaceVisualizer.tsx';
import ResultPanel from './components/ResultPanel.tsx';
import { Box, Palette, Info } from 'lucide-react';

function App() {
  const [coeffs, setCoeffs] = useState<Coefficients>(INITIAL_COEFFICIENTS);
  const [themeOption, setThemeOption] = useState<ThemeOption>('indigo');
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const currentTheme = THEMES[themeOption];

  const handleCoeffChange = (key: keyof Coefficients, value: number) => {
    setCoeffs(prev => ({ ...prev, [key]: value }));
  };

  // Debounce analysis to prevent flickering on rapid input
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if ((window as any).math) {
            const res = analyzeSurface(coeffs);
            setResult(res);
        }
      } catch (error) {
        console.error("Analysis failed:", error);
      }
    }, 100); // Faster response
    return () => clearTimeout(timer);
  }, [coeffs]);

  return (
    <div className={`min-h-screen ${currentTheme.bg} transition-colors duration-500 pb-20 font-sans text-slate-800`}>
      
      {/* Header */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200 shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className={`p-2 rounded-lg ${currentTheme.button} text-white shadow-lg shadow-${themeOption}-500/30 transition-colors duration-300`}>
                <Box className="w-6 h-6" />
             </div>
             <div>
                <h1 className={`text-lg sm:text-xl font-bold tracking-tight ${currentTheme.text}`}>
                    Quadric Surface Analyzer
                </h1>
                <p className="text-[10px] text-slate-500 font-medium hidden sm:block">3D Visualization & Canonical Forms</p>
             </div>
          </div>

          {/* Theme Switcher */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:block">Color Style</span>
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-full border border-slate-200 shadow-inner">
                {(Object.keys(THEMES) as ThemeOption[]).map((t) => (
                <button
                    key={t}
                    onClick={() => setThemeOption(t)}
                    className={`w-8 h-8 rounded-full transition-all duration-300 border-[3px] flex items-center justify-center ${
                    themeOption === t 
                        ? 'border-white shadow-md scale-110' 
                        : 'border-transparent hover:scale-110 opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: t === 'indigo' ? '#6366f1' : t === 'emerald' ? '#10b981' : t === 'rose' ? '#f43f5e' : '#f59e0b' }}
                    aria-label={`Select ${t} theme`}
                    title={`${t.charAt(0).toUpperCase() + t.slice(1)} Style`}
                >
                    {themeOption === t && <div className="w-2 h-2 bg-white rounded-full" />}
                </button>
                ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Section: Inputs */}
        <section>
            <CoefficientInput coeffs={coeffs} onChange={handleCoeffChange} theme={currentTheme} />
        </section>

        {/* Middle Section: Visualization */}
        <section className="grid grid-cols-1 lg:grid-cols-1 gap-8">
             <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className={`text-xl font-bold ${currentTheme.text} flex items-center gap-2`}>
                        <span>3D Visualization</span>
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                        <Info className="w-3 h-3" />
                        <span>Scroll to zoom • Drag to rotate</span>
                    </div>
                </div>
                <SurfaceVisualizer coeffs={coeffs} theme={currentTheme} />
             </div>
        </section>
        
        {/* Bottom Section: Results */}
        <section>
            {result ? (
                <ResultPanel result={result} theme={currentTheme} />
            ) : (
                <div className="h-32 flex items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    Processing geometry...
                </div>
            )}
        </section>

      </main>
    </div>
  );
}

export default App;