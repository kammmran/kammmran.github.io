/* =====================================================================
 * ui.js
 * DOM construction, event wiring, console animations.
 * Pure rendering/state helpers — no thermodynamics here.
 * =================================================================== */

const UI = (() => {

  /* ------------------- Composition rows + autocomplete ------------------- */
  function buildCompositionRow(values = { name: "", x: "" }) {
    const tableEl = document.getElementById("compositionTable");
    const row = document.createElement("div");
    row.className = "composition-row";
    row.innerHTML = `
      <div class="compound-input-wrap">
        <input type="text" class="compound-name" placeholder="Start typing…" value="${values.name}" autocomplete="off" />
        <div class="ac-dropdown hidden"></div>
        <div class="ac-error" hidden>Compound not in database</div>
      </div>
      <input type="number" class="mole-fraction" step="0.01" min="0" max="1" placeholder="0.50" value="${values.x}" />
      <button class="del-btn" title="Remove component">×</button>
    `;
    row.querySelector(".del-btn").addEventListener("click", () => {
      row.remove();
      updateSumIndicator();
    });
    row.querySelector(".mole-fraction").addEventListener("input", updateSumIndicator);

    const nameInput = row.querySelector(".compound-name");
    attachAutocomplete(nameInput, row);

    tableEl.appendChild(row);
    updateSumIndicator();
    return row;
  }

  function attachAutocomplete(input, row) {
    const dropdown = row.querySelector(".ac-dropdown");
    const errorEl  = row.querySelector(".ac-error");
    let focusedIdx = -1;
    let currentMatches = [];

    function getCategory() {
      return document.getElementById("datasetType")?.value || "all";
    }

    function render() {
      currentMatches = DataManager.suggestCompounds(input.value, getCategory(), 14);
      if (!currentMatches.length) {
        dropdown.classList.add("hidden");
        return;
      }
      dropdown.innerHTML = currentMatches.map((c, i) => `
        <div class="ac-item ${i === focusedIdx ? 'focused' : ''}" data-idx="${i}">
          <span class="ac-name">${c.name}</span>
          <span class="ac-meta">${c.formula || ''}${c.families?.[0] ? ' · ' + c.families[0] : ''}</span>
        </div>
      `).join("");
      dropdown.classList.remove("hidden");
      dropdown.querySelectorAll(".ac-item").forEach((el) => {
        // mousedown fires before the input's blur, so the click registers
        el.addEventListener("mousedown", (e) => {
          e.preventDefault();
          const idx = +el.dataset.idx;
          pickCompound(currentMatches[idx]);
        });
      });
    }

    function pickCompound(c) {
      input.value = c.name;
      dropdown.classList.add("hidden");
      errorEl.hidden = true;
      input.classList.remove("invalid");
      updateSumIndicator();
    }

    function validate() {
      const v = input.value.trim();
      if (!v) { errorEl.hidden = true; input.classList.remove("invalid"); return true; }
      const c = DataManager.findCompound(v);
      if (c) {
        input.value = c.name; // normalize to canonical name
        errorEl.hidden = true;
        input.classList.remove("invalid");
        return true;
      }
      input.classList.add("invalid");
      errorEl.hidden = false;
      return false;
    }

    input.addEventListener("input",  () => { focusedIdx = -1; render(); errorEl.hidden = true; input.classList.remove("invalid"); });
    input.addEventListener("focus",  render);
    input.addEventListener("blur",   () => {
      // Delay so click on a dropdown item registers first.
      setTimeout(() => {
        dropdown.classList.add("hidden");
        validate();
      }, 150);
    });
    input.addEventListener("keydown", (e) => {
      if (dropdown.classList.contains("hidden")) {
        if (e.key === "ArrowDown") { focusedIdx = -1; render(); }
        return;
      }
      const items = dropdown.querySelectorAll(".ac-item");
      if (e.key === "ArrowDown") {
        e.preventDefault();
        focusedIdx = Math.min(focusedIdx + 1, items.length - 1);
        items.forEach((el, i) => el.classList.toggle("focused", i === focusedIdx));
        items[focusedIdx]?.scrollIntoView({ block: "nearest" });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        focusedIdx = Math.max(focusedIdx - 1, 0);
        items.forEach((el, i) => el.classList.toggle("focused", i === focusedIdx));
        items[focusedIdx]?.scrollIntoView({ block: "nearest" });
      } else if (e.key === "Enter") {
        if (focusedIdx >= 0 && focusedIdx < currentMatches.length) {
          e.preventDefault();
          pickCompound(currentMatches[focusedIdx]);
        }
      } else if (e.key === "Escape") {
        dropdown.classList.add("hidden");
      }
    });
  }

  function getComposition() {
    return [...document.querySelectorAll("#compositionTable .composition-row:not(.composition-head)")]
      .map(r => ({
        name: r.querySelector(".compound-name").value.trim(),
        x: parseFloat(r.querySelector(".mole-fraction").value)
      }))
      .filter(c => c.name.length);
  }

  function updateSumIndicator() {
    const comp = getComposition();
    const sum = comp.reduce((a, c) => a + (Number.isFinite(c.x) ? c.x : 0), 0);
    const el = document.getElementById("sumIndicator");
    el.textContent = `Σ x = ${sum.toFixed(3)}`;
    el.classList.remove("ok", "bad");
    if (comp.length === 0) return;
    if (Math.abs(sum - 1) < 1e-3) el.classList.add("ok");
    else el.classList.add("bad");
  }

  /* ------------------- Model cards ------------------- */
  const CATEGORY_LABELS = {
    general:        "General",
    excess:         "Mixture / Excess",
    viscosity:      "Viscosity",
    petroleum:      "Petroleum / Mixing Rules",
    petroleum_t:    "Petroleum — vs Temperature",
    petroleum_rho:  "Petroleum — vs Density",
    vapor:          "Vapor Pressure"
  };
  const CATEGORY_ORDER = ["general", "excess", "viscosity", "petroleum",
                          "petroleum_t", "petroleum_rho", "vapor"];

  function buildModelCards() {
    const grid = document.getElementById("modelGrid");
    grid.innerHTML = "";

    const byCategory = {};
    for (const model of CorrelationRegistry.list()) {
      const cat = model.category || "general";
      (byCategory[cat] ||= []).push(model);
    }

    for (const cat of CATEGORY_ORDER) {
      const models = byCategory[cat];
      if (!models?.length) continue;

      const header = document.createElement("div");
      header.className = "model-cat-header";
      header.textContent = CATEGORY_LABELS[cat] || cat;
      grid.appendChild(header);

      const groupGrid = document.createElement("div");
      groupGrid.className = "model-cat-grid";
      grid.appendChild(groupGrid);

      for (const model of models) {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "model-card";
        card.dataset.modelId = model.id;
        card.innerHTML = `
          <div class="mc-head">
            <span class="mc-name">${model.name}</span>
            <span class="mc-pill">${model.parameters} param</span>
          </div>
          <div class="mc-eq">${model.equation}</div>
        `;
        card.addEventListener("click", () => card.classList.toggle("active"));
        groupGrid.appendChild(card);
      }
    }

    // sensible defaults — one from each main category
    ["linear", "poly3", "rk4", "jouyban_acree"].forEach(id => {
      const card = grid.querySelector(`[data-model-id="${id}"]`);
      if (card) card.classList.add("active");
    });
  }

  function getSelectedModels() {
    return [...document.querySelectorAll("#modelGrid .model-card.active")]
      .map(c => c.dataset.modelId);
  }

  /* ------------------- Compound metadata side panel ------------------- */
  function renderCompoundMeta(compounds) {
    const body = document.querySelector("#compoundMeta .meta-body");
    const countEl = document.getElementById("metaCount");
    if (countEl) countEl.textContent = compounds.length;
    if (!body) return;
    body.innerHTML = "";
    if (!compounds.length) {
      body.innerHTML = `<div class="meta-empty">No data fetched yet.</div>`;
      return;
    }
    for (const c of compounds) {
      const card = document.createElement("div");
      card.className = "meta-card";
      card.innerHTML = `
        <div class="mc-name-h">${c.name ?? "?"} <span style="float:right; font-size:10px; color:var(--text-faint)">[${c.source ?? "?"}]</span></div>
        <div class="mk">Formula</div>    <div class="mv">${c.formula ?? "—"}</div>
        <div class="mk">MW (g/mol)</div>  <div class="mv">${c.mw ?? "—"}</div>
        <div class="mk">Density</div>    <div class="mv">${c.density ?? "—"}</div>
        <div class="mk">Boiling Pt</div>  <div class="mv">${c.bp ?? "—"}</div>
        <div class="mk">SMILES</div>      <div class="mv" style="word-break:break-all">${c.smiles ?? "—"}</div>
        ${c.cid ? `<div class="mk">PubChem CID</div><div class="mv">${c.cid}</div>` : ""}
      `;
      body.appendChild(card);
    }
  }

  /* ------------------- Results table ------------------- */
  function renderResults(ranked) {
    const tbody = document.querySelector("#resultsTable tbody");
    tbody.innerHTML = "";
    ranked.forEach((m, i) => {
      const tr = document.createElement("tr");
      if (i === 0) tr.classList.add("best");
      tr.style.animation = `fadeIn 0.3s ease ${i * 80}ms both`;
      tr.innerHTML = `
        <td>${m.name}</td>
        <td>${m.metrics.rmse.toExponential(3)}</td>
        <td>${m.metrics.mae.toExponential(3)}</td>
        <td>${m.metrics.r2.toFixed(4)}</td>
        <td>${m.metrics.aic.toFixed(2)}</td>
        <td>${m.metrics.bic.toFixed(2)}</td>
        <td><span class="rank-badge r${m.rank <= 3 ? m.rank : ''}">${m.rank}</span></td>
      `;
      tbody.appendChild(tr);
    });
    if (ranked.length === 0) {
      tbody.innerHTML = `<tr class="empty"><td colspan="7">Run an analysis to populate results.</td></tr>`;
    }
  }

  /* ------------------- Petroleum estimator results ------------------- */
  function renderEstimatorResults(result) {
    const box = document.getElementById("estimatorResults");
    if (!box) return;
    if (result.error) {
      box.innerHTML = `<div class="estimator-error">${result.error}</div>`;
      return;
    }
    let html = `<div class="estimator-table-wrap"><table class="estimator-table">
      <thead><tr>
        <th>Component</th><th>Tb (K)</th><th>SG</th><th>°API</th>
        <th>K<sub>w</sub></th>
        <th>MW</th><th>T<sub>c</sub> (K)</th><th>P<sub>c</sub> (bar)</th>
        <th>ω</th>
      </tr></thead><tbody>`;
    for (const r of result.rows) {
      const tw = r.twu, kl = r.keslerLee, rd = r.riaziDaubert;
      html += `<tr>
        <td>${r.component}</td>
        <td>${r.Tb.toFixed(1)}</td>
        <td>${r.SG.toFixed(3)}</td>
        <td>${r.api.toFixed(2)}</td>
        <td>${r.Kw.toFixed(2)}</td>
        <td>${(tw?.MW ?? rd.MW).toFixed(1)}</td>
        <td>${(tw?.Tc ?? kl?.Tc ?? rd.Tc).toFixed(1)}</td>
        <td>${(tw?.Pc ?? kl?.Pc ?? rd.Pc).toFixed(2)}</td>
        <td>${kl?.omega != null ? kl.omega.toFixed(3) : "—"}</td>
      </tr>`;
    }
    html += `</tbody></table></div>`;
    if (result.mixture) {
      const m = result.mixture;
      html += `<div class="estimator-mix">
        <span class="estimator-mix-label">Mixture (Kay's rule)</span>
        T<sub>pc</sub>=${m.Tpc.toFixed(1)} K · P<sub>pc</sub>=${m.Ppc.toFixed(2)} bar
        · MW=${m.MW.toFixed(1)} · K<sub>w</sub>=${m.Kw.toFixed(2)}
      </div>`;
    }
    box.innerHTML = html;
  }

  function renderBestModel(best) {
    const box = document.getElementById("bestModel");
    box.hidden = false;
    document.getElementById("bestName").textContent = best.name;
    document.getElementById("bestStats").textContent =
      `R² = ${best.metrics.r2.toFixed(4)}   ·   RMSE = ${best.metrics.rmse.toExponential(3)}   ·   AIC = ${best.metrics.aic.toFixed(2)}`;
  }

  /* ------------------- Status (replaces console) ------------------- */
  function log(message, type = "info") {
    // Console panel was removed for a cleaner UI; surface messages in
    // the header status pill and the browser console for debugging.
    if (type === "err" || type === "warn") {
      setStatus(message.replace(/^[!→·>✓\s]+/, ""));
    } else if (type === "ok" || type === "accent") {
      setStatus(message.replace(/^[!→·>✓\s]+/, ""));
    }
    if (window?.console?.log) console.log(`[${type}]`, message);
    return Promise.resolve();
  }

  /* ------------------- Tabs (group + chart) ------------------- */
  function bindTabs() {
    // Group buttons toggle which tab strip is visible
    document.querySelectorAll(".tab-group").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-group").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const grp = btn.dataset.group;
        document.querySelectorAll("[data-group-tabs]").forEach(strip => {
          strip.hidden = (strip.dataset.groupTabs !== grp);
        });
        // Auto-select first tab in the group if none active there
        const strip = document.querySelector(`[data-group-tabs="${grp}"]`);
        const active = strip.querySelector(".tab.active");
        if (!active) strip.querySelector(".tab")?.click();
      });
    });

    // Chart tabs swap chart panels
    document.querySelectorAll(".tabs .tab").forEach(tab => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".tabs .tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        const target = tab.dataset.tab;
        document.querySelectorAll(".chart-wrap").forEach(w => {
          w.classList.toggle("hidden", w.dataset.panel !== target);
        });
        // Plotly relayout if needed (resize after becoming visible)
        const host = document.querySelector(`.chart-wrap[data-panel="${target}"] .plotly-host`);
        if (host && window.Plotly) {
          requestAnimationFrame(() => Plotly.Plots.resize(host));
        }
      });
    });
  }

  /* ------------------- Progress ------------------- */
  function setProgress(p) {
    document.getElementById("progressFill").style.width = `${Math.max(0, Math.min(100, p))}%`;
  }

  function setStatus(text) {
    document.getElementById("statusText").textContent = text;
  }

  /* ------------------- Clock ------------------- */
  function startClock() {
    const el = document.getElementById("clock");
    const tick = () => { el.textContent = new Date().toTimeString().slice(0, 8); };
    tick();
    setInterval(tick, 1000);
  }

  return {
    buildCompositionRow,
    getComposition,
    updateSumIndicator,
    buildModelCards,
    getSelectedModels,
    renderCompoundMeta,
    renderResults,
    renderBestModel,
    renderEstimatorResults,
    log,
    bindTabs,
    setProgress,
    setStatus,
    startClock
  };
})();

window.UI = UI;
