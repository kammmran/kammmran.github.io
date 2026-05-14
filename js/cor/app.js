/* =====================================================================
 * app.js
 * Top-level orchestration: wires UI events → DataManager → correlations
 * → statistics → charts.
 * =================================================================== */

(function () {
  "use strict";

  const state = {
    uploadedData: null,
    lastResults: null,
    lastDataset: null,
    propertyLabel: ""
  };

  const AXIS_LABELS = {
    composition: "Mole fraction x₁",
    temperature: "Temperature T (°C)",
    density:     "Density ρ (g/cm³)",
    api:         "API Gravity (°API)"
  };

  const PROPERTY_LABELS = {
    density:                "ρ (g/cm³)",
    viscosity:              "η (mPa·s)",
    excessMolarVolume:      "Vᴱ (cm³/mol)",
    activityCoefficient:    "γ",
    vaporPressure:          "P (kPa)",
    refractiveIndex:        "n",
    surfaceTension:         "σ (mN/m)",
    electricalConductivity: "κ (mS/cm)",
    speedOfSound:           "u (m/s)",
    solubility:             "S (mol/L)",
    heatCapacity:           "Cₚ (J/mol·K)",
    thermalConductivity:    "k (W/m·K)",
    apiGravity:             "°API",
    specificGravity:        "SG",
    molecularWeight:        "MW (g/mol)",
    compressibilityZ:       "Z",
    watsonK:                "Kw"
  };

  function init() {
    // Seed two default rows (water/ethanol 0.5/0.5)
    UI.buildCompositionRow({ name: "Water",   x: 0.5 });
    UI.buildCompositionRow({ name: "Ethanol", x: 0.5 });
    UI.buildModelCards();
    UI.bindTabs();
    UI.startClock();

    document.getElementById("addRowBtn").addEventListener("click", () => UI.buildCompositionRow());
    document.getElementById("runBtn").addEventListener("click", runAnalysis);

    // Petroleum mode toggle + crude sample presets
    document.querySelectorAll(".mode-btn").forEach(btn => {
      btn.addEventListener("click", () => setMode(btn.dataset.mode));
    });
    populatePresets();
    document.getElementById("loadPresetBtn").addEventListener("click", loadSelectedPreset);
    document.getElementById("runEstimatorsBtn").addEventListener("click", runEstimators);

    populateDatasetTypes();
    document.getElementById("datasetType").addEventListener("change", onDatasetTypeChange);
    document.getElementById("uploadBtn").addEventListener("click", () => document.getElementById("datasetFile").click());
    document.getElementById("datasetFile").addEventListener("change", handleUpload);

    document.getElementById("exportCSV").addEventListener("click", () => exportResults("csv"));
    document.getElementById("exportJSON").addEventListener("click", () => exportResults("json"));
    document.getElementById("exportPNG").addEventListener("click", () => {
      const visible = document.querySelector(".chart-wrap:not(.hidden) canvas");
      if (visible) Charts.saveChartPNG(visible.id, `${visible.id}.png`);
    });

    // R hotkey
    document.addEventListener("keydown", (e) => {
      const tag = (e.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.key.toLowerCase() === "r") runAnalysis();
    });
  }

  async function handleUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const ds = await DataManager.parseUpload(file);
      state.uploadedData = ds;
      document.getElementById("srcUpload").checked = true;
      await UI.log(`> uploaded ${file.name} (${ds.x.length} points)`, "ok");
    } catch (err) {
      await UI.log(`! upload failed: ${err.message}`, "err");
    }
  }

  async function runAnalysis() {
    const runBtn = document.getElementById("runBtn");
    if (runBtn.disabled) return;
    runBtn.disabled = true;
    UI.setStatus("Running…");
    UI.setProgress(5);

    try {
      const composition = UI.getComposition();
      const sum = composition.reduce((a, c) => a + (Number.isFinite(c.x) ? c.x : 0), 0);

      if (composition.length < 2) {
        await UI.log("! need at least 2 components", "err");
        bailOut(); return;
      }
      if (Math.abs(sum - 1) > 1e-3) {
        await UI.log(`! mole fractions must sum to 1.0 (got ${sum.toFixed(4)})`, "err");
        bailOut(); return;
      }
      const selectedIds = UI.getSelectedModels();
      if (selectedIds.length === 0) {
        await UI.log("! select at least one correlation model", "err");
        bailOut(); return;
      }

      const property = document.getElementById("propertySelect").value;
      const variable = document.getElementById("variableSelect")?.value || "composition";
      state.propertyLabel = PROPERTY_LABELS[property] ?? "";
      state.variable = variable;
      state.axisLabel = AXIS_LABELS[variable] || "x₁";

      await UI.log(`> initializing analysis for ${composition.map(c => c.name).join(" + ")}`, "accent");

      // -------- 1. fetch compound data --------
      const sources = {
        pubchem: document.getElementById("srcPubChem").checked,
        upload:  document.getElementById("srcUpload").checked,
        local:   document.getElementById("srcLocal").checked
      };
      UI.setProgress(15);
      await UI.log("→ loading compound data…", "info");
      const fetchedCompounds = [];
      for (const c of composition) {
        let info = null;
        if (sources.local) info = DataManager.localDB[c.name.trim().toLowerCase()] ? { ...DataManager.localDB[c.name.trim().toLowerCase()], source: "local" } : null;
        if (!info && sources.pubchem) info = await DataManager.fetchCompound(c.name);
        if (info) {
          fetchedCompounds.push(info);
          await UI.log(`  · ${c.name} → ${info.formula ?? "—"}  MW=${info.mw ?? "—"}  [${info.source}]`, "dim");
        } else {
          await UI.log(`  · ${c.name} → no metadata available`, "warn");
        }
      }
      UI.renderCompoundMeta(fetchedCompounds);

      // -------- 2. get dataset (experimental or synthetic) --------
      UI.setProgress(35);
      await UI.log("→ acquiring property dataset…", "info");
      const dataset = await DataManager.getDataset({
        sources,
        property,
        variable,
        components: composition.map(c => c.name),
        uploadedData: sources.upload ? state.uploadedData : null
      });
      state.lastDataset = dataset;
      await UI.log(`  · dataset: ${dataset.x.length} points  source=${dataset.source}`, "dim");

      if (dataset.source === "synthetic") {
        await UI.log("  · note: no experimental upload — using synthetic reference data", "warn");
      }

      // -------- 3. run correlations --------
      UI.setProgress(55);
      await UI.log("→ running correlations…", "info");
      const models = [];
      for (const id of selectedIds) {
        const def = CorrelationRegistry.get(id);
        if (!def) continue;
        try {
          const fitted = def.fit(dataset.x, dataset.y);
          const predicted = fitted.predict(dataset.x);
          models.push({
            id: def.id,
            name: def.name,
            equation: def.equation,
            parameters: def.parameters,
            params: fitted.params,
            predict: fitted.predict,
            predicted
          });
          await UI.log(`  · ${def.name}: fit ok  (${def.parameters} params)`, "dim");
        } catch (e) {
          await UI.log(`  · ${def.name}: fit failed — ${e.message}`, "err");
        }
      }

      // -------- 4. statistics --------
      UI.setProgress(75);
      await UI.log("→ computing statistics…", "info");
      for (const m of models) {
        m.metrics = Statistics.computeAll(dataset.y, m.predicted, m.parameters);
      }
      const ranked = Statistics.rank(models);
      state.lastResults = ranked;

      // -------- 5. render --------
      UI.setProgress(90);
      await UI.log("→ rendering visualization…", "info");
      UI.renderResults(ranked);
      UI.renderBestModel(ranked[0]);
      // Core
      Charts.renderScatter("scatterChart",          ranked, dataset, state.propertyLabel);
      Charts.renderComposition("compositionChart",  ranked, dataset, state.propertyLabel, state.axisLabel);
      Charts.renderExcessCurve("excessChart",       ranked, dataset, state.propertyLabel, state.axisLabel);
      Charts.renderResidual("residualChart",        ranked, dataset, state.propertyLabel, state.axisLabel);
      Charts.renderHistogram("histogramChart",      ranked, dataset);
      Charts.renderBars("barsChart",                ranked);
      Charts.renderAICBIC("aicbicChart",            ranked);
      // Diagnostics
      Charts.renderQQ("qqChart",                    ranked, dataset);
      Charts.renderCooksDistance("cooksChart",      ranked, dataset);
      Charts.renderLeverage("leverageChart",        ranked, dataset);
      Charts.renderAutocorrelation("acfChart",      ranked, dataset);
      // Advanced
      Charts.renderComplexity("complexityChart",    ranked);
      Charts.renderRadar("radarChart",              ranked);
      Charts.renderSensitivity("sensitivityChart",  ranked);
      Charts.renderCI("ciChart",                    ranked, dataset);
      Charts.renderTornado("tornadoChart",          ranked);
      Charts.renderEnvelope("envelopeChart",        ranked, dataset, state.propertyLabel, state.axisLabel);
      Charts.renderUncertainty("uncertaintyChart",  ranked, dataset, state.propertyLabel, state.axisLabel);
      // Multivariate (Plotly)
      Charts.renderErrorHeatmap("errorHeatmapChart",ranked, dataset);
      Charts.renderCorrMatrix("corrMatrixChart",    ranked);
      Charts.render3DSurface("surface3dChart",      ranked, dataset, state.propertyLabel, state.axisLabel);
      Charts.renderContour("contourChart",          ranked, dataset, state.propertyLabel, state.axisLabel);
      Charts.renderPCA("pcaChart",                  ranked);
      Charts.renderParallelCoords("parcoordsChart", ranked);
      Charts.renderPhaseDiagram("phaseChart",       ranked, dataset, state.propertyLabel, state.axisLabel);

      UI.setProgress(100);
      await UI.log(`✓ best model: ${ranked[0].name} (R²=${ranked[0].metrics.r2.toFixed(4)}, RMSE=${ranked[0].metrics.rmse.toExponential(3)})`, "ok");
      UI.setStatus("Analysis Complete");
    } catch (err) {
      console.error(err);
      await UI.log(`! unexpected error: ${err.message}`, "err");
      UI.setStatus("Error");
    } finally {
      runBtn.disabled = false;
      setTimeout(() => UI.setProgress(0), 1400);
    }
  }

  /* ----------------------- Mode + presets ----------------------- */
  function setMode(mode) {
    document.querySelectorAll(".mode-btn").forEach(b => {
      const on = b.dataset.mode === mode;
      b.classList.toggle("active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    document.getElementById("presetRow").hidden     = (mode !== "petroleum");
    document.getElementById("estimatorPanel").hidden = (mode !== "petroleum");

    if (mode === "petroleum") {
      const sel = document.getElementById("propertySelect");
      if (sel.querySelector('option[value="apiGravity"]')) sel.value = "apiGravity";
      const dt = document.getElementById("datasetType");
      if (dt && dt.querySelector('option[value="petroleum"]')) dt.value = "petroleum";
    } else {
      const dt = document.getElementById("datasetType");
      if (dt && dt.value === "petroleum") dt.value = "all";
    }
  }

  function runEstimators() {
    const composition = UI.getComposition();
    const enriched = composition.map(c => {
      const info = DataManager.localDB[c.name.trim().toLowerCase()];
      return { ...c, bp: info?.bp ?? null, density: info?.density ?? null };
    });

    const usable = enriched.filter(c => c.bp != null && c.density != null);
    if (!usable.length) {
      UI.renderEstimatorResults({ error: "No components have both boiling point and density in the local DB. Try loading a crude preset." });
      return;
    }

    const result = Estimators.estimateMixture(usable);
    UI.renderEstimatorResults(result);
  }

  function populateDatasetTypes() {
    const sel = document.getElementById("datasetType");
    if (!sel) return;
    sel.innerHTML = "";
    for (const [key, def] of Object.entries(DataManager.compoundCategories || {})) {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = def.label;
      sel.appendChild(opt);
    }
  }

  function onDatasetTypeChange() {
    // Switching category just changes the suggestion source; existing
    // rows are left as-is. Clear name fields that would no longer match
    // the new category and let the user re-pick from suggestions.
    const cat = document.getElementById("datasetType").value;
    if (cat === "all") return;
    document.querySelectorAll("#compositionTable .compound-name").forEach(inp => {
      const v = inp.value.trim();
      if (!v) return;
      const c = DataManager.findCompound(v);
      if (!c || !(c.families || []).includes(cat)) {
        inp.classList.add("invalid");
        inp.value = "";
        inp.classList.remove("invalid");
      }
    });
    updateSumIfPresent();
  }

  function updateSumIfPresent() {
    if (typeof UI.updateSumIndicator === "function") UI.updateSumIndicator();
  }

  function populatePresets() {
    const sel = document.getElementById("presetSelect");
    if (!sel) return;
    const presets = DataManager.petroleumPresets || {};
    for (const [key, p] of Object.entries(presets)) {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = p.label;
      sel.appendChild(opt);
    }
  }

  function loadSelectedPreset() {
    const key = document.getElementById("presetSelect").value;
    if (!key) return;
    const preset = DataManager.petroleumPresets?.[key];
    if (!preset) return;

    // Clear existing rows
    document.querySelectorAll("#compositionTable .composition-row:not(.composition-head)")
      .forEach(r => r.remove());

    // Add a row per preset component
    preset.components.forEach(c => UI.buildCompositionRow({ name: c.name, x: c.x }));
  }

  function bailOut() {
    document.getElementById("runBtn").disabled = false;
    UI.setStatus("System Ready");
    UI.setProgress(0);
  }

  /* ----------------------- Exports ----------------------- */
  function exportResults(format) {
    if (!state.lastResults || !state.lastDataset) {
      UI.log("! no results to export — run an analysis first", "warn");
      return;
    }
    const payload = {
      generatedAt: new Date().toISOString(),
      dataset: state.lastDataset,
      results: state.lastResults.map(m => ({
        name: m.name,
        rank: m.rank,
        parameters: m.parameters,
        params: m.params,
        metrics: m.metrics,
        equation: m.equation
      }))
    };

    if (format === "json") {
      download(JSON.stringify(payload, null, 2), "results.json", "application/json");
      UI.log("> exported results.json", "ok");
      return;
    }

    // CSV
    const lines = [];
    lines.push("# Mixture Correlation Analyzer — results");
    lines.push(`# generated: ${payload.generatedAt}`);
    lines.push("name,rank,parameters,rmse,mae,r2,aic,bic,equation");
    for (const m of payload.results) {
      lines.push([
        m.name, m.rank, m.parameters,
        m.metrics.rmse, m.metrics.mae, m.metrics.r2,
        m.metrics.aic, m.metrics.bic,
        `"${m.equation}"`
      ].join(","));
    }
    lines.push("");
    lines.push("# dataset");
    lines.push("x,y");
    for (let i = 0; i < state.lastDataset.x.length; i++) {
      lines.push(`${state.lastDataset.x[i]},${state.lastDataset.y[i]}`);
    }
    download(lines.join("\n"), "results.csv", "text/csv");
    UI.log("> exported results.csv", "ok");
  }

  function download(content, name, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
