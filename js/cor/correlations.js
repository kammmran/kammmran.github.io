/* =====================================================================
 * correlations.js
 * Thermodynamic correlation models for binary / multi-component mixtures.
 *
 * Models are grouped into four categories:
 *   - "general"      : generic curve fits (linear, polynomial, ...)
 *   - "excess"       : mixture thermodynamic / activity-coefficient models
 *   - "viscosity"    : empirical viscosity mixing rules
 *   - "vapor"        : vapor-pressure correlations
 *
 * Each correlation is registered in CorrelationRegistry. To add a new
 * correlation, call registerCorrelation({...}) — the UI auto-detects it.
 *
 * Convention:
 *   x          -> mole fraction of component 1 (binary: x₂ = 1 − x₁)
 *   y          -> measured property values
 *   parameters -> count of free parameters fitted from the data (for AIC/BIC)
 *   fit(x, y)  -> performs least-squares (or grid-search for nonlinear)
 *                 returns { params, predict(xq) -> [yhat...] }
 * =================================================================== */

const CorrelationRegistry = (() => {
  const _registry = new Map();

  function registerCorrelation(def) {
    if (!def.id || !def.name || typeof def.fit !== "function") {
      throw new Error("Invalid correlation definition: " + JSON.stringify(def));
    }
    if (!def.category) def.category = "general";
    _registry.set(def.id, def);
  }

  function list() { return Array.from(_registry.values()); }
  function get(id) { return _registry.get(id); }

  return { registerCorrelation, list, get };
})();

/* ---------------------------------------------------------------------
 * Small-dense least squares via normal equations (good for p ≤ 6).
 * ------------------------------------------------------------------- */
function _lsq(X, y) {
  const n = X.length;
  const p = X[0].length;
  const XtX = Array.from({ length: p }, () => new Array(p).fill(0));
  const Xty = new Array(p).fill(0);
  for (let i = 0; i < n; i++) {
    for (let a = 0; a < p; a++) {
      Xty[a] += X[i][a] * y[i];
      for (let b = 0; b < p; b++) {
        XtX[a][b] += X[i][a] * X[i][b];
      }
    }
  }
  return _solve(XtX, Xty);
}

function _solve(A, b) {
  const n = A.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let i = 0; i < n; i++) {
    let max = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(M[k][i]) > Math.abs(M[max][i])) max = k;
    }
    [M[i], M[max]] = [M[max], M[i]];
    if (Math.abs(M[i][i]) < 1e-14) M[i][i] = 1e-14;
    for (let k = i + 1; k < n; k++) {
      const f = M[k][i] / M[i][i];
      for (let j = i; j <= n; j++) M[k][j] -= f * M[i][j];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = M[i][n];
    for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j];
    x[i] = s / M[i][i];
  }
  return x;
}

/* Locate y at pure-component endpoints (x≈1 and x≈0) — used by mixing rules
 * such as Grünberg-Nissan, McAllister, Arrhenius, Jouyban-Acree that
 * require pure-fluid property values.
 */
function _endpoints(x, y) {
  let y1 = y[0], y2 = y[0];
  let d1 = Math.abs(x[0] - 1), d2 = Math.abs(x[0] - 0);
  for (let i = 1; i < x.length; i++) {
    const e1 = Math.abs(x[i] - 1), e2 = Math.abs(x[i] - 0);
    if (e1 < d1) { d1 = e1; y1 = y[i]; }
    if (e2 < d2) { d2 = e2; y2 = y[i]; }
  }
  return { y1, y2 };
}

function _mean(y) { return y.reduce((a, b) => a + b, 0) / y.length; }
function _fallback(y) {
  const m = _mean(y);
  return { params: { fallback: true, mean: m }, predict: xq => xq.map(() => m) };
}

/* =====================================================================
 * GENERAL — generic curve fits
 * =================================================================== */

/* 1. Linear  y = a + b·x */
CorrelationRegistry.registerCorrelation({
  id: "linear", category: "general",
  name: "Linear",
  equation: "y = a + b·x₁",
  parameters: 2,
  description: "Simple linear baseline.",
  fit(x, y) {
    const X = x.map(xi => [1, xi]);
    const p = _lsq(X, y);
    return {
      params: { a: p[0], b: p[1] },
      predict: xq => xq.map(xi => p[0] + p[1] * xi)
    };
  }
});

/* 2. Polynomial (cubic)  y = a0 + a1·x + a2·x² + a3·x³ */
CorrelationRegistry.registerCorrelation({
  id: "poly3", category: "general",
  name: "Polynomial (cubic)",
  equation: "y = a₀ + a₁x + a₂x² + a₃x³",
  parameters: 4,
  description: "Cubic polynomial — flexible for smooth property variations.",
  fit(x, y) {
    const X = x.map(xi => [1, xi, xi * xi, xi * xi * xi]);
    const p = _lsq(X, y);
    return {
      params: { a0: p[0], a1: p[1], a2: p[2], a3: p[3] },
      predict: xq => xq.map(xi => p[0] + p[1]*xi + p[2]*xi*xi + p[3]*xi*xi*xi)
    };
  }
});

/* 3. Exponential  y = a·exp(b·x)   — linearize via ln(y) */
CorrelationRegistry.registerCorrelation({
  id: "exponential", category: "general",
  name: "Exponential",
  equation: "y = a · exp(b·x₁)",
  parameters: 2,
  description: "Exponential growth/decay (viscosity, diffusion, rates).",
  fit(x, y) {
    if (!y.every(v => v > 0)) return _fallback(y);
    const lnY = y.map(Math.log);
    const X = x.map(xi => [1, xi]);
    const p = _lsq(X, lnY);
    return {
      params: { a: Math.exp(p[0]), b: p[1] },
      predict: xq => xq.map(xi => Math.exp(p[0] + p[1] * xi))
    };
  }
});

/* 4. Logarithmic  y = a + b·ln(x + ε) */
CorrelationRegistry.registerCorrelation({
  id: "logarithmic", category: "general",
  name: "Logarithmic",
  equation: "y = a + b·ln(x₁ + ε)",
  parameters: 2,
  description: "Slow change with composition / temperature.",
  fit(x, y) {
    const eps = 1e-3;
    const X = x.map(xi => [1, Math.log(xi + eps)]);
    const p = _lsq(X, y);
    return {
      params: { a: p[0], b: p[1] },
      predict: xq => xq.map(xi => p[0] + p[1] * Math.log(xi + eps))
    };
  }
});

/* 5. Power law  y = a · x^b   — linearize via ln(y) = ln(a) + b·ln(x) */
CorrelationRegistry.registerCorrelation({
  id: "powerlaw", category: "general",
  name: "Power Law",
  equation: "y = a · x₁ᵇ",
  parameters: 2,
  description: "Scaling relation — used for viscosity / diffusion.",
  fit(x, y) {
    if (!y.every(v => v > 0)) return _fallback(y);
    const eps = 1e-3;
    const X = x.map(xi => [1, Math.log(xi + eps)]);
    const p = _lsq(X, y.map(Math.log));
    return {
      params: { a: Math.exp(p[0]), b: p[1] },
      predict: xq => xq.map(xi => Math.exp(p[0] + p[1] * Math.log(xi + eps)))
    };
  }
});

/* =====================================================================
 * EXCESS — mixture / activity coefficient models
 * =================================================================== */

/* 6. Margules (3-suffix)
 *    Yᴱ = x₁x₂ [A + B(x₁−x₂) + C(x₁−x₂)²]
 */
CorrelationRegistry.registerCorrelation({
  id: "margules", category: "excess",
  name: "Margules (3-param)",
  equation: "Yᴱ = x₁x₂ [A + B(x₁−x₂) + C(x₁−x₂)²]",
  parameters: 3,
  description: "Classical Margules expansion (activity-coefficient form).",
  fit(x, y) {
    const X = x.map(xi => {
      const x1 = xi, x2 = 1 - xi, d = x1 - x2;
      return [x1 * x2, x1 * x2 * d, x1 * x2 * d * d];
    });
    const p = _lsq(X, y);
    return {
      params: { A: p[0], B: p[1], C: p[2] },
      predict: xq => xq.map(xi => {
        const x1 = xi, x2 = 1 - xi, d = x1 - x2;
        return x1 * x2 * (p[0] + p[1] * d + p[2] * d * d);
      })
    };
  }
});

/* 7. Redlich-Kister (4-param)
 *    Yᴱ = x₁x₂ Σ Aₖ (x₁−x₂)ᵏ   k=0..3
 */
CorrelationRegistry.registerCorrelation({
  id: "rk4", category: "excess",
  name: "Redlich-Kister",
  equation: "Yᴱ = x₁x₂ Σ Aₖ(x₁−x₂)ᵏ",
  parameters: 4,
  description: "Standard 4-term Redlich-Kister expansion for excess properties.",
  fit(x, y) {
    const X = x.map(xi => {
      const x1 = xi, x2 = 1 - xi, d = x1 - x2;
      return [x1 * x2, x1 * x2 * d, x1 * x2 * d * d, x1 * x2 * d * d * d];
    });
    const p = _lsq(X, y);
    return {
      params: { A0: p[0], A1: p[1], A2: p[2], A3: p[3] },
      predict: xq => xq.map(xi => {
        const x1 = xi, x2 = 1 - xi, d = x1 - x2;
        return x1 * x2 * (p[0] + p[1] * d + p[2] * d * d + p[3] * d * d * d);
      })
    };
  }
});

/* 8. Van Laar
 *    Yᴱ = A·B·x₁·x₂ / (A·x₁ + B·x₂)
 *    Nonlinear in (A, B) — coarse + refined grid search.
 */
CorrelationRegistry.registerCorrelation({
  id: "vanlaar", category: "excess",
  name: "Van Laar",
  equation: "Yᴱ = AB·x₁x₂ / (Ax₁ + Bx₂)",
  parameters: 2,
  description: "Two-parameter Van Laar form for non-ideal mixtures.",
  fit(x, y) {
    const search = (Amin, Amax, Bmin, Bmax, step) => {
      let best = null;
      for (let A = Amin; A <= Amax; A += step) {
        for (let B = Bmin; B <= Bmax; B += step) {
          let ssr = 0, ok = true;
          for (let i = 0; i < x.length; i++) {
            const x1 = x[i], x2 = 1 - x1;
            const den = A * x1 + B * x2;
            if (Math.abs(den) < 1e-8) { ok = false; break; }
            const yhat = A * B * x1 * x2 / den;
            ssr += (y[i] - yhat) ** 2;
          }
          if (ok && (!best || ssr < best.ssr)) best = { ssr, A, B };
        }
      }
      return best;
    };
    let best = search(-10, 10, -10, 10, 0.5);
    if (!best) return _fallback(y);
    best = search(best.A - 0.5, best.A + 0.5, best.B - 0.5, best.B + 0.5, 0.05) || best;
    const { A, B } = best;
    return {
      params: { A, B },
      predict: xq => xq.map(xi => {
        const x1 = xi, x2 = 1 - xi;
        const den = A * x1 + B * x2;
        return Math.abs(den) < 1e-12 ? 0 : A * B * x1 * x2 / den;
      })
    };
  }
});

/* 9. Wilson  (excess Gibbs form)
 *    Yᴱ = -x₁ ln(x₁ + Λ₁₂ x₂) − x₂ ln(x₂ + Λ₂₁ x₁)
 */
CorrelationRegistry.registerCorrelation({
  id: "wilson", category: "excess",
  name: "Wilson",
  equation: "Yᴱ = -x₁ln(x₁+Λ₁₂x₂) - x₂ln(x₂+Λ₂₁x₁)",
  parameters: 2,
  description: "Wilson model — strongly non-ideal liquid mixtures.",
  fit(x, y) {
    const search = (L1lo, L1hi, L2lo, L2hi, step) => {
      let best = null;
      for (let L12 = L1lo; L12 <= L1hi; L12 += step) {
        for (let L21 = L2lo; L21 <= L2hi; L21 += step) {
          let ssr = 0, ok = true;
          for (let i = 0; i < x.length; i++) {
            const x1 = x[i], x2 = 1 - x1;
            const a = x1 + L12 * x2, b = x2 + L21 * x1;
            if (a <= 0 || b <= 0) { ok = false; break; }
            const yhat = -x1 * Math.log(a) - x2 * Math.log(b);
            ssr += (y[i] - yhat) ** 2;
          }
          if (ok && (!best || ssr < best.ssr)) best = { ssr, L12, L21 };
        }
      }
      return best;
    };
    let best = search(0.05, 5, 0.05, 5, 0.1);
    if (!best) return _fallback(y);
    best = search(Math.max(0.01, best.L12 - 0.1), best.L12 + 0.1,
                  Math.max(0.01, best.L21 - 0.1), best.L21 + 0.1, 0.01) || best;
    const { L12, L21 } = best;
    return {
      params: { Lambda12: L12, Lambda21: L21 },
      predict: xq => xq.map(xi => {
        const x1 = xi, x2 = 1 - xi;
        const a = Math.max(x1 + L12 * x2, 1e-9);
        const b = Math.max(x2 + L21 * x1, 1e-9);
        return -x1 * Math.log(a) - x2 * Math.log(b);
      })
    };
  }
});

/* 10. NRTL (α = 0.3 fixed)
 *     Yᴱ = x₁x₂ [τ₂₁G₂₁ / (x₁ + x₂G₂₁) + τ₁₂G₁₂ / (x₂ + x₁G₁₂)]
 *     G_ij = exp(-α τ_ij)
 */
CorrelationRegistry.registerCorrelation({
  id: "nrtl", category: "excess",
  name: "NRTL (α = 0.3)",
  equation: "Yᴱ = x₁x₂[τ₂₁G₂₁/(x₁+x₂G₂₁) + τ₁₂G₁₂/(x₂+x₁G₁₂)]",
  parameters: 2,
  description: "Non-Random Two Liquid — common for VLE calculations.",
  fit(x, y) {
    const alpha = 0.3;
    const eval_ssr = (t12, t21) => {
      const G12 = Math.exp(-alpha * t12);
      const G21 = Math.exp(-alpha * t21);
      let ssr = 0;
      for (let i = 0; i < x.length; i++) {
        const x1 = x[i], x2 = 1 - x1;
        const d1 = x1 + x2 * G21, d2 = x2 + x1 * G12;
        if (Math.abs(d1) < 1e-9 || Math.abs(d2) < 1e-9) return Infinity;
        const yhat = x1 * x2 * (t21 * G21 / d1 + t12 * G12 / d2);
        ssr += (y[i] - yhat) ** 2;
      }
      return ssr;
    };
    const search = (lo, hi, step) => {
      let best = null;
      for (let t12 = lo; t12 <= hi; t12 += step) {
        for (let t21 = lo; t21 <= hi; t21 += step) {
          const ssr = eval_ssr(t12, t21);
          if (!best || ssr < best.ssr) best = { ssr, t12, t21 };
        }
      }
      return best;
    };
    let best = search(-5, 5, 0.25);
    best = search(best.t12 - 0.25, best.t12 + 0.25, 0.025) || best;
    const { t12, t21 } = best;
    const G12 = Math.exp(-alpha * t12), G21 = Math.exp(-alpha * t21);
    return {
      params: { tau12: t12, tau21: t21, alpha },
      predict: xq => xq.map(xi => {
        const x1 = xi, x2 = 1 - xi;
        const d1 = x1 + x2 * G21, d2 = x2 + x1 * G12;
        return x1 * x2 * (t21 * G21 / d1 + t12 * G12 / d2);
      })
    };
  }
});

/* 11. UNIFAC-style surrogate
 *    Y ≈ q₁·x₂² + q₂·x₁² + q₃·x₁·x₂
 *    Group-contribution placeholder — a full UNIFAC requires functional
 *    group decomposition not available without an external database.
 */
CorrelationRegistry.registerCorrelation({
  id: "unifac", category: "excess",
  name: "UNIFAC (approx.)",
  equation: "Y = q₁·x₂² + q₂·x₁² + q₃·x₁x₂",
  parameters: 3,
  description: "Simplified UNIFAC-like surrogate (group-contribution placeholder).",
  fit(x, y) {
    const X = x.map(xi => {
      const x1 = xi, x2 = 1 - xi;
      return [x2 * x2, x1 * x1, x1 * x2];
    });
    const p = _lsq(X, y);
    return {
      params: { q1: p[0], q2: p[1], q3: p[2] },
      predict: xq => xq.map(xi => {
        const x1 = xi, x2 = 1 - xi;
        return p[0] * x2 * x2 + p[1] * x1 * x1 + p[2] * x1 * x2;
      })
    };
  }
});

/* 12. Jouyban-Acree
 *    ln(Y) = x₁·ln(Y₁) + x₂·ln(Y₂) + x₁·x₂ Σ Aⱼ (x₁−x₂)ʲ
 *    Pure-fluid Y₁,Y₂ are read from dataset endpoints.
 */
CorrelationRegistry.registerCorrelation({
  id: "jouyban_acree", category: "excess",
  name: "Jouyban-Acree",
  equation: "ln(Y) = x₁lnY₁ + x₂lnY₂ + x₁x₂ Σ Aⱼ(x₁−x₂)ʲ",
  parameters: 3,
  description: "Solvent-mixture model — density, viscosity, solubility.",
  fit(x, y) {
    if (!y.every(v => v > 0)) return _fallback(y);
    const lnY = y.map(Math.log);
    const { y1, y2 } = _endpoints(x, y);
    const lnY1 = Math.log(Math.max(y1, 1e-12));
    const lnY2 = Math.log(Math.max(y2, 1e-12));
    const dev = x.map((xi, i) => {
      const x1 = xi, x2 = 1 - x1;
      return lnY[i] - (x1 * lnY1 + x2 * lnY2);
    });
    const X = x.map(xi => {
      const x1 = xi, x2 = 1 - xi, d = x1 - x2;
      return [x1 * x2, x1 * x2 * d, x1 * x2 * d * d];
    });
    const p = _lsq(X, dev);
    return {
      params: { A0: p[0], A1: p[1], A2: p[2], Y1: y1, Y2: y2 },
      predict: xq => xq.map(xi => {
        const x1 = xi, x2 = 1 - xi, d = x1 - x2;
        const base = x1 * lnY1 + x2 * lnY2;
        const ex   = x1 * x2 * (p[0] + p[1] * d + p[2] * d * d);
        return Math.exp(base + ex);
      })
    };
  }
});

/* =====================================================================
 * VISCOSITY — empirical viscosity mixing rules
 * =================================================================== */

/* 13. Grünberg-Nissan
 *    ln(η) = x₁ ln η₁ + x₂ ln η₂ + x₁·x₂·d₁₂      (1 free param)
 */
CorrelationRegistry.registerCorrelation({
  id: "grunberg_nissan", category: "viscosity",
  name: "Grünberg-Nissan",
  equation: "ln(η) = x₁lnη₁ + x₂lnη₂ + x₁x₂·d₁₂",
  parameters: 1,
  description: "Single-parameter viscosity mixing rule.",
  fit(x, y) {
    if (!y.every(v => v > 0)) return _fallback(y);
    const { y1, y2 } = _endpoints(x, y);
    const lnY1 = Math.log(y1), lnY2 = Math.log(y2);
    let num = 0, den = 0;
    for (let i = 0; i < x.length; i++) {
      const x1 = x[i], x2 = 1 - x1;
      const dev = Math.log(y[i]) - (x1 * lnY1 + x2 * lnY2);
      const basis = x1 * x2;
      num += basis * dev;
      den += basis * basis;
    }
    const d = den === 0 ? 0 : num / den;
    return {
      params: { d12: d, eta1: y1, eta2: y2 },
      predict: xq => xq.map(xi => {
        const x1 = xi, x2 = 1 - xi;
        return Math.exp(x1 * lnY1 + x2 * lnY2 + x1 * x2 * d);
      })
    };
  }
});

/* 14. McAllister (three-body)
 *    ln(η) = x₁³ ln η₁ + 3x₁²x₂ ln M₁₂ + 3x₁x₂² ln M₂₁ + x₂³ ln η₂
 */
CorrelationRegistry.registerCorrelation({
  id: "mcallister", category: "viscosity",
  name: "McAllister (3-body)",
  equation: "ln(η) = x₁³lnη₁ + 3x₁²x₂lnM₁₂ + 3x₁x₂²lnM₂₁ + x₂³lnη₂",
  parameters: 2,
  description: "Three-body viscosity mixing model.",
  fit(x, y) {
    if (!y.every(v => v > 0)) return _fallback(y);
    const { y1, y2 } = _endpoints(x, y);
    const lnY1 = Math.log(y1), lnY2 = Math.log(y2);
    const dev = x.map((xi, i) => {
      const x1 = xi, x2 = 1 - xi;
      return Math.log(y[i]) - (x1 ** 3) * lnY1 - (x2 ** 3) * lnY2;
    });
    const X = x.map(xi => {
      const x1 = xi, x2 = 1 - xi;
      return [3 * x1 * x1 * x2, 3 * x1 * x2 * x2];
    });
    const p = _lsq(X, dev);
    const lnM12 = p[0], lnM21 = p[1];
    return {
      params: { M12: Math.exp(lnM12), M21: Math.exp(lnM21), eta1: y1, eta2: y2 },
      predict: xq => xq.map(xi => {
        const x1 = xi, x2 = 1 - xi;
        return Math.exp((x1 ** 3) * lnY1 + 3 * x1 * x1 * x2 * lnM12
                      + 3 * x1 * x2 * x2 * lnM21 + (x2 ** 3) * lnY2);
      })
    };
  }
});

/* 15. Arrhenius (ideal log-mixing)
 *    ln(η) = x₁ ln η₁ + x₂ ln η₂       (no interaction term)
 *    No free interaction parameters, but the two endpoint values
 *    are extracted from the dataset → counted as 2 params for AIC/BIC.
 */
CorrelationRegistry.registerCorrelation({
  id: "arrhenius", category: "viscosity",
  name: "Arrhenius (ideal)",
  equation: "ln(η) = x₁lnη₁ + x₂lnη₂",
  parameters: 2,
  description: "Ideal log-mixing rule — zero interaction parameters.",
  fit(x, y) {
    if (!y.every(v => v > 0)) return _fallback(y);
    const { y1, y2 } = _endpoints(x, y);
    const lnY1 = Math.log(y1), lnY2 = Math.log(y2);
    return {
      params: { eta1: y1, eta2: y2 },
      predict: xq => xq.map(xi => {
        const x1 = xi, x2 = 1 - xi;
        return Math.exp(x1 * lnY1 + x2 * lnY2);
      })
    };
  }
});

/* =====================================================================
 * PETROLEUM — mixing rules and pseudo-component correlations
 *
 * Many petroleum correlations (Standing, Beggs–Robinson, Lee–Gonzalez–Eakin,
 * Twu, Kesler–Lee, Riazi–Daubert) are temperature- or API-gravity-based,
 * not composition-based, so they do not fit this composition-x framework.
 * The implementations below are the composition-based mixing rules that
 * are used in petroleum process simulation: Kay's rule, Kendall–Monroe
 * cube-root viscosity mixing, and the Refutas/ASTM D7152 viscosity index.
 * =================================================================== */

/* 17. Kay's Rule  y = Σ xᵢ yᵢ
 *     Linear mole-fraction averaging of pure-component values.
 *     Used for pseudo-critical properties (Tpc, Ppc) and gas mixtures.
 */
CorrelationRegistry.registerCorrelation({
  id: "kays_rule", category: "petroleum",
  name: "Kay's Rule",
  equation: "y = x₁y₁ + x₂y₂",
  parameters: 2,
  description: "Linear mole-fraction mixing — pseudo-critical properties.",
  fit(x, y) {
    const { y1, y2 } = _endpoints(x, y);
    return {
      params: { y1, y2 },
      predict: xq => xq.map(xi => xi * y1 + (1 - xi) * y2)
    };
  }
});

/* 18. Kendall–Monroe (cube-root viscosity mixing)
 *     η^(1/3) = x₁ η₁^(1/3) + x₂ η₂^(1/3)
 *     Better than linear for viscosity of hydrocarbon mixtures.
 */
CorrelationRegistry.registerCorrelation({
  id: "kendall_monroe", category: "petroleum",
  name: "Kendall–Monroe",
  equation: "η^(1/3) = x₁η₁^(1/3) + x₂η₂^(1/3)",
  parameters: 2,
  description: "Cube-root viscosity mixing rule (petroleum / hydrocarbons).",
  fit(x, y) {
    if (!y.every(v => v > 0)) return _fallback(y);
    const { y1, y2 } = _endpoints(x, y);
    const c1 = Math.cbrt(y1), c2 = Math.cbrt(y2);
    return {
      params: { y1, y2 },
      predict: xq => xq.map(xi => Math.pow(xi * c1 + (1 - xi) * c2, 3))
    };
  }
});

/* 19. Refutas / ASTM D7152 viscosity-blending index (VBI)
 *     VBI(η) = 14.534 · ln(ln(η + 0.8)) + 10.975
 *     VBI_mix = Σ xᵢ · VBI(ηᵢ),  then η_mix back-transformed.
 *     Standard for petroleum kinematic viscosity blending.
 */
CorrelationRegistry.registerCorrelation({
  id: "refutas", category: "petroleum",
  name: "Refutas (VBI)",
  equation: "VBI(η) = 14.534·ln(ln(η+0.8)) + 10.975",
  parameters: 2,
  description: "Refutas viscosity-blending index — refinery viscosity mixing.",
  fit(x, y) {
    if (!y.every(v => v > 0)) return _fallback(y);
    const VBI = v => 14.534 * Math.log(Math.log(v + 0.8)) + 10.975;
    const invVBI = vbi => Math.exp(Math.exp((vbi - 10.975) / 14.534)) - 0.8;
    const { y1, y2 } = _endpoints(x, y);
    const v1 = VBI(y1), v2 = VBI(y2);
    return {
      params: { y1, y2 },
      predict: xq => xq.map(xi => invVBI(xi * v1 + (1 - xi) * v2))
    };
  }
});

/* =====================================================================
 * PETROLEUM (TEMPERATURE-DEPENDENT)
 *
 * These correlations are NOT composition-based — they take temperature
 * as the independent variable. Use them when the "Variable Axis" is set
 * to Temperature. The x array is interpreted as T in °C.
 * =================================================================== */

/* 20. Pedersen-type viscosity vs T   (heavy oil)
 *     μ(T) = A · exp(B / T)              T in K
 *     Linearized: ln(μ) = ln(A) + B/T
 */
CorrelationRegistry.registerCorrelation({
  id: "pedersen", category: "petroleum_t",
  variable: "temperature",
  name: "Pedersen (μ vs T)",
  equation: "μ = A · exp(B / T)",
  parameters: 2,
  description: "Pedersen-style Arrhenius viscosity — heavy oil μ(T).",
  fit(x, y) {
    if (!y.every(v => v > 0)) return _fallback(y);
    const T = x.map(t => t + 273.15);
    const lnY = y.map(Math.log);
    const X = T.map(t => [1, 1 / t]);
    const p = _lsq(X, lnY);
    return {
      params: { A: Math.exp(p[0]), B: p[1] },
      predict: xq => xq.map(t => Math.exp(p[0] + p[1] / (t + 273.15)))
    };
  }
});

/* 21. Standing dead-oil viscosity
 *     μ_od = 10^(Y · T^(-1.163)) − 1     T in °F
 *     Single fitted Y; the −1.163 exponent is Standing's correlation.
 */
CorrelationRegistry.registerCorrelation({
  id: "standing", category: "petroleum_t",
  variable: "temperature",
  name: "Standing (dead-oil μ)",
  equation: "μ = 10^(Y·T^(-1.163)) − 1",
  parameters: 1,
  description: "Standing dead-oil viscosity correlation (input T in °C → converted to °F).",
  fit(x, y) {
    const Tf = x.map(t => t * 9 / 5 + 32);
    if (!y.every(v => v > -1)) return _fallback(y);
    const lhs = y.map(v => Math.log10(v + 1));
    let num = 0, den = 0;
    for (let i = 0; i < x.length; i++) {
      const b = Math.pow(Tf[i], -1.163);
      num += b * lhs[i];
      den += b * b;
    }
    const Y = den === 0 ? 0 : num / den;
    return {
      params: { Y, exponent: -1.163 },
      predict: xq => xq.map(t => {
        const tF = t * 9 / 5 + 32;
        return Math.pow(10, Y * Math.pow(tF, -1.163)) - 1;
      })
    };
  }
});

/* 22. Beggs-Robinson dead-oil viscosity
 *     μ_od = 10^(a · T^b) − 1            T in °F
 *     Two free parameters (a, b).
 */
CorrelationRegistry.registerCorrelation({
  id: "beggs_robinson", category: "petroleum_t",
  variable: "temperature",
  name: "Beggs-Robinson",
  equation: "μ = 10^(a · T^b) − 1",
  parameters: 2,
  description: "Beggs-Robinson dead-oil viscosity (input T in °C → converted to °F).",
  fit(x, y) {
    const Tf = x.map(t => t * 9 / 5 + 32);
    if (!y.every(v => v > -1)) return _fallback(y);
    // ln(log10(μ+1)) = ln(a) + b·ln(T)
    const Xrows = [], lhs = [];
    for (let i = 0; i < x.length; i++) {
      const v = Math.log10(y[i] + 1);
      if (v > 0 && Tf[i] > 0) {
        lhs.push(Math.log(v));
        Xrows.push([1, Math.log(Tf[i])]);
      }
    }
    if (Xrows.length < 2) return _fallback(y);
    const p = _lsq(Xrows, lhs);
    const a = Math.exp(p[0]), b = p[1];
    return {
      params: { a, b },
      predict: xq => xq.map(t => {
        const tF = t * 9 / 5 + 32;
        if (tF <= 0) return 0;
        return Math.pow(10, a * Math.pow(tF, b)) - 1;
      })
    };
  }
});

/* =====================================================================
 * PETROLEUM (DENSITY-DEPENDENT) — gas viscosity
 * =================================================================== */

/* 23. Lee-Gonzalez-Eakin gas viscosity
 *     μ = 10⁻⁴ · K · exp(X · ρ^Y)        μ in cP, ρ in g/cc
 *     Three free parameters: K, X, Y.
 *     Nonlinear in Y → grid search over Y, linear fit for ln(K), X.
 */
CorrelationRegistry.registerCorrelation({
  id: "lee_gonzalez_eakin", category: "petroleum_rho",
  variable: "density",
  name: "Lee-Gonzalez-Eakin",
  equation: "μ = 10⁻⁴ · K · exp(X · ρ^Y)",
  parameters: 3,
  description: "Lee-Gonzalez-Eakin gas viscosity (ρ in g/cc).",
  fit(x, y) {
    if (!y.every(v => v > 0)) return _fallback(y);
    const lhs = y.map(v => Math.log(v * 1e4));
    let best = null;
    for (let Y = 0.5; Y <= 3.0; Y += 0.05) {
      const Xr = x.map(rho => [1, Math.pow(Math.max(rho, 1e-9), Y)]);
      const p = _lsq(Xr, lhs);
      let ssr = 0;
      for (let i = 0; i < y.length; i++) {
        const yhat = Math.exp(p[0] + p[1] * Math.pow(Math.max(x[i], 1e-9), Y)) * 1e-4;
        ssr += (y[i] - yhat) ** 2;
      }
      if (!best || ssr < best.ssr) best = { ssr, lnK: p[0], Xc: p[1], Y };
    }
    const { lnK, Xc, Y } = best;
    return {
      params: { K: Math.exp(lnK), X: Xc, Y },
      predict: xq => xq.map(rho =>
        Math.exp(lnK + Xc * Math.pow(Math.max(rho, 1e-9), Y)) * 1e-4
      )
    };
  }
});

/* =====================================================================
 * VAPOR — vapor pressure correlations
 * =================================================================== */

/* 16. Antoine-type  ln(y) = A − B / (C + x)   (3 params)
 *     Linear in (A, B) for fixed C → grid search over C.
 */
CorrelationRegistry.registerCorrelation({
  id: "antoine", category: "vapor",
  name: "Antoine-type",
  equation: "ln(y) = A − B / (C + x)",
  parameters: 3,
  description: "Antoine vapor-pressure form (3 parameters).",
  fit(x, y) {
    if (!y.every(v => v > 0)) return _fallback(y);
    const lnY = y.map(Math.log);
    let best = null;
    for (let C = 0.1; C <= 5.0; C += 0.1) {
      const X = x.map(xi => [1, -1 / (C + xi)]);
      const p = _lsq(X, lnY);
      const yhat = x.map(xi => Math.exp(p[0] + p[1] * (-1 / (C + xi))));
      let ssr = 0;
      for (let i = 0; i < y.length; i++) ssr += (y[i] - yhat[i]) ** 2;
      if (!best || ssr < best.ssr) best = { ssr, A: p[0], B: -p[1], C };
    }
    const { A, B, C } = best;
    return {
      params: { A, B, C },
      predict: xq => xq.map(xi => Math.exp(A - B / (C + xi)))
    };
  }
});

/* Expose globally */
window.CorrelationRegistry = CorrelationRegistry;
