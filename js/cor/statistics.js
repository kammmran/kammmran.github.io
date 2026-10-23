/* =====================================================================
 * statistics.js
 * Goodness-of-fit metrics for correlation model comparison.
 *
 * All metrics treat:
 *   y[i]   -> experimental observation
 *   yhat[i]-> model prediction
 *   k      -> number of fitted parameters in the model
 * =================================================================== */

const Statistics = (() => {

  /* Root Mean Square Error
   *   RMSE = sqrt( (1/n) * Σ (y_i - yhat_i)^2 )
   * Penalizes large residuals more strongly than MAE.
   */
  function rmse(y, yhat) {
    const n = y.length;
    let s = 0;
    for (let i = 0; i < n; i++) {
      const d = y[i] - yhat[i];
      s += d * d;
    }
    return Math.sqrt(s / n);
  }

  /* Mean Absolute Error
   *   MAE = (1/n) * Σ |y_i - yhat_i|
   * Robust, scale-equivalent to data units.
   */
  function mae(y, yhat) {
    const n = y.length;
    let s = 0;
    for (let i = 0; i < n; i++) s += Math.abs(y[i] - yhat[i]);
    return s / n;
  }

  /* Coefficient of Determination R²
   *   R² = 1 - SS_res / SS_tot
   *   SS_res = Σ (y_i - yhat_i)^2
   *   SS_tot = Σ (y_i - mean(y))^2
   */
  function r2(y, yhat) {
    const n = y.length;
    const mean = y.reduce((a, b) => a + b, 0) / n;
    let ssRes = 0, ssTot = 0;
    for (let i = 0; i < n; i++) {
      ssRes += (y[i] - yhat[i]) ** 2;
      ssTot += (y[i] - mean) ** 2;
    }
    if (ssTot === 0) return 1;
    return 1 - ssRes / ssTot;
  }

  /* Akaike Information Criterion (Gaussian residual form)
   *   AIC = n * ln(SSR/n) + 2k
   * Lower is better. Favors parsimony.
   */
  function aic(y, yhat, k) {
    const n = y.length;
    let ssr = 0;
    for (let i = 0; i < n; i++) ssr += (y[i] - yhat[i]) ** 2;
    if (ssr <= 0) ssr = 1e-12;
    return n * Math.log(ssr / n) + 2 * k;
  }

  /* Bayesian Information Criterion
   *   BIC = n * ln(SSR/n) + k * ln(n)
   * Stronger parsimony penalty than AIC for large n.
   */
  function bic(y, yhat, k) {
    const n = y.length;
    let ssr = 0;
    for (let i = 0; i < n; i++) ssr += (y[i] - yhat[i]) ** 2;
    if (ssr <= 0) ssr = 1e-12;
    return n * Math.log(ssr / n) + k * Math.log(n);
  }

  /* Bundles all metrics for a given y / yhat / k */
  function computeAll(y, yhat, k) {
    return {
      rmse: rmse(y, yhat),
      mae:  mae(y, yhat),
      r2:   r2(y, yhat),
      aic:  aic(y, yhat, k),
      bic:  bic(y, yhat, k)
    };
  }

  /* Rank models by composite criterion (lower AIC dominates,
   * with R² used as a tie-breaker for visualization purposes).
   */
  function rank(modelResults) {
    const sorted = [...modelResults].sort((a, b) => {
      if (a.metrics.aic !== b.metrics.aic) return a.metrics.aic - b.metrics.aic;
      return b.metrics.r2 - a.metrics.r2;
    });
    sorted.forEach((m, i) => m.rank = i + 1);
    return sorted;
  }

  return { rmse, mae, r2, aic, bic, computeAll, rank };
})();

window.Statistics = Statistics;
