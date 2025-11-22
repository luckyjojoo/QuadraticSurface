import { Coefficients, AnalysisResult } from '../types.ts';

// We declare math as any because it's loaded from CDN
declare const math: any;

export const analyzeSurface = (coeffs: Coefficients): AnalysisResult => {
  const { a11, a22, a33, a12, a23, a13, b1, b2, b3, c } = coeffs;

  // 1. Construct Matrix A and Vector B
  // Equation: a11*x^2 + ... + a12*xy + ... + b1*x + ...
  // Matrix form: X^T A X + J^T X + c = 0
  
  // Diagonal entries are a11, a22, a33
  // Off-diagonal entries correspond to cross terms.
  // In X^T A X, the term is (A_ij + A_ji) * xi * xj.
  // We want (A_ij + A_ji) = a_ij. Since A is symmetric, A_ij = a_ij / 2.
  const A = [
    [a11, a12 / 2, a13 / 2],
    [a12 / 2, a22, a23 / 2],
    [a13 / 2, a23 / 2, a33],
  ];
  
  // Linear coefficients vector J
  const J = [b1, b2, b3];

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
  let eigenvalues = getArray(rawVal).map((v: any) => math.re(v)) as number[];
  
  // ans.vectors is the matrix of eigenvectors (columns)
  let vectors = getArray(math.matrix(ans.vectors)); 

  // Sort eigenvalues in descending order to keep standard form nice
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
    // Flip the last eigenvector to preserve right-handed system
    M[0][2] *= -1;
    M[1][2] *= -1;
    M[2][2] *= -1;
  }

  // 3. Calculate Translation Vector tau
  // Coordinate transform: X = M(X' + S)  => X = M*X' + M*S => tau = M*S
  // Substitute into eq: X^T A X + J^T X + c = 0
  // Becomes: X'^T (M^T A M) X' + (2 S^T M^T A M + J^T M) X' + (S^T M^T A M S + J^T M S + c) = 0
  // Let Lambda = M^T A M (diagonal eigenvalues)
  // Let J' = M^T J (rotated linear coefficients)
  // Linear term coefficient in X' is: 2 * Lambda * S + J'
  // To remove linear term (complete square), we need 2 * lambda_i * s_i + j'_i = 0
  // => s_i = - j'_i / (2 * lambda_i)

  const MT = math.transpose(M);
  const J_prime = math.multiply(MT, J) as number[]; // Vector in rotated frame
  
  const S = [0, 0, 0];
  const epsilon = 1e-5;
  let c_prime = c;
  const linearVars: number[] = [];

  // Complete the square for each coordinate
  for (let i = 0; i < 3; i++) {
    const lambda = eigenvalues[i];
    const ji = J_prime[i];

    if (Math.abs(lambda) > epsilon) {
      // Central case for this dimension
      // Shift S_i = -ji / (2 * lambda)
      const s_i = -ji / (2 * lambda);
      S[i] = s_i;
      
      // The constant term changes by: lambda * s^2 + ji * s
      // = lambda * (-j/2L)^2 + j * (-j/2L)
      // = j^2 / 4L - j^2 / 2L = -j^2 / 4L
      c_prime -= (ji * ji) / (4 * lambda);
    } else {
      // Zero eigenvalue.
      if (Math.abs(ji) > epsilon) {
        // Parabolic case.
        // We cannot remove linear term.
        // We use shift in this dimension to absorb the constant term c_prime.
        // New term is ji * x'' + c_prime = ji(x'' + c_prime/ji)
        // Shift S_i = c_prime / ji. Note: This moves origin to cancel C.
        // However, standard form usually keeps 2p z. 
        // Let's define S[i] to zero out C.
        S[i] = -c_prime / ji;
        c_prime = 0;
        linearVars.push(i);
      } else {
        // Cylinder axis, arbitrary shift. Keep 0.
        S[i] = 0;
      }
    }
  }

  // Calculate final tau in original coordinates: tau = M * S
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
    // The coefficient is J_prime[idx]
    const coef = J_prime[idx];
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

  // Classification (Simplified logic based on signs of eigenvalues and rank)
  let surfaceType = "General Quadric";
  const rank = eigenvalues.filter(v => Math.abs(v) > epsilon).length;
  const sigPos = eigenvalues.filter(v => v > epsilon).length;
  const sigNeg = eigenvalues.filter(v => v < -epsilon).length;
  
  if (linearVars.length > 0) {
      // Parabolic forms
      if (rank === 2) surfaceType = (sigPos === 2 || sigNeg === 2) ? "Elliptic Paraboloid" : "Hyperbolic Paraboloid";
      else if (rank === 1) surfaceType = "Parabolic Cylinder";
  } else {
      // Central forms
      if (rank === 3) {
          if (Math.abs(c_prime) < epsilon) surfaceType = "Cone (Real or Imaginary)";
          else {
             // Check signs relative to C
             // Standard form: L1 x^2 + L2 y^2 + L3 z^2 = -C
             const rhs = -c_prime;
             const sameSign = eigenvalues.filter(l => l * rhs > 0).length;
             if (sameSign === 3) surfaceType = "Ellipsoid";
             else if (sameSign === 2) surfaceType = "Hyperboloid of One Sheet";
             else if (sameSign === 1) surfaceType = "Hyperboloid of Two Sheets";
             else surfaceType = "Imaginary Ellipsoid";
          }
      } else if (rank === 2) {
           if (Math.abs(c_prime) < epsilon) surfaceType = (sigPos===2 || sigNeg===2) ? "Intersecting Planes (Imaginary)" : "Intersecting Planes";
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