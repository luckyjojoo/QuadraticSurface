import React, { useState, useEffect } from 'react';
import { Coefficients, Theme } from '../types.ts';

interface Props {
  coeffs: Coefficients;
  onChange: (key: keyof Coefficients, value: number) => void;
  theme: Theme;
}

// Helper component to handle intermediate states (like "-", "1.", empty)
const NumberInput: React.FC<{
  value: number;
  onChange: (val: number) => void;
  className?: string;
  borderColor: string;
}> = ({ value, onChange, className, borderColor }) => {
  const [localValue, setLocalValue] = useState(value.toString());

  // Sync with parent value if it changes externally
  useEffect(() => {
    const parsedLocal = parseFloat(localValue);
    // Only sync if the numeric values differ, preventing overwrite of "1." or "-0"
    if (parsedLocal !== value && !isNaN(value)) {
        setLocalValue(value.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    setLocalValue(inputVal);

    const parsed = parseFloat(inputVal);
    if (!isNaN(parsed)) {
      onChange(parsed);
    } else if (inputVal === '') {
      onChange(0);
    }
    // If it's "-" or other intermediate partial number, we keep local state but don't push NaN
  };

  const handleBlur = () => {
    // On blur, if invalid, revert to known good value
    if (localValue === '-' || localValue === '' || isNaN(parseFloat(localValue))) {
       setLocalValue(value.toString());
       onChange(value);
    }
  };

  return (
    <input
      type="text" 
      //inputMode="numeric"
      pattern="-?[0-9]*[.,]?[0-9]*"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={`${className} border-l-4`}
      style={{ borderLeftColor: borderColor.replace('bg-', 'text-').replace('500', '500').replace('600', '600') }} 
    />
  );
};

const CoefficientInput: React.FC<Props> = ({ coeffs, onChange, theme }) => {
  
  const renderInput = (label: string, key: keyof Coefficients, groupColorClass: string) => {
    const borderColorClass = groupColorClass.replace('bg-', 'border-');

    return (
        <div className="flex flex-col">
        <label 
            className="text-xs font-semibold text-slate-500 mb-1.5 pl-1"
            dangerouslySetInnerHTML={{ __html: label }}
        />
        <NumberInput
            value={coeffs[key]}
            onChange={(val) => onChange(key, val)}
            borderColor="" // Handled via className construction below
            className={`
                w-full px-3 py-2 
                bg-white border border-slate-300
                ${borderColorClass} border-l-4 rounded-sm
                text-sm font-mono text-slate-700 shadow-sm
                focus:outline-none focus:ring-1 focus:border-transparent ${theme.inputBorder}
                transition-all duration-200
            `}
        />
        </div>
    );
  };

  // Construct the display equation string
  const generateEquation = () => {
    const terms: string[] = [];
    const { a11, a22, a33, a12, a23, a13, b1, b2, b3, c } = coeffs;

    // Multiplier defaults to 1 now for all terms as per request
    const addTerm = (val: number, suffix: string) => {
        if (Math.abs(val) < 1e-6) return;
        
        const sign = val < 0 ? " - " : (terms.length > 0 ? " + " : "");
        const absVal = Math.abs(val);
        // Hide '1' if there is a suffix (e.g. 1x^2 -> x^2), but show 0.5x^2
        const valStr = (Math.abs(absVal - 1) < 1e-6 && suffix !== "") ? "" : parseFloat(absVal.toFixed(3)).toString();
        
        terms.push(`${sign}${valStr}${suffix}`);
    };

    addTerm(a11, "x²");
    addTerm(a22, "y²");
    addTerm(a33, "z²");
    addTerm(a12, "xy");
    addTerm(a23, "yz");
    addTerm(a13, "xz");
    addTerm(b1, "x");
    addTerm(b2, "y");
    addTerm(b3, "z");
    addTerm(c, "");

    if (terms.length === 0) return "0 = 0";
    return terms.join("") + " = 0";
  };

  return (
    <div className={`p-6 rounded-xl shadow-lg border ${theme.panel} ${theme.accent}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-lg font-bold ${theme.text}`}>
            Equation Coefficients
        </h2>
      </div>

      {/* Formal Definition Header */}
      <div className="mb-6 p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
         <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">Reference Formula</p>
         <div className="text-sm sm:text-base font-serif text-slate-600 text-center leading-relaxed px-2">
            a<sub>11</sub>x² + a<sub>22</sub>y² + a<sub>33</sub>z² + 
            <span className="font-bold text-slate-800 bg-slate-100 px-1 rounded mx-0.5">a<sub>12</sub></span>xy + 
            <span className="font-bold text-slate-800 bg-slate-100 px-1 rounded mx-0.5">a<sub>23</sub></span>yz + 
            <span className="font-bold text-slate-800 bg-slate-100 px-1 rounded mx-0.5">a<sub>13</sub></span>xz + 
            b<sub>1</sub>x + b<sub>2</sub>y + b<sub>3</sub>z + c = 0
         </div>
      </div>

      {/* Live Equation Preview */}
      <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">Current Equation</p>
        <div className={`font-serif text-lg sm:text-xl italic leading-relaxed ${theme.primary}`}>
            {generateEquation()}
        </div>
      </div>
      
      <div className="space-y-8">
        {/* Group A: Quadratic Terms */}
        <div>
          <h3 className={`text-xs font-bold ${theme.text} mb-4 uppercase flex items-center gap-2 border-b border-slate-100 pb-2`}>
             <span className={`w-2 h-2 rounded-full ${theme.groupA}`}></span>
             Quadratic Terms
          </h3>
          <div className="grid grid-cols-3 gap-x-6 gap-y-6">
            {renderInput('a<sub>11</sub>', 'a11', theme.groupA)}
            {renderInput('a<sub>22</sub>', 'a22', theme.groupA)}
            {renderInput('a<sub>33</sub>', 'a33', theme.groupA)}
            {renderInput('a<sub>12</sub>', 'a12', theme.groupA)}
            {renderInput('a<sub>23</sub>', 'a23', theme.groupA)}
            {renderInput('a<sub>13</sub>', 'a13', theme.groupA)}
          </div>
        </div>

        {/* Group B: Linear Terms */}
        <div>
          <h3 className={`text-xs font-bold ${theme.text} mb-4 uppercase flex items-center gap-2 border-b border-slate-100 pb-2`}>
            <span className={`w-2 h-2 rounded-full ${theme.groupB}`}></span>
            Linear Terms
          </h3>
          <div className="grid grid-cols-3 gap-x-6 gap-y-6">
            {renderInput('b<sub>1</sub>', 'b1', theme.groupB)}
            {renderInput('b<sub>2</sub>', 'b2', theme.groupB)}
            {renderInput('b<sub>3</sub>', 'b3', theme.groupB)}
          </div>
        </div>

        {/* Group C: Constant */}
        <div>
          <h3 className={`text-xs font-bold ${theme.text} mb-4 uppercase flex items-center gap-2 border-b border-slate-100 pb-2`}>
            <span className={`w-2 h-2 rounded-full ${theme.groupC}`}></span>
            Constant Term
          </h3>
          <div className="grid grid-cols-3 gap-x-6 gap-y-6">
             {renderInput('c', 'c', theme.groupC)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoefficientInput;
