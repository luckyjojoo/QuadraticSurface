import React, { useEffect, useRef, useState } from 'react';
import { Coefficients, Theme } from '../types.ts';

// Declare Plotly from global window
declare const Plotly: any;

interface Props {
  coeffs: Coefficients;
  theme: Theme;
}

const SurfaceVisualizer: React.FC<Props> = ({ coeffs, theme }) => {
  const plotDivRef = useRef<HTMLDivElement>(null);
  const [isGraphLoaded, setIsGraphLoaded] = useState(false);

  useEffect(() => {
    if (!plotDivRef.current || typeof Plotly === 'undefined') return;

    const { a11, a22, a33, a12, a23, a13, b1, b2, b3, c } = coeffs;

    // Define grid
    const range = 10;
    const step = 0.4; // Resolution
    const x: number[] = [];
    const y: number[] = [];
    const z: number[] = [];
    const values: number[] = [];

    const axis = [];
    for (let i = -range; i <= range; i += step) {
      axis.push(i);
    }

    // Generate volumetric data
    for (let k = 0; k < axis.length; k++) {
        for (let j = 0; j < axis.length; j++) {
            for (let i = 0; i < axis.length; i++) {
                const xi = axis[i];
                const yi = axis[j];
                const zi = axis[k];

                x.push(xi);
                y.push(yi);
                z.push(zi);

                // F(x,y,z) = a11 x^2 + ... + a12 xy + ... + b1 x + ... + c
                const val = 
                    a11 * xi * xi + 
                    a22 * yi * yi + 
                    a33 * zi * zi + 
                    a12 * xi * yi + 
                    a23 * yi * zi + 
                    a13 * xi * zi + 
                    b1 * xi + 
                    b2 * yi + 
                    b3 * zi + 
                    c;
                
                values.push(val);
            }
        }
    }

    const data = [{
        type: 'isosurface',
        x: x,
        y: y,
        z: z,
        value: values,
        isomin: -0.5,
        isomax: 0.5,
        surface: { show: true, count: 1, fill: 0.8 },
        caps: { x: { show: false }, y: { show: false }, z: { show: false } }, // Hide caps for open surfaces
        colorscale: 'Viridis', 
        showscale: false,
        lighting: {
            ambient: 0.6,
            diffuse: 0.8,
            specular: 0.2,
            roughness: 0.5,
            fresnel: 0.5
        }
    }];

    const layout = {
        margin: { t: 0, b: 0, l: 0, r: 0 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        scene: {
            xaxis: { title: 'X', showgrid: true, zeroline: true, showline: true, color: '#94a3b8' },
            yaxis: { title: 'Y', showgrid: true, zeroline: true, showline: true, color: '#94a3b8' },
            zaxis: { title: 'Z', showgrid: true, zeroline: true, showline: true, color: '#94a3b8' },
            camera: {
                eye: { x: 1.5, y: 1.5, z: 1.5 }
            },
            aspectratio: { x: 1, y: 1, z: 1 }
        },
        autosize: true
    };

    const config = { responsive: true, displayModeBar: false };

    Plotly.newPlot(plotDivRef.current, data, layout, config).then(() => {
        setIsGraphLoaded(true);
    });

    return () => {
      if (plotDivRef.current) {
        Plotly.purge(plotDivRef.current);
      }
    };

  }, [coeffs]);

  return (
    <div className={`relative w-full h-[500px] rounded-xl shadow-xl overflow-hidden border ${theme.panel} ${theme.accent}`}>
        <div ref={plotDivRef} className="w-full h-full" />
        {!isGraphLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50/50 z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        )}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-md shadow-sm text-xs font-medium text-slate-600 pointer-events-none">
            Interactive 3D View
        </div>
    </div>
  );
};

export default SurfaceVisualizer;