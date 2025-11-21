import { Coefficients, AnalysisResult } from '../types';

// We declare math as any because it's loaded from CDN
declare const math: any;

export const analyzeSurface = (coeffs: Coefficients): AnalysisResult => {
  const { a11, a22, a33, a12, a23, a13, b1, b2, b3, c } = coeffs;

  // 1. Construct Matrix A and Vector B
  // Based on equation: a11x^2 + ... + 2a12xy + ...
  // The matrix entry Aij for term 2*Aij*xi*xj is just Aij.
  const A = [
    [a11, a12, a13],
    [a12, a22, a23],
    [a13, a23, a33],
  ];
  const B = [b1, b2, b3];

  // 2. Eigen Decomposition of A
  // Returns eigenvalues and eigenvectors
  const ans = math.eigs(A);
  
  // Helper to safely convert MathJS output to array
  const getArray = (input: any) => {
      if (!input) return [];
      // If it's a mathjs Matrix, it has toArray
      if (typeof input.toArray === 'function') {
          return input.toArray();
      }
      // If it's already an array
      if (Array.isArray(input)) {
          return input;
      }
      return [];
  };
  
  const rawVal = math.flatten(ans.values);
  // Ensure we extract Real part of eigenvalues in case of tiny numerical imaginary noise
  // math.re() handles both numbers and Complex objects.
  let eigenvalues = getArray(rawVal).map((v: any) => math.re(v)) as number[];
  
  // ans.vectors is the matrix of eigenvectors (columns)
  let vectors = getArray(math.matrix(ans.vectors)); 

  // Sort eigenvalues in descending order to keep standard form nice
  // We map them to eigenvectors (columns of vectors matrix)
  const eigPairs = eigenvalues.map((val, idx) => ({
    val,
    vec: [
        math.re(vectors[0][idx]), 
        math.re(vectors[1][idx]), 
        math.re(vectors[2][idx])
    ]
  }));
  
  eigPairs.sort((a, b) => b.val - a.val);

  // Reconstruct sorted lists
  eigenvalues = eigPairs.map(p => p.val);
  let M = [
    [eigPairs[0].vec[0], eigPairs[1].vec[0], eigPairs[2].vec[0]],
    [eigPairs[0].vec[1], eigPairs[1].vec[1], eigPairs[2].vec[1]],
    [eigPairs[0].vec[2], eigPairs[1].vec[2], eigPairs[2].vec[2]]
  ];

  // Ensure M is in SO(3) -> det(M) = 1
  let detM = math.det(M);
  if (detM < 0) {
    // Flip the last eigenvector (corresponding to smallest eigenvalue usually) to preserve right-handed system
    M[0][2] *= -1;
    M[1][2] *= -1;
    M[2][2] *= -1;
  }

  // 3. Calculate Translation Vector tau
  // Let X = M(X' + S) where S is shift in new coords.
  // Or X = M X' + tau => tau = M * S.
  // B_tilde = M^T * B.
  
  const MT = math.transpose(M);
  const B_tilde = math.multiply(MT, B) as number[]; // Vector in rotated frame
  
  const S = [0, 0, 0];
  const epsilon = 1e-5;
  let c_prime = c;
  const linearVars: number[] = [];

  // Complete the square for each coordinate
  for (let i = 0; i < 3; i++) {
    const lambda = eigenvalues[i];
    const bi = B_tilde[i];

    if (Math.abs(lambda) > epsilon) {
      // Central case for this dimension
      // Shift S_i = -bi/lambda. 
      
      S[i] = -bi / lambda;
      c_prime -= (bi * bi) / lambda;
    } else {
      // Zero eigenvalue.
      if (Math.abs(bi) > epsilon) {
        // Parabolic case.
        // S[i] such that constant vanishes.
        S[i] = -c_prime / (2 * bi);
        c_prime = 0;
        linearVars.push(i);
      } else {
        // Cylinder axis, arbitrary shift. Keep 0.
        S[i] = 0;
      }
    }
  }

  // Calculate final tau in original coordinates
  const tau = math.multiply(M, S) as number[];

  // 4. Determine Surface Type and Standard Form
  const vars = ["x'", "y'", "z'"];
  const terms: string[] = [];
  
  // Quadratic parts
  eigenvalues.forEach((lam, i) => {
    if (Math.abs(lam) > epsilon) {
      const sign = lam < 0 ? "-" : (terms.length > 0 ? "+" : "");
      const val = Math.abs(lam);
      // Simplify 1.00
      const valStr = Math.abs(val - 1) < 1e-4 ? "" : val.toFixed(2);
      terms.push(`${sign} ${valStr}${vars[i]}^2`);
    }
  });

  // Linear parts (for parabolic)
  linearVars.forEach(idx => {
    // The coefficient is 2 * B_tilde[idx]
    const coef = 2 * B_tilde[idx];
    const sign = coef < 0 ? "-" : (terms.length > 0 ? "+" : "");
    const val = Math.abs(coef);
    terms.push(`${sign} ${val.toFixed(2)}${vars[idx]}`);
  });

  // Constant
  if (Math.abs(c_prime) > epsilon) {
     const sign = c_prime < 0 ? "-" : (terms.length > 0 ? "+" : "");
     terms.push(`${sign} ${Math.abs(c_prime).toFixed(2)}`);
  }

  let standardForm = terms.join(" ").trim() + " = 0";
  if (terms.length === 0) standardForm = "0 = 0";

  // Classification (Simplified)
  let surfaceType = "General Quadric";
  const rank = eigenvalues.filter(v => Math.abs(v) > epsilon).length;
  const sigPos = eigenvalues.filter(v => v > epsilon).length;
  const sigNeg = eigenvalues.filter(v => v < -epsilon).length;
  
  if (linearVars.length > 0) {
      if (rank === 2) surfaceType = "Paraboloid (Elliptic or Hyperbolic)";
      else if (rank === 1) surfaceType = "Parabolic Cylinder";
  } else {
      if (rank === 3) {
          if (Math.abs(c_prime) < epsilon) surfaceType = "Cone or Point";
          else if ((sigPos === 3 || sigNeg === 3) && c_prime * eigenvalues[0] < 0) surfaceType = "Ellipsoid";
          else if ((sigPos === 2 || sigNeg === 2)) surfaceType = c_prime * (sigPos===2?1:-1) < 0 ? "Hyperboloid 1-Sheet" : "Hyperboloid 2-Sheets"; 
      } else if (rank === 2) {
           if (Math.abs(c_prime) < epsilon) surfaceType = "Intersecting Planes";
           else surfaceType = (sigPos === 2 || sigNeg === 2) ? "Elliptic Cylinder" : "Hyperbolic Cylinder";
      } else if (rank === 1) {
           surfaceType = Math.abs(c_prime) < epsilon ? "Coincident Planes" : "Parallel Planes";
      }
  }

  return {
    eigenvalues,
    rotationMatrix: M,
    translationVector: tau,
    standardForm,
    centerType: linearVars.length > 0 ? 'None' : (rank === 3 ? 'Point' : 'Line'),
    surfaceType
  };
};