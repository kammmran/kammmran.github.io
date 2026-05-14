/* =====================================================================
 * charts.js
 * Chart.js-backed visualizations:
 *   1. Parity (experimental vs predicted, with y = x reference)
 *   2. Composition vs property (raw curve with experimental points)
 *   3. Residual plot (pred − exp vs composition)
 *   4. Error histogram (residual distribution, best model)
 *   5. Q–Q plot (normality check, best model)
 *   6. RMSE / R² bar chart
 *   7. AIC / BIC ranking bar chart (lower is better)
 * =================================================================== */

const Charts = (() => {

  const palette = [
    "#2563eb", "#16a34a", "#d97706",
    "#9333ea", "#db2777", "#dc2626",
    "#0891b2", "#65a30d", "#475569",
    "#7c3aed", "#0d9488", "#b45309"
  ];

  const charts = {};
  function _destroy(key) {
    if (charts[key]) { charts[key].destroy(); charts[key] = null; }
  }

  const TEXT = "#111111";
  const TEXT_DIM = "#555555";
  const GRID = "#eeeeee";

  /* Inverse standard-normal CDF (Acklam's rational approximation).
   * Used for Q–Q plot theoretical quantiles.
   */
  function _normInv(p) {
    if (p <= 0) return -Infinity;
    if (p >= 1) return  Infinity;
    const a = [-3.969683028665376e+01,  2.209460984245205e+02, -2.759285104469687e+02,
                1.383577518672690e+02, -3.066479806614716e+01,  2.506628277459239];
    const b = [-5.447609879822406e+01,  1.615858368580409e+02, -1.556989798598866e+02,
                6.680131188771972e+01, -1.328068155288572e+01];
    const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838,
               -2.549732539343734,      4.374664141464968,      2.938163982698783];
    const d = [ 7.784695709041462e-03,  3.224671290700398e-01,  2.445134137142996,
                3.754408661907416];
    const plow = 0.02425, phigh = 1 - plow;
    let q, r;
    if (p < plow) {
      q = Math.sqrt(-2 * Math.log(p));
      return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
             ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
    }
    if (p <= phigh) {
      q = p - 0.5;
      r = q * q;
      return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5]) * q /
             (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
    }
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
            ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }

  // Common light-theme styling
  const baseOpts = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 500, easing: "easeOutCubic" },
    plugins: {
      legend: {
        labels: {
          color: TEXT,
          font: { family: "'IBM Plex Sans', sans-serif", size: 12 },
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 8
        }
      },
      tooltip: {
        backgroundColor: "#ffffff",
        borderColor: "#d4d4d4",
        borderWidth: 1,
        titleColor: TEXT,
        bodyColor: TEXT,
        titleFont: { family: "'IBM Plex Sans', sans-serif", size: 12, weight: 600 },
        bodyFont:  { family: "'JetBrains Mono', monospace", size: 11 }
      }
    },
    scales: {
      x: {
        grid:  { color: GRID, drawTicks: false },
        ticks: { color: TEXT_DIM, font: { family: "'JetBrains Mono', monospace", size: 11 } },
        title: { display: true, color: TEXT_DIM, font: { family: "'IBM Plex Sans', sans-serif", size: 12, weight: 600 } }
      },
      y: {
        grid:  { color: GRID, drawTicks: false },
        ticks: { color: TEXT_DIM, font: { family: "'JetBrains Mono', monospace", size: 11 } },
        title: { display: true, color: TEXT_DIM, font: { family: "'IBM Plex Sans', sans-serif", size: 12, weight: 600 } }
      }
    }
  };

  /* -------------------------------------------------------
   * 1. Parity plot (experimental vs predicted)
   * ----------------------------------------------------- */
  function renderScatter(canvasId, models, experimental, propertyLabel) {
    _destroy("scatter");
    const ctx = document.getElementById(canvasId).getContext("2d");

    const datasets = models.map((m, i) => ({
      label: m.name,
      data: experimental.y.map((yi, idx) => ({ x: yi, y: m.predicted[idx] })),
      backgroundColor: palette[i % palette.length],
      borderColor:     palette[i % palette.length],
      pointRadius: 4,
      pointHoverRadius: 6,
      showLine: false
    }));

    const minY = Math.min(...experimental.y);
    const maxY = Math.max(...experimental.y);
    datasets.unshift({
      label: "y = x (ideal)",
      data: [{ x: minY, y: minY }, { x: maxY, y: maxY }],
      borderColor: "#888888",
      borderDash: [4, 4],
      borderWidth: 1.5,
      pointRadius: 0,
      showLine: true,
      type: "line"
    });

    charts.scatter = new Chart(ctx, {
      type: "scatter",
      data: { datasets },
      options: {
        ...baseOpts,
        scales: {
          x: { ...baseOpts.scales.x, title: { ...baseOpts.scales.x.title, text: `Experimental ${propertyLabel}` } },
          y: { ...baseOpts.scales.y, title: { ...baseOpts.scales.y.title, text: `Predicted ${propertyLabel}` } }
        }
      }
    });
  }

  /* -------------------------------------------------------
   * 2. Composition vs property
   *    Experimental points + smooth fitted curves (101-point grid).
   * ----------------------------------------------------- */
  function renderComposition(canvasId, models, experimental, propertyLabel, axisLabel) {
    _destroy("composition");
    const ctx = document.getElementById(canvasId).getContext("2d");

    const xMin = Math.min(...experimental.x);
    const xMax = Math.max(...experimental.x);
    const xFine = Array.from({ length: 101 }, (_, i) => xMin + (xMax - xMin) * i / 100);

    const datasets = [
      {
        label: "Experimental",
        data: experimental.x.map((xi, i) => ({ x: xi, y: experimental.y[i] })),
        backgroundColor: TEXT,
        borderColor: TEXT,
        pointRadius: 4,
        showLine: false,
        type: "scatter",
        order: 0
      },
      ...models.map((m, i) => ({
        label: m.name,
        data: xFine.map((xi, idx) => ({ x: xi, y: m.predict ? m.predict(xFine)[idx] : NaN })),
        borderColor: palette[i % palette.length],
        backgroundColor: palette[i % palette.length],
        borderWidth: 2,
        pointRadius: 0,
        showLine: true,
        tension: 0.25,
        type: "line",
        order: 1
      }))
    ];

    // The map above re-invokes m.predict(xFine) per point — collapse to single call
    for (let i = 1; i < datasets.length; i++) {
      const m = models[i - 1];
      const yFine = m.predict ? m.predict(xFine) : new Array(xFine.length).fill(NaN);
      datasets[i].data = xFine.map((xi, k) => ({ x: xi, y: yFine[k] }));
    }

    charts.composition = new Chart(ctx, {
      type: "scatter",
      data: { datasets },
      options: {
        ...baseOpts,
        scales: {
          x: { ...baseOpts.scales.x, min: xMin, max: xMax,
               title: { ...baseOpts.scales.x.title, text: axisLabel || "Mole fraction x₁" } },
          y: { ...baseOpts.scales.y,
               title: { ...baseOpts.scales.y.title, text: propertyLabel } }
        }
      }
    });
  }

  /* -------------------------------------------------------
   * 3. Residual plot
   * ----------------------------------------------------- */
  function renderResidual(canvasId, models, experimental, propertyLabel, axisLabel) {
    _destroy("residual");
    const ctx = document.getElementById(canvasId).getContext("2d");

    const datasets = models.map((m, i) => ({
      label: m.name,
      data: experimental.x.map((xi, idx) => ({ x: xi, y: m.predicted[idx] - experimental.y[idx] })),
      backgroundColor: palette[i % palette.length],
      borderColor:     palette[i % palette.length],
      pointRadius: 3,
      showLine: true,
      borderWidth: 1.5,
      tension: 0.3
    }));

    const xLo = Math.min(...experimental.x), xHi = Math.max(...experimental.x);
    datasets.unshift({
      label: "zero",
      data: [{ x: xLo, y: 0 }, { x: xHi, y: 0 }],
      borderColor: "#888888",
      borderDash: [4, 4],
      borderWidth: 1.5,
      pointRadius: 0,
      showLine: true,
      type: "line"
    });

    charts.residual = new Chart(ctx, {
      type: "scatter",
      data: { datasets },
      options: {
        ...baseOpts,
        scales: {
          x: { ...baseOpts.scales.x, title: { ...baseOpts.scales.x.title, text: axisLabel || "Mole fraction x₁" } },
          y: { ...baseOpts.scales.y, title: { ...baseOpts.scales.y.title, text: `Residual (pred − exp) ${propertyLabel}` } }
        }
      }
    });
  }

  /* -------------------------------------------------------
   * 4. Error histogram (best model)
   *    Equal-width bins of residuals.
   * ----------------------------------------------------- */
  function renderHistogram(canvasId, models, experimental) {
    _destroy("histogram");
    const ctx = document.getElementById(canvasId).getContext("2d");

    const best = models[0];
    const residuals = experimental.y.map((yi, i) => best.predicted[i] - yi);
    const N = 12;
    let min = Math.min(...residuals);
    let max = Math.max(...residuals);
    if (min === max) { min -= 0.5; max += 0.5; }
    const bw = (max - min) / N;
    const bins = new Array(N).fill(0);
    for (const r of residuals) {
      let idx = Math.floor((r - min) / bw);
      if (idx >= N) idx = N - 1;
      if (idx < 0) idx = 0;
      bins[idx]++;
    }
    const labels = Array.from({ length: N }, (_, i) => (min + (i + 0.5) * bw).toExponential(2));

    charts.histogram = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          label: `Residuals — ${best.name}`,
          data: bins,
          backgroundColor: "rgba(37, 99, 235, 0.7)",
          borderColor: "#2563eb",
          borderWidth: 1
        }]
      },
      options: {
        ...baseOpts,
        scales: {
          x: { ...baseOpts.scales.x, title: { ...baseOpts.scales.x.title, text: "Residual (pred − exp)" } },
          y: { ...baseOpts.scales.y, title: { ...baseOpts.scales.y.title, text: "Frequency" }, beginAtZero: true }
        }
      }
    });
  }

  /* -------------------------------------------------------
   * 5. Q–Q plot (best model residuals vs normal quantiles)
   * ----------------------------------------------------- */
  function renderQQ(canvasId, models, experimental) {
    _destroy("qq");
    const ctx = document.getElementById(canvasId).getContext("2d");

    const best = models[0];
    const residuals = experimental.y.map((yi, i) => best.predicted[i] - yi);
    const n = residuals.length;
    const mean = residuals.reduce((a, b) => a + b, 0) / n;
    const std = Math.sqrt(residuals.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(n - 1, 1));
    const sorted = [...residuals].sort((a, b) => a - b);
    const sampleZ = sorted.map(r => (r - mean) / (std || 1));
    const theoretical = sorted.map((_, i) => _normInv((i + 0.5) / n));

    const data = theoretical.map((t, i) => ({ x: t, y: sampleZ[i] }));
    const lo = Math.min(...theoretical, ...sampleZ);
    const hi = Math.max(...theoretical, ...sampleZ);

    charts.qq = new Chart(ctx, {
      type: "scatter",
      data: {
        datasets: [
          {
            label: "reference y = x",
            data: [{ x: lo, y: lo }, { x: hi, y: hi }],
            borderColor: "#888888",
            borderDash: [4, 4],
            borderWidth: 1.5,
            pointRadius: 0,
            showLine: true,
            type: "line"
          },
          {
            label: `Residual Q–Q — ${best.name}`,
            data,
            backgroundColor: "#2563eb",
            borderColor: "#2563eb",
            pointRadius: 4
          }
        ]
      },
      options: {
        ...baseOpts,
        scales: {
          x: { ...baseOpts.scales.x, title: { ...baseOpts.scales.x.title, text: "Theoretical quantile (z)" } },
          y: { ...baseOpts.scales.y, title: { ...baseOpts.scales.y.title, text: "Standardized residual" } }
        }
      }
    });
  }

  /* -------------------------------------------------------
   * 6. RMSE / R² bar chart
   * ----------------------------------------------------- */
  function renderBars(canvasId, models) {
    _destroy("bars");
    const ctx = document.getElementById(canvasId).getContext("2d");

    const labels = models.map(m => m.name);
    const rmse = models.map(m => m.metrics.rmse);
    const r2   = models.map(m => m.metrics.r2);

    charts.bars = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "RMSE",
            data: rmse,
            backgroundColor: "rgba(17, 17, 17, 0.85)",
            borderColor: "#111111",
            borderWidth: 1,
            yAxisID: "y"
          },
          {
            label: "R²",
            data: r2,
            type: "line",
            borderColor: "#2563eb",
            backgroundColor: "#2563eb",
            tension: 0.25,
            pointRadius: 4,
            yAxisID: "y1"
          }
        ]
      },
      options: {
        ...baseOpts,
        scales: {
          x: { ...baseOpts.scales.x, title: { display: false } },
          y:  { ...baseOpts.scales.y, position: "left",
                title: { ...baseOpts.scales.y.title, text: "RMSE" } },
          y1: { ...baseOpts.scales.y, position: "right",
                grid: { drawOnChartArea: false },
                title: { ...baseOpts.scales.y.title, text: "R²" },
                min: 0, max: 1 }
        }
      }
    });
  }

  /* -------------------------------------------------------
   * 7. AIC / BIC ranking — show ΔAIC and ΔBIC vs best
   * ----------------------------------------------------- */
  function renderAICBIC(canvasId, models) {
    _destroy("aicbic");
    const ctx = document.getElementById(canvasId).getContext("2d");

    const labels = models.map(m => m.name);
    const minAIC = Math.min(...models.map(m => m.metrics.aic));
    const minBIC = Math.min(...models.map(m => m.metrics.bic));
    const dAIC = models.map(m => m.metrics.aic - minAIC);
    const dBIC = models.map(m => m.metrics.bic - minBIC);

    charts.aicbic = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "ΔAIC (vs best)",
            data: dAIC,
            backgroundColor: "rgba(22, 163, 74, 0.75)",
            borderColor: "#16a34a",
            borderWidth: 1
          },
          {
            label: "ΔBIC (vs best)",
            data: dBIC,
            backgroundColor: "rgba(217, 119, 6, 0.75)",
            borderColor: "#d97706",
            borderWidth: 1
          }
        ]
      },
      options: {
        ...baseOpts,
        scales: {
          x: { ...baseOpts.scales.x, title: { display: false } },
          y: { ...baseOpts.scales.y, beginAtZero: true,
               title: { ...baseOpts.scales.y.title, text: "Δ (lower = better)" } }
        }
      }
    });
  }

  /* =========================================================
   * Helpers shared by the advanced charts
   * ======================================================= */
  function _residuals(model, experimental) {
    return experimental.y.map((y, i) => model.predicted[i] - y);
  }
  function _std(arr) {
    const m = arr.reduce((a, b) => a + b, 0) / arr.length;
    return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(arr.length - 1, 1));
  }
  function _mean(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length; }

  function _endpointsXY(x, y) {
    let yA = y[0], yB = y[0];
    let dA = Math.abs(x[0] - 1), dB = Math.abs(x[0] - 0);
    for (let i = 1; i < x.length; i++) {
      if (Math.abs(x[i] - 1) < dA) { dA = Math.abs(x[i] - 1); yA = y[i]; }
      if (Math.abs(x[i] - 0) < dB) { dB = Math.abs(x[i] - 0); yB = y[i]; }
    }
    return { y1: yA, y2: yB };
  }

  /* Simple-regression leverage approximation h_i used for Cook's Distance
   * and the leverage chart. For multi-parameter or nonlinear models this
   * is an approximation, not the exact hat-matrix diagonal.
   */
  function _leverage(x, p) {
    const n = x.length;
    const xbar = _mean(x);
    let sxx = 0;
    for (const xi of x) sxx += (xi - xbar) ** 2;
    if (sxx === 0) return new Array(n).fill(p / n);
    return x.map(xi => p / n + (xi - xbar) ** 2 / sxx);
  }

  /* =========================================================
   * 8. Excess curve  (y - ideal mixing baseline)
   * ======================================================= */
  function renderExcessCurve(canvasId, models, experimental, propertyLabel, axisLabel) {
    _destroy("excess");
    const ctx = document.getElementById(canvasId).getContext("2d");

    const { y1, y2 } = _endpointsXY(experimental.x, experimental.y);
    const yExp = experimental.y.map((yi, i) => yi - (experimental.x[i] * y1 + (1 - experimental.x[i]) * y2));

    const xMin = Math.min(...experimental.x), xMax = Math.max(...experimental.x);
    const xFine = Array.from({ length: 101 }, (_, i) => xMin + (xMax - xMin) * i / 100);

    const datasets = [{
      label: "Experimental excess",
      data: experimental.x.map((xi, i) => ({ x: xi, y: yExp[i] })),
      backgroundColor: TEXT, borderColor: TEXT, pointRadius: 4, showLine: false, type: "scatter"
    }];
    models.forEach((m, i) => {
      if (!m.predict) return;
      const yFine = m.predict(xFine);
      datasets.push({
        label: m.name,
        data: xFine.map((xi, k) => ({ x: xi, y: yFine[k] - (xi * y1 + (1 - xi) * y2) })),
        borderColor: palette[i % palette.length], backgroundColor: palette[i % palette.length],
        borderWidth: 2, pointRadius: 0, showLine: true, tension: 0.25, type: "line"
      });
    });

    charts.excess = new Chart(ctx, {
      type: "scatter", data: { datasets },
      options: { ...baseOpts, scales: {
        x: { ...baseOpts.scales.x, min: xMin, max: xMax,
             title: { ...baseOpts.scales.x.title, text: axisLabel || "Mole fraction x₁" } },
        y: { ...baseOpts.scales.y,
             title: { ...baseOpts.scales.y.title, text: `Excess ${propertyLabel}` } }
      } }
    });
  }

  /* =========================================================
   * 9. Cook's distance (approximate, per data point — best model)
   * ======================================================= */
  function renderCooksDistance(canvasId, models, experimental) {
    _destroy("cooks");
    const ctx = document.getElementById(canvasId).getContext("2d");
    const best = models[0];
    const r = _residuals(best, experimental);
    const n = r.length;
    const p = Math.max(best.parameters, 1);
    const h = _leverage(experimental.x, p);
    const MSE = r.reduce((a, b) => a + b * b, 0) / Math.max(n - p, 1);
    const D = r.map((ri, i) => {
      const denom = (1 - h[i]) * (1 - h[i]) * p * MSE;
      return denom > 0 ? (ri * ri * h[i]) / denom : 0;
    });
    const labels = experimental.x.map((xi, i) => `#${i + 1}`);
    const threshold = 4 / n;

    charts.cooks = new Chart(ctx, {
      type: "bar",
      data: { labels, datasets: [{
        label: `Cook's D — ${best.name}`,
        data: D,
        backgroundColor: D.map(d => d > threshold ? "rgba(220,38,38,0.8)" : "rgba(37,99,235,0.7)"),
        borderColor: D.map(d => d > threshold ? "#dc2626" : "#2563eb"),
        borderWidth: 1
      }, {
        label: `threshold (4/n = ${threshold.toFixed(3)})`,
        type: "line",
        data: D.map(() => threshold),
        borderColor: "#888888", borderDash: [4, 4], borderWidth: 1.5, pointRadius: 0
      }] },
      options: { ...baseOpts, scales: {
        x: { ...baseOpts.scales.x, title: { ...baseOpts.scales.x.title, text: "Data point" } },
        y: { ...baseOpts.scales.y, beginAtZero: true,
             title: { ...baseOpts.scales.y.title, text: "Cook's distance" } }
      } }
    });
  }

  /* =========================================================
   * 10. Leverage vs Standardized residual
   * ======================================================= */
  function renderLeverage(canvasId, models, experimental) {
    _destroy("leverage");
    const ctx = document.getElementById(canvasId).getContext("2d");
    const best = models[0];
    const r = _residuals(best, experimental);
    const n = r.length;
    const p = Math.max(best.parameters, 1);
    const h = _leverage(experimental.x, p);
    const MSE = r.reduce((a, b) => a + b * b, 0) / Math.max(n - p, 1);
    const sigma = Math.sqrt(MSE) || 1;
    const rStd = r.map((ri, i) => ri / (sigma * Math.sqrt(Math.max(1 - h[i], 1e-9))));

    charts.leverage = new Chart(ctx, {
      type: "scatter",
      data: { datasets: [{
        label: `${best.name}`,
        data: h.map((hi, i) => ({ x: hi, y: rStd[i] })),
        backgroundColor: "#2563eb", pointRadius: 4
      }, {
        label: "zero",
        data: [{ x: Math.min(...h), y: 0 }, { x: Math.max(...h), y: 0 }],
        borderColor: "#888888", borderDash: [4, 4], borderWidth: 1.5, pointRadius: 0, showLine: true, type: "line"
      }] },
      options: { ...baseOpts, scales: {
        x: { ...baseOpts.scales.x, title: { ...baseOpts.scales.x.title, text: "Leverage h" } },
        y: { ...baseOpts.scales.y, title: { ...baseOpts.scales.y.title, text: "Standardized residual" } }
      } }
    });
  }

  /* =========================================================
   * 11. Residual autocorrelation (ACF)
   * ======================================================= */
  function renderAutocorrelation(canvasId, models, experimental) {
    _destroy("acf");
    const ctx = document.getElementById(canvasId).getContext("2d");
    const best = models[0];
    const r = _residuals(best, experimental);
    const n = r.length;
    const m = _mean(r);
    const denom = r.reduce((a, v) => a + (v - m) * (v - m), 0) || 1;
    const maxLag = Math.min(20, Math.floor(n / 2));
    const labels = [], acf = [];
    for (let k = 0; k <= maxLag; k++) {
      let num = 0;
      for (let i = 0; i < n - k; i++) num += (r[i] - m) * (r[i + k] - m);
      labels.push(k);
      acf.push(num / denom);
    }
    const ci = 1.96 / Math.sqrt(n);

    charts.acf = new Chart(ctx, {
      type: "bar",
      data: { labels, datasets: [{
        label: `ACF — ${best.name}`,
        data: acf,
        backgroundColor: acf.map(v => Math.abs(v) > ci ? "rgba(220,38,38,0.75)" : "rgba(37,99,235,0.7)"),
        borderColor: acf.map(v => Math.abs(v) > ci ? "#dc2626" : "#2563eb"),
        borderWidth: 1
      }, {
        label: "+95% CI", type: "line",
        data: acf.map(() => ci),
        borderColor: "#888888", borderDash: [4, 4], borderWidth: 1.5, pointRadius: 0
      }, {
        label: "−95% CI", type: "line",
        data: acf.map(() => -ci),
        borderColor: "#888888", borderDash: [4, 4], borderWidth: 1.5, pointRadius: 0
      }] },
      options: { ...baseOpts, scales: {
        x: { ...baseOpts.scales.x, title: { ...baseOpts.scales.x.title, text: "Lag" } },
        y: { ...baseOpts.scales.y, min: -1, max: 1,
             title: { ...baseOpts.scales.y.title, text: "Autocorrelation" } }
      } }
    });
  }

  /* =========================================================
   * 12. Model Complexity vs Accuracy
   * ======================================================= */
  function renderComplexity(canvasId, models) {
    _destroy("complexity");
    const ctx = document.getElementById(canvasId).getContext("2d");
    charts.complexity = new Chart(ctx, {
      type: "scatter",
      data: { datasets: models.map((m, i) => ({
        label: m.name,
        data: [{ x: m.parameters, y: m.metrics.rmse }],
        backgroundColor: palette[i % palette.length],
        borderColor: palette[i % palette.length],
        pointRadius: 7, pointHoverRadius: 9
      })) },
      options: { ...baseOpts, plugins: { ...baseOpts.plugins,
        tooltip: { ...baseOpts.plugins.tooltip,
          callbacks: { label: ctx => `${ctx.dataset.label}: k=${ctx.parsed.x}, RMSE=${ctx.parsed.y.toExponential(3)}` } }
      }, scales: {
        x: { ...baseOpts.scales.x, title: { ...baseOpts.scales.x.title, text: "Number of parameters" } },
        y: { ...baseOpts.scales.y, type: "logarithmic",
             title: { ...baseOpts.scales.y.title, text: "RMSE (log scale)" } }
      } }
    });
  }

  /* =========================================================
   * 13. Radar (multi-metric ranking)
   * ======================================================= */
  function renderRadar(canvasId, models) {
    _destroy("radar");
    const ctx = document.getElementById(canvasId).getContext("2d");
    // Normalize: 1 = best, 0 = worst.
    const metricKeys = ["rmse", "mae", "aic", "bic", "r2"];
    const minimize  = { rmse: true, mae: true, aic: true, bic: true, r2: false };
    const norm = {};
    for (const key of metricKeys) {
      const vals = models.map(m => m.metrics[key]);
      const lo = Math.min(...vals), hi = Math.max(...vals);
      norm[key] = vals.map(v => {
        if (hi === lo) return 1;
        const u = (v - lo) / (hi - lo);
        return minimize[key] ? 1 - u : u;
      });
    }
    const datasets = models.map((m, i) => ({
      label: m.name,
      data: metricKeys.map((k, j) => norm[k][i]),
      borderColor: palette[i % palette.length],
      backgroundColor: palette[i % palette.length] + "33",
      borderWidth: 2, pointRadius: 3
    }));
    charts.radar = new Chart(ctx, {
      type: "radar",
      data: { labels: ["RMSE", "MAE", "AIC", "BIC", "R²"], datasets },
      options: { ...baseOpts, scales: {
        r: {
          beginAtZero: true, min: 0, max: 1,
          angleLines: { color: GRID },
          grid: { color: GRID },
          pointLabels: { color: TEXT, font: { family: "'IBM Plex Sans', sans-serif", size: 11 } },
          ticks: { display: false }
        }
      } }
    });
  }

  /* =========================================================
   * 14. Parameter Sensitivity — magnitude of each parameter
   * 15. Parameter Confidence (proxy: RMSE / sqrt(n) scale per param)
   * 16. Tornado — same data as Sensitivity, sorted by magnitude
   * ======================================================= */
  function _paramArrays(model) {
    const entries = [];
    for (const [k, v] of Object.entries(model.params || {})) {
      if (typeof v === "number" && Number.isFinite(v)) entries.push({ name: k, value: v });
    }
    return entries;
  }

  function renderSensitivity(canvasId, models) {
    _destroy("sensitivity");
    const ctx = document.getElementById(canvasId).getContext("2d");
    const best = models[0];
    const params = _paramArrays(best);
    charts.sensitivity = new Chart(ctx, {
      type: "bar",
      data: { labels: params.map(p => p.name), datasets: [{
        label: `${best.name} parameter magnitudes`,
        data: params.map(p => p.value),
        backgroundColor: "rgba(37,99,235,0.7)",
        borderColor: "#2563eb", borderWidth: 1
      }] },
      options: { ...baseOpts, scales: {
        x: { ...baseOpts.scales.x, title: { display: false } },
        y: { ...baseOpts.scales.y, title: { ...baseOpts.scales.y.title, text: "Parameter value" } }
      } }
    });
  }

  function renderCI(canvasId, models, experimental) {
    _destroy("ci");
    const ctx = document.getElementById(canvasId).getContext("2d");
    const best = models[0];
    const params = _paramArrays(best);
    const r = _residuals(best, experimental);
    const sigma = _std(r);
    // Proxy CI: parameter ± sigma / sqrt(n)  (rough scale, not a true CI)
    const se = sigma / Math.sqrt(experimental.x.length);

    charts.ci = new Chart(ctx, {
      type: "bar",
      data: { labels: params.map(p => p.name), datasets: [{
        label: `${best.name} parameter ± approx. scale (σ/√n)`,
        data: params.map(p => p.value),
        backgroundColor: "rgba(22,163,74,0.65)",
        borderColor: "#16a34a", borderWidth: 1,
        // Use Chart.js floatingBars trick: provide [low, high] arrays via errorBars-style overlay
      }] },
      options: {
        ...baseOpts,
        plugins: { ...baseOpts.plugins,
          tooltip: { ...baseOpts.plugins.tooltip,
            callbacks: { label: ctx => `${ctx.parsed.y.toExponential(3)} ± ${se.toExponential(2)}` } }
        },
        scales: {
          x: { ...baseOpts.scales.x, title: { display: false } },
          y: { ...baseOpts.scales.y, title: { ...baseOpts.scales.y.title, text: "Parameter value (± σ/√n proxy)" } }
        }
      }
    });
    // Draw error bars manually as a line overlay per param
    const meta = charts.ci.getDatasetMeta(0);
    if (meta?.data) {
      requestAnimationFrame(() => {
        const c = charts.ci;
        const ctx2 = c.ctx;
        ctx2.save();
        ctx2.strokeStyle = "#111";
        ctx2.lineWidth = 1.5;
        meta.data.forEach((bar, i) => {
          const v = params[i]?.value || 0;
          const yScale = c.scales.y;
          const yLo = yScale.getPixelForValue(v - se);
          const yHi = yScale.getPixelForValue(v + se);
          const x = bar.x;
          ctx2.beginPath();
          ctx2.moveTo(x, yLo); ctx2.lineTo(x, yHi);
          ctx2.moveTo(x - 5, yLo); ctx2.lineTo(x + 5, yLo);
          ctx2.moveTo(x - 5, yHi); ctx2.lineTo(x + 5, yHi);
          ctx2.stroke();
        });
        ctx2.restore();
      });
    }
  }

  function renderTornado(canvasId, models) {
    _destroy("tornado");
    const ctx = document.getElementById(canvasId).getContext("2d");
    const best = models[0];
    const params = _paramArrays(best).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    charts.tornado = new Chart(ctx, {
      type: "bar",
      data: { labels: params.map(p => p.name), datasets: [{
        label: `${best.name} |parameter| (sorted)`,
        data: params.map(p => Math.abs(p.value)),
        backgroundColor: params.map(p => p.value < 0 ? "rgba(220,38,38,0.7)" : "rgba(22,163,74,0.7)"),
        borderColor: params.map(p => p.value < 0 ? "#dc2626" : "#16a34a"),
        borderWidth: 1
      }] },
      options: {
        ...baseOpts, indexAxis: "y",
        scales: {
          x: { ...baseOpts.scales.x, title: { ...baseOpts.scales.x.title, text: "|parameter|" } },
          y: { ...baseOpts.scales.y, title: { display: false } }
        }
      }
    });
  }

  /* =========================================================
   * 17. Multi-Model Prediction Envelope
   * 18. Uncertainty Band (best model ± 1.96σ_resid)
   * ======================================================= */
  function renderEnvelope(canvasId, models, experimental, propertyLabel, axisLabel) {
    _destroy("envelope");
    const ctx = document.getElementById(canvasId).getContext("2d");
    const xMin = Math.min(...experimental.x), xMax = Math.max(...experimental.x);
    const xFine = Array.from({ length: 101 }, (_, i) => xMin + (xMax - xMin) * i / 100);

    const allPred = models.filter(m => m.predict).map(m => m.predict(xFine));
    const lo = xFine.map((_, i) => Math.min(...allPred.map(a => a[i])));
    const hi = xFine.map((_, i) => Math.max(...allPred.map(a => a[i])));
    const best = models[0];
    const ybest = best.predict ? best.predict(xFine) : new Array(xFine.length).fill(NaN);

    charts.envelope = new Chart(ctx, {
      type: "scatter",
      data: { datasets: [
        {
          label: "Envelope max",
          data: xFine.map((xi, i) => ({ x: xi, y: hi[i] })),
          borderColor: "rgba(37,99,235,0.4)",
          backgroundColor: "rgba(37,99,235,0.12)",
          fill: "+1", pointRadius: 0, showLine: true, type: "line", borderWidth: 1
        },
        {
          label: "Envelope min",
          data: xFine.map((xi, i) => ({ x: xi, y: lo[i] })),
          borderColor: "rgba(37,99,235,0.4)",
          backgroundColor: "rgba(37,99,235,0.12)",
          pointRadius: 0, showLine: true, type: "line", borderWidth: 1
        },
        {
          label: `Best: ${best.name}`,
          data: xFine.map((xi, i) => ({ x: xi, y: ybest[i] })),
          borderColor: "#111111", borderWidth: 2,
          pointRadius: 0, showLine: true, type: "line", tension: 0.25
        },
        {
          label: "Experimental",
          data: experimental.x.map((xi, i) => ({ x: xi, y: experimental.y[i] })),
          backgroundColor: TEXT, borderColor: TEXT, pointRadius: 4, showLine: false, type: "scatter"
        }
      ] },
      options: { ...baseOpts, scales: {
        x: { ...baseOpts.scales.x, min: xMin, max: xMax,
             title: { ...baseOpts.scales.x.title, text: axisLabel || "Mole fraction x₁" } },
        y: { ...baseOpts.scales.y,
             title: { ...baseOpts.scales.y.title, text: propertyLabel } }
      } }
    });
  }

  function renderUncertainty(canvasId, models, experimental, propertyLabel, axisLabel) {
    _destroy("uncertainty");
    const ctx = document.getElementById(canvasId).getContext("2d");
    const best = models[0];
    const r = _residuals(best, experimental);
    const sigma = _std(r);
    const band = 1.96 * sigma;
    const xMin = Math.min(...experimental.x), xMax = Math.max(...experimental.x);
    const xFine = Array.from({ length: 101 }, (_, i) => xMin + (xMax - xMin) * i / 100);
    const yhat = best.predict ? best.predict(xFine) : new Array(xFine.length).fill(NaN);

    charts.uncertainty = new Chart(ctx, {
      type: "scatter",
      data: { datasets: [
        {
          label: "Upper 95%",
          data: xFine.map((xi, i) => ({ x: xi, y: yhat[i] + band })),
          borderColor: "rgba(37,99,235,0.4)", backgroundColor: "rgba(37,99,235,0.10)",
          fill: "+1", pointRadius: 0, showLine: true, type: "line", borderWidth: 1
        },
        {
          label: "Lower 95%",
          data: xFine.map((xi, i) => ({ x: xi, y: yhat[i] - band })),
          borderColor: "rgba(37,99,235,0.4)", backgroundColor: "rgba(37,99,235,0.10)",
          pointRadius: 0, showLine: true, type: "line", borderWidth: 1
        },
        {
          label: `Best: ${best.name}`,
          data: xFine.map((xi, i) => ({ x: xi, y: yhat[i] })),
          borderColor: "#111111", borderWidth: 2, pointRadius: 0, showLine: true, type: "line", tension: 0.25
        },
        {
          label: "Experimental",
          data: experimental.x.map((xi, i) => ({ x: xi, y: experimental.y[i] })),
          backgroundColor: TEXT, borderColor: TEXT, pointRadius: 4, showLine: false, type: "scatter"
        }
      ] },
      options: { ...baseOpts, scales: {
        x: { ...baseOpts.scales.x, min: xMin, max: xMax,
             title: { ...baseOpts.scales.x.title, text: axisLabel || "Mole fraction x₁" } },
        y: { ...baseOpts.scales.y,
             title: { ...baseOpts.scales.y.title, text: `${propertyLabel} ± 1.96σ` } }
      } }
    });
  }

  /* =========================================================
   * Plotly-based charts (multivariate, heatmaps, 3D)
   * ======================================================= */
  const PLOTLY_BASE = {
    paper_bgcolor: "#ffffff",
    plot_bgcolor:  "#ffffff",
    font:   { family: "'IBM Plex Sans', sans-serif", color: TEXT, size: 11 },
    margin: { l: 70, r: 30, t: 30, b: 60 }
  };
  const PLOTLY_CONFIG = { responsive: true, displaylogo: false };

  /* 19. Model Error Heatmap (|residual| per model × data point) */
  function renderErrorHeatmap(divId, models, experimental) {
    if (!window.Plotly) return;
    const z = models.map(m => m.predicted.map((yp, i) => Math.abs(yp - experimental.y[i])));
    Plotly.newPlot(divId, [{
      z, type: "heatmap",
      x: experimental.x.map((_, i) => `#${i + 1}`),
      y: models.map(m => m.name),
      colorscale: "YlOrRd",
      colorbar: { title: "|residual|" }
    }], { ...PLOTLY_BASE,
      xaxis: { title: "Data point", color: TEXT_DIM },
      yaxis: { title: "Model", color: TEXT_DIM, automargin: true }
    }, PLOTLY_CONFIG);
  }

  /* 20. Correlation Matrix Heatmap (prediction correlation between models) */
  function renderCorrMatrix(divId, models) {
    if (!window.Plotly) return;
    const k = models.length;
    const C = Array.from({ length: k }, () => new Array(k).fill(0));
    for (let i = 0; i < k; i++) {
      for (let j = 0; j < k; j++) {
        const a = models[i].predicted, b = models[j].predicted;
        const ma = _mean(a), mb = _mean(b);
        let num = 0, da = 0, db = 0;
        for (let t = 0; t < a.length; t++) {
          num += (a[t] - ma) * (b[t] - mb);
          da  += (a[t] - ma) ** 2;
          db  += (b[t] - mb) ** 2;
        }
        C[i][j] = (da > 0 && db > 0) ? num / Math.sqrt(da * db) : (i === j ? 1 : 0);
      }
    }
    Plotly.newPlot(divId, [{
      z: C, type: "heatmap",
      x: models.map(m => m.name), y: models.map(m => m.name),
      colorscale: "RdBu", reversescale: true, zmin: -1, zmax: 1,
      colorbar: { title: "r" }
    }], { ...PLOTLY_BASE,
      xaxis: { tickangle: -30, automargin: true, color: TEXT_DIM },
      yaxis: { automargin: true, color: TEXT_DIM }
    }, PLOTLY_CONFIG);
  }

  /* 21. 3D Surface — Z = predicted value over (composition, model index) */
  function render3DSurface(divId, models, experimental, propertyLabel, axisLabel) {
    if (!window.Plotly) return;
    const xMin = Math.min(...experimental.x), xMax = Math.max(...experimental.x);
    const xFine = Array.from({ length: 51 }, (_, i) => xMin + (xMax - xMin) * i / 50);
    const z = models.filter(m => m.predict).map(m => m.predict(xFine));
    const yLabels = models.filter(m => m.predict).map(m => m.name);
    Plotly.newPlot(divId, [{
      z, x: xFine, y: yLabels,
      type: "surface", colorscale: "Viridis",
      colorbar: { title: propertyLabel }
    }], { ...PLOTLY_BASE, scene: {
      xaxis: { title: axisLabel || "x₁" },
      yaxis: { title: "Model" },
      zaxis: { title: propertyLabel }
    } }, PLOTLY_CONFIG);
  }

  /* 22. Contour Map — same data, projected */
  function renderContour(divId, models, experimental, propertyLabel, axisLabel) {
    if (!window.Plotly) return;
    const xMin = Math.min(...experimental.x), xMax = Math.max(...experimental.x);
    const xFine = Array.from({ length: 81 }, (_, i) => xMin + (xMax - xMin) * i / 80);
    const z = models.filter(m => m.predict).map(m => m.predict(xFine));
    const yLabels = models.filter(m => m.predict).map(m => m.name);
    Plotly.newPlot(divId, [{
      z, x: xFine, y: yLabels,
      type: "contour", colorscale: "Viridis",
      contours: { coloring: "heatmap" },
      colorbar: { title: propertyLabel }
    }], { ...PLOTLY_BASE,
      xaxis: { title: axisLabel || "x₁", color: TEXT_DIM },
      yaxis: { title: "Model", color: TEXT_DIM, automargin: true }
    }, PLOTLY_CONFIG);
  }

  /* 23. PCA of model prediction vectors
   *     Each model contributes a length-n prediction vector;
   *     we PCA the (n × k) prediction matrix and project each model
   *     (a column) onto the top two principal components.
   */
  function _powerIteration(A, iter = 200) {
    const n = A.length;
    let v = new Array(n).fill(0).map((_, i) => Math.random() - 0.5);
    let norm = Math.sqrt(v.reduce((a, b) => a + b * b, 0));
    v = v.map(x => x / norm);
    let lambda = 0;
    for (let t = 0; t < iter; t++) {
      const Av = new Array(n).fill(0);
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) Av[i] += A[i][j] * v[j];
      norm = Math.sqrt(Av.reduce((a, b) => a + b * b, 0)) || 1;
      v = Av.map(x => x / norm);
      lambda = norm;
    }
    return { vector: v, value: lambda };
  }

  function renderPCA(divId, models) {
    if (!window.Plotly) return;
    const validModels = models.filter(m => Array.isArray(m.predicted));
    const k = validModels.length;
    if (k < 2) return;
    const n = validModels[0].predicted.length;
    // Build column-centered matrix M (n × k)
    const colMeans = new Array(k).fill(0);
    for (let j = 0; j < k; j++) {
      let s = 0;
      for (let i = 0; i < n; i++) s += validModels[j].predicted[i];
      colMeans[j] = s / n;
    }
    const M = [];
    for (let i = 0; i < n; i++) {
      const row = new Array(k);
      for (let j = 0; j < k; j++) row[j] = validModels[j].predicted[i] - colMeans[j];
      M.push(row);
    }
    // Covariance C = MᵀM / (n-1)  (k × k)
    const C = Array.from({ length: k }, () => new Array(k).fill(0));
    for (let a = 0; a < k; a++) {
      for (let b = 0; b < k; b++) {
        let s = 0;
        for (let i = 0; i < n; i++) s += M[i][a] * M[i][b];
        C[a][b] = s / Math.max(n - 1, 1);
      }
    }
    // PC1
    const pc1 = _powerIteration(C);
    // Deflate, then PC2
    const C2 = C.map((row, i) => row.map((v, j) => v - pc1.value * pc1.vector[i] * pc1.vector[j]));
    const pc2 = _powerIteration(C2);
    const xy = validModels.map((_, j) => ({ x: pc1.vector[j], y: pc2.vector[j] }));

    Plotly.newPlot(divId, [{
      x: xy.map(p => p.x), y: xy.map(p => p.y),
      mode: "markers+text", type: "scatter",
      text: validModels.map(m => m.name),
      textposition: "top center",
      marker: { size: 10, color: validModels.map((_, i) => i), colorscale: "Viridis" }
    }], { ...PLOTLY_BASE,
      xaxis: { title: "PC1", color: TEXT_DIM, zerolinecolor: "#ddd" },
      yaxis: { title: "PC2", color: TEXT_DIM, zerolinecolor: "#ddd" }
    }, PLOTLY_CONFIG);
  }

  /* 24. Parallel Coordinates — model metrics as parallel axes */
  function renderParallelCoords(divId, models) {
    if (!window.Plotly) return;
    const data = [{
      type: "parcoords",
      line: { color: models.map((_, i) => i), colorscale: "Viridis", showscale: false },
      dimensions: [
        { label: "params", values: models.map(m => m.parameters) },
        { label: "RMSE",   values: models.map(m => m.metrics.rmse) },
        { label: "MAE",    values: models.map(m => m.metrics.mae) },
        { label: "R²",     values: models.map(m => m.metrics.r2) },
        { label: "AIC",    values: models.map(m => m.metrics.aic) },
        { label: "BIC",    values: models.map(m => m.metrics.bic) },
        { label: "rank",   values: models.map(m => m.rank) }
      ]
    }];
    Plotly.newPlot(divId, data, { ...PLOTLY_BASE, margin: { l: 80, r: 60, t: 30, b: 30 } }, PLOTLY_CONFIG);
  }

  /* 25. Phase Diagram (T–x style) — uses Antoine + the best model
   *     as a stand-in. A full VLE solver is out of scope; this
   *     plots property vs composition with a "vapor-line proxy"
   *     equal to the prediction itself.
   */
  function renderPhaseDiagram(divId, models, experimental, propertyLabel, axisLabel) {
    if (!window.Plotly) return;
    const best = models[0];
    const xMin = Math.min(...experimental.x), xMax = Math.max(...experimental.x);
    const xFine = Array.from({ length: 81 }, (_, i) => xMin + (xMax - xMin) * i / 80);
    const yLine = best.predict ? best.predict(xFine) : [];
    Plotly.newPlot(divId, [
      {
        x: xFine, y: yLine, name: `Liquid (${best.name})`,
        mode: "lines", type: "scatter", line: { color: "#2563eb", width: 2 }
      },
      {
        x: xFine, y: yLine.map(v => v * 1.10), name: "Vapor (proxy ×1.10)",
        mode: "lines", type: "scatter", line: { color: "#dc2626", width: 2, dash: "dash" }
      },
      {
        x: experimental.x, y: experimental.y, name: "Experimental",
        mode: "markers", type: "scatter", marker: { color: "#111", size: 8 }
      }
    ], { ...PLOTLY_BASE,
      xaxis: { title: axisLabel || "x₁", color: TEXT_DIM },
      yaxis: { title: propertyLabel, color: TEXT_DIM },
      annotations: [{
        xref: "paper", yref: "paper", x: 0.5, y: 1.05, showarrow: false,
        text: "Approximate T–x style plot (full VLE solver not implemented)",
        font: { color: TEXT_DIM, size: 11 }
      }]
    }, PLOTLY_CONFIG);
  }

  function saveChartPNG(canvasId, filename) {
    const canvas = document.getElementById(canvasId);
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "chart.png";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  return {
    renderScatter,
    renderComposition,
    renderResidual,
    renderHistogram,
    renderQQ,
    renderBars,
    renderAICBIC,
    renderExcessCurve,
    renderCooksDistance,
    renderLeverage,
    renderAutocorrelation,
    renderComplexity,
    renderRadar,
    renderSensitivity,
    renderCI,
    renderTornado,
    renderEnvelope,
    renderUncertainty,
    renderErrorHeatmap,
    renderCorrMatrix,
    render3DSurface,
    renderContour,
    renderPCA,
    renderParallelCoords,
    renderPhaseDiagram,
    saveChartPNG
  };
})();

window.Charts = Charts;
