/* =====================================================================
 * dataManager.js
 * Data ingestion + PubChem REST integration + synthetic dataset
 * generation when no experimental data is supplied.
 *
 * Public API:
 *   DataManager.fetchCompound(name)       -> compound metadata
 *   DataManager.parseUpload(file)         -> {x: [], y: []}
 *   DataManager.getDataset(opts)          -> {x, y, source}
 *   DataManager.localDB                   -> built-in JSON db
 * =================================================================== */

const DataManager = (() => {

  const PUBCHEM_BASE = "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound";

  /* Compound categories (dataset types) for the UI selector and
   * the compound autocomplete filter.
   */
  const compoundCategories = {
    all:             { label: "All Compounds" },
    hydrocarbon:     { label: "Hydrocarbon Mixtures" },
    alcohol:         { label: "Alcohol Mixtures" },
    "water-organic": { label: "Water–Organic Solvents" },
    "ionic-liquid":  { label: "Ionic Liquid Mixtures" },
    electrolyte:     { label: "Electrolyte Solutions" },
    gas:             { label: "Gas Mixtures" },
    petroleum:       { label: "Petroleum Fractions" },
    refrigerant:     { label: "Refrigerant Mixtures" },
    aromatic:        { label: "Aromatic Solvents" },
    polymer:         { label: "Polymer–Solvent Systems" },
    pharmaceutical:  { label: "Pharmaceutical Solvents" }
  };

  /* Compound database.
   * Each entry carries: name, formula, mw, density (g/cm³), bp (°C),
   * smiles, PubChem CID and a `families` array tagging the categories
   * the compound belongs to (one compound can appear in many).
   * Sources: PubChem property tables + standard CRC values.
   */
  const localDB = {
    /* ===== Water ===== */
    "water": {
      name: "Water", formula: "H2O", mw: 18.015, density: 0.997, bp: 100.0,
      smiles: "O", cid: 962,
      families: ["alcohol", "water-organic", "electrolyte", "pharmaceutical"]
    },

    /* ===== Alcohols ===== */
    "methanol":    { name: "Methanol",    formula: "CH4O",   mw: 32.04, density: 0.792, bp:  64.7,  smiles: "CO",        cid:  887, families: ["alcohol", "water-organic"] },
    "ethanol":     { name: "Ethanol",     formula: "C2H6O",  mw: 46.07, density: 0.789, bp:  78.37, smiles: "CCO",       cid:  702, families: ["alcohol", "water-organic", "pharmaceutical"] },
    "1-propanol":  { name: "1-Propanol",  formula: "C3H8O",  mw: 60.10, density: 0.804, bp:  97.2,  smiles: "CCCO",      cid: 1031, families: ["alcohol"] },
    "2-propanol":  { name: "2-Propanol",  formula: "C3H8O",  mw: 60.10, density: 0.786, bp:  82.6,  smiles: "CC(C)O",    cid: 3776, families: ["alcohol"] },
    "1-butanol":   { name: "1-Butanol",   formula: "C4H10O", mw: 74.12, density: 0.810, bp: 117.7,  smiles: "CCCCO",     cid:  263, families: ["alcohol"] },
    "isobutanol":  { name: "Isobutanol",  formula: "C4H10O", mw: 74.12, density: 0.802, bp: 107.9,  smiles: "CC(C)CO",   cid: 6560, families: ["alcohol"] },
    "1-pentanol":  { name: "1-Pentanol",  formula: "C5H12O", mw: 88.15, density: 0.811, bp: 138.0,  smiles: "CCCCCO",    cid: 6276, families: ["alcohol"] },

    /* ===== Hydrocarbons (light + aromatic) ===== */
    "methane":     { name: "Methane",     formula: "CH4",    mw:  16.04, density: 0.000656, bp: -161.5, smiles: "C",         cid:   297, families: ["petroleum", "hydrocarbon", "gas"] },
    "ethane":      { name: "Ethane",      formula: "C2H6",   mw:  30.07, density: 0.00125,  bp:  -88.6, smiles: "CC",        cid:  6324, families: ["petroleum", "hydrocarbon", "gas"] },
    "propane":     { name: "Propane",     formula: "C3H8",   mw:  44.10, density: 0.493,    bp:  -42.1, smiles: "CCC",       cid:  6334, families: ["petroleum", "hydrocarbon"] },
    "n-butane":    { name: "n-Butane",    formula: "C4H10",  mw:  58.12, density: 0.573,    bp:   -0.5, smiles: "CCCC",      cid:  7843, families: ["petroleum", "hydrocarbon"] },
    "i-butane":    { name: "i-Butane",    formula: "C4H10",  mw:  58.12, density: 0.557,    bp:  -11.7, smiles: "CC(C)C",    cid:  6360, families: ["petroleum", "hydrocarbon"] },
    "n-pentane":   { name: "n-Pentane",   formula: "C5H12",  mw:  72.15, density: 0.626,    bp:   36.1, smiles: "CCCCC",     cid:  8003, families: ["petroleum", "hydrocarbon"] },
    "i-pentane":   { name: "i-Pentane",   formula: "C5H12",  mw:  72.15, density: 0.616,    bp:   27.8, smiles: "CCC(C)C",   cid:  6556, families: ["petroleum", "hydrocarbon"] },
    "n-hexane":    { name: "n-Hexane",    formula: "C6H14",  mw:  86.18, density: 0.659,    bp:   68.7, smiles: "CCCCCC",    cid:  8058, families: ["hydrocarbon"] },
    "n-heptane":   { name: "n-Heptane",   formula: "C7H16",  mw: 100.20, density: 0.684,    bp:   98.4, smiles: "CCCCCCC",   cid:  8900, families: ["hydrocarbon"] },
    "n-octane":    { name: "n-Octane",    formula: "C8H18",  mw: 114.23, density: 0.703,    bp:  125.6, smiles: "CCCCCCCC",  cid:   356, families: ["hydrocarbon"] },
    "n-decane":    { name: "n-Decane",    formula: "C10H22", mw: 142.28, density: 0.730,    bp:  174.1, smiles: "CCCCCCCCCC",cid: 15600, families: ["hydrocarbon"] },
    "benzene":     { name: "Benzene",     formula: "C6H6",   mw:  78.11, density: 0.876,    bp:   80.1, smiles: "c1ccccc1",  cid:   241, families: ["hydrocarbon", "aromatic"] },
    "toluene":     { name: "Toluene",     formula: "C7H8",   mw:  92.14, density: 0.867,    bp:  110.6, smiles: "Cc1ccccc1", cid:  1140, families: ["hydrocarbon", "aromatic", "polymer-solvent"] },
    "ethylbenzene":{ name: "Ethylbenzene",formula: "C8H10",  mw: 106.17, density: 0.867,    bp:  136.2, smiles: "CCc1ccccc1",cid:  7500, families: ["aromatic"] },
    "xylene":      { name: "Xylene",      formula: "C8H10",  mw: 106.17, density: 0.864,    bp:  144.0, smiles: "Cc1ccccc1C",cid:  7237, families: ["hydrocarbon", "aromatic"] },
    "styrene":     { name: "Styrene",     formula: "C8H8",   mw: 104.15, density: 0.909,    bp:  145.2, smiles: "C=Cc1ccccc1",cid: 7501, families: ["aromatic"] },

    /* ===== Water-Organic Solvents ===== */
    "acetone":       { name: "Acetone",       formula: "C3H6O",  mw:  58.08, density: 0.784, bp:  56.05, smiles: "CC(=O)C",    cid:    180, families: ["water-organic", "polymer-solvent"] },
    "acetonitrile":  { name: "Acetonitrile",  formula: "C2H3N",  mw:  41.05, density: 0.786, bp:  81.6,  smiles: "CC#N",       cid:   6342, families: ["water-organic"] },
    "dmso":          { name: "DMSO",          formula: "C2H6OS", mw:  78.13, density: 1.100, bp: 189.0,  smiles: "CS(=O)C",    cid:    679, families: ["water-organic"] },
    "dmf":           { name: "DMF",           formula: "C3H7NO", mw:  73.09, density: 0.944, bp: 153.0,  smiles: "CN(C)C=O",   cid:   6228, families: ["water-organic"] },
    "thf":           { name: "THF",           formula: "C4H8O",  mw:  72.11, density: 0.889, bp:  66.0,  smiles: "C1CCOC1",    cid:   8028, families: ["water-organic", "polymer-solvent"] },
    "1,4-dioxane":   { name: "1,4-Dioxane",   formula: "C4H8O2", mw:  88.11, density: 1.033, bp: 101.1,  smiles: "C1COCCO1",   cid:  31275, families: ["water-organic"] },
    "ethyl acetate": { name: "Ethyl Acetate", formula: "C4H8O2", mw:  88.11, density: 0.902, bp:  77.1,  smiles: "CCOC(=O)C",  cid:   8857, families: ["water-organic"] },
    "chloroform":    { name: "Chloroform",    formula: "CHCl3",  mw: 119.38, density: 1.489, bp:  61.2,  smiles: "ClC(Cl)Cl",  cid:   6212, families: ["water-organic", "polymer-solvent"] },

    /* ===== Ionic Liquids ===== */
    "[bmim][bf4]": { name: "[BMIM][BF4]", formula: "C8H15BF4N2",   mw: 226.02, density: 1.21, bp: null, smiles: "CCCC[n+]1ccn(C)c1.F[B-](F)(F)F",         cid: 2734175, families: ["ionic-liquid"] },
    "[bmim][pf6]": { name: "[BMIM][PF6]", formula: "C8H15F6N2P",   mw: 284.18, density: 1.37, bp: null, smiles: "CCCC[n+]1ccn(C)c1.F[P-](F)(F)(F)(F)F",   cid: 2734175, families: ["ionic-liquid"] },
    "[emim][bf4]": { name: "[EMIM][BF4]", formula: "C6H11BF4N2",   mw: 197.97, density: 1.28, bp: null, smiles: "CCn1cc[n+](C)c1.F[B-](F)(F)F",          cid: 2734163, families: ["ionic-liquid"] },
    "[emim][otf]": { name: "[EMIM][OTf]", formula: "C7H11F3N2O3S", mw: 260.23, density: 1.39, bp: null, smiles: "CCn1cc[n+](C)c1.[O-]S(=O)(=O)C(F)(F)F", cid: 5957927, families: ["ionic-liquid"] },
    "[hmim][cl]":  { name: "[HMIM][Cl]",  formula: "C10H19ClN2",   mw: 202.73, density: 1.03, bp: null, smiles: "CCCCCCn1cc[n+](C)c1.[Cl-]",             cid: 2734162, families: ["ionic-liquid"] },

    /* ===== Electrolyte salts ===== */
    "nacl":   { name: "NaCl",   formula: "NaCl",   mw:  58.44, density: 2.165, bp: 1413, smiles: "[Na+].[Cl-]",                       cid:    5234, families: ["electrolyte"] },
    "kcl":    { name: "KCl",    formula: "KCl",    mw:  74.55, density: 1.984, bp: 1420, smiles: "[K+].[Cl-]",                        cid:    4873, families: ["electrolyte"] },
    "licl":   { name: "LiCl",   formula: "LiCl",   mw:  42.39, density: 2.068, bp: 1382, smiles: "[Li+].[Cl-]",                       cid:  433294, families: ["electrolyte"] },
    "mgcl2":  { name: "MgCl2",  formula: "MgCl2",  mw:  95.21, density: 2.320, bp: 1412, smiles: "[Mg+2].[Cl-].[Cl-]",                cid: 5360315, families: ["electrolyte"] },
    "na2so4": { name: "Na2SO4", formula: "Na2SO4", mw: 142.04, density: 2.664, bp: 1429, smiles: "[Na+].[Na+].[O-]S(=O)(=O)[O-]",     cid:   24436, families: ["electrolyte"] },

    /* ===== Gases ===== */
    "nitrogen":       { name: "Nitrogen",       formula: "N2",  mw: 28.014, density: 0.001145,  bp: -195.8, smiles: "N#N",   cid:    947, families: ["gas"] },
    "carbon dioxide": { name: "Carbon Dioxide", formula: "CO2", mw: 44.01,  density: 0.001839,  bp:  -78.5, smiles: "O=C=O", cid:    280, families: ["gas"] },
    "hydrogen":       { name: "Hydrogen",       formula: "H2",  mw:  2.016, density: 0.0000838, bp: -252.9, smiles: "[H][H]",cid:    783, families: ["gas"] },
    "oxygen":         { name: "Oxygen",         formula: "O2",  mw: 31.998, density: 0.001308,  bp: -183.0, smiles: "O=O",   cid:    977, families: ["gas"] },
    "argon":          { name: "Argon",          formula: "Ar",  mw: 39.948, density: 0.001633,  bp: -185.8, smiles: "[Ar]",  cid:  23968, families: ["gas"] },

    /* ===== Refrigerants ===== */
    "r-134a":   { name: "R-134a",  formula: "C2H2F4", mw: 102.03, density: 1.210, bp: -26.3, smiles: "FCC(F)(F)F",      cid:    13129, families: ["refrigerant"] },
    "r-1234yf": { name: "R-1234yf",formula: "C3H2F4", mw: 114.04, density: 1.100, bp: -29.5, smiles: "C(=CF)C(F)(F)F",  cid: 18752716, families: ["refrigerant"] },
    "r-32":     { name: "R-32",    formula: "CH2F2",  mw:  52.02, density: 0.961, bp: -51.6, smiles: "FCF",             cid:     6345, families: ["refrigerant"] },
    "r-125":    { name: "R-125",   formula: "C2HF5",  mw: 120.02, density: 1.245, bp: -48.5, smiles: "FC(F)C(F)(F)F",   cid:     9628, families: ["refrigerant"] },
    "r-410a":   { name: "R-410A",  formula: "blend",  mw:  72.58, density: 1.180, bp: -51.5, smiles: null,              cid:     null, families: ["refrigerant"], pseudo: true },

    /* ===== Polymers ===== */
    "polystyrene":  { name: "Polystyrene",  formula: "(C8H8)n",    mw: 100000, density: 1.05, bp: null, smiles: null, cid: null, families: ["polymer"], pseudo: true },
    "polyethylene": { name: "Polyethylene", formula: "(C2H4)n",    mw:  50000, density: 0.95, bp: null, smiles: null, cid: null, families: ["polymer"], pseudo: true },
    "pmma":         { name: "PMMA",         formula: "(C5H8O2)n",  mw: 100000, density: 1.18, bp: null, smiles: null, cid: null, families: ["polymer"], pseudo: true },

    /* ===== Pharmaceutical solvents ===== */
    "propylene glycol": { name: "Propylene Glycol", formula: "C3H8O2", mw:  76.09, density: 1.036, bp: 188.2, smiles: "CC(O)CO",   cid: 1030, families: ["pharmaceutical"] },
    "peg":              { name: "PEG (400)",        formula: "(C2H4O)n", mw:  400, density: 1.125, bp: null,  smiles: null,        cid: null, families: ["pharmaceutical"], pseudo: true },
    "glycerol":         { name: "Glycerol",         formula: "C3H8O3", mw:  92.09, density: 1.261, bp: 290.0, smiles: "OCC(O)CO",  cid:  753, families: ["pharmaceutical"] },

    /* ===== Petroleum pseudo-fractions ===== */
    "light naphtha": { name: "Light Naphtha", formula: "C5–C6",   mw:  85, density: 0.68, bp:  90, smiles: null, cid: null, families: ["petroleum"], pseudo: true },
    "heavy naphtha": { name: "Heavy Naphtha", formula: "C7–C10",  mw: 120, density: 0.75, bp: 160, smiles: null, cid: null, families: ["petroleum"], pseudo: true },
    "kerosene":      { name: "Kerosene",      formula: "C10–C14", mw: 170, density: 0.80, bp: 220, smiles: null, cid: null, families: ["petroleum"], pseudo: true },
    "diesel":        { name: "Diesel",        formula: "C14–C20", mw: 220, density: 0.84, bp: 290, smiles: null, cid: null, families: ["petroleum"], pseudo: true },
    "gas oil":       { name: "Gas Oil",       formula: "C20–C30", mw: 320, density: 0.88, bp: 380, smiles: null, cid: null, families: ["petroleum"], pseudo: true },
    "residuum":      { name: "Residuum",      formula: "C30+",    mw: 600, density: 0.95, bp: 550, smiles: null, cid: null, families: ["petroleum"], pseudo: true }
  };

  /* Lookup helper: case-insensitive search of localDB by either the
   * dictionary key or the display name. Returns the entry or null.
   */
  function findCompound(query) {
    if (!query) return null;
    const lower = query.trim().toLowerCase();
    if (localDB[lower]) return localDB[lower];
    for (const c of Object.values(localDB)) {
      if (c.name?.toLowerCase() === lower) return c;
    }
    return null;
  }

  /* Filtered/sorted suggestions for the autocomplete dropdown.
   * `category` is one of compoundCategories keys (e.g. "alcohol")
   * or "all" for unfiltered.
   */
  function suggestCompounds(query, category = "all", limit = 12) {
    const q = (query || "").toLowerCase().trim();
    const out = [];
    for (const c of Object.values(localDB)) {
      if (category && category !== "all") {
        const fams = c.families || [];
        if (!fams.includes(category)) continue;
      }
      const hay = (c.name + " " + (c.formula || "")).toLowerCase();
      if (q && !hay.includes(q)) continue;
      out.push(c);
    }
    out.sort((a, b) => {
      const aw = a.name.toLowerCase().startsWith(q) ? 0 : 1;
      const bw = b.name.toLowerCase().startsWith(q) ? 0 : 1;
      if (aw !== bw) return aw - bw;
      return a.name.localeCompare(b.name);
    });
    return out.slice(0, limit);
  }

  /* Pre-loaded crude oil sample compositions.
   * Compositions are illustrative typical values, not field-specific.
   */
  const petroleumPresets = {
    "light_crude": {
      label: "Light Crude Oil",
      components: [
        { name: "Methane",       x: 0.08 },
        { name: "Ethane",        x: 0.07 },
        { name: "Propane",       x: 0.10 },
        { name: "n-Butane",      x: 0.10 },
        { name: "Light Naphtha", x: 0.20 },
        { name: "Heavy Naphtha", x: 0.20 },
        { name: "Kerosene",      x: 0.15 },
        { name: "Diesel",        x: 0.10 }
      ]
    },
    "medium_crude": {
      label: "Medium Crude Oil",
      components: [
        { name: "Methane",       x: 0.04 },
        { name: "Ethane",        x: 0.04 },
        { name: "Propane",       x: 0.06 },
        { name: "n-Butane",      x: 0.06 },
        { name: "Light Naphtha", x: 0.15 },
        { name: "Heavy Naphtha", x: 0.20 },
        { name: "Kerosene",      x: 0.15 },
        { name: "Diesel",        x: 0.20 },
        { name: "Gas Oil",       x: 0.10 }
      ]
    },
    "heavy_crude": {
      label: "Heavy Crude Oil",
      components: [
        { name: "Propane",       x: 0.02 },
        { name: "n-Butane",      x: 0.03 },
        { name: "Light Naphtha", x: 0.05 },
        { name: "Heavy Naphtha", x: 0.10 },
        { name: "Kerosene",      x: 0.15 },
        { name: "Diesel",        x: 0.25 },
        { name: "Gas Oil",       x: 0.25 },
        { name: "Residuum",      x: 0.15 }
      ]
    },
    "condensate": {
      label: "Gas Condensate",
      components: [
        { name: "Methane",       x: 0.30 },
        { name: "Ethane",        x: 0.15 },
        { name: "Propane",       x: 0.12 },
        { name: "n-Butane",      x: 0.08 },
        { name: "i-Butane",      x: 0.05 },
        { name: "n-Pentane",     x: 0.05 },
        { name: "Light Naphtha", x: 0.15 },
        { name: "Heavy Naphtha", x: 0.10 }
      ]
    },
    "bitumen": {
      label: "Bitumen",
      components: [
        { name: "Diesel",        x: 0.05 },
        { name: "Gas Oil",       x: 0.25 },
        { name: "Residuum",      x: 0.70 }
      ]
    }
  };

  async function fetchCompound(name) {
    const key = (name || "").trim().toLowerCase();
    if (!key) return null;
    if (localDB[key]) return { ...localDB[key], source: "local" };

    // PubChem fetch (CID via name, then properties)
    try {
      const cidRes = await fetch(`${PUBCHEM_BASE}/name/${encodeURIComponent(name)}/cids/JSON`);
      if (!cidRes.ok) throw new Error("PubChem name lookup failed");
      const cidJson = await cidRes.json();
      const cid = cidJson?.IdentifierList?.CID?.[0];
      if (!cid) throw new Error("No CID found");

      const propRes = await fetch(
        `${PUBCHEM_BASE}/cid/${cid}/property/MolecularFormula,MolecularWeight,CanonicalSMILES/JSON`
      );
      const propJson = await propRes.json();
      const p = propJson?.PropertyTable?.Properties?.[0] ?? {};

      return {
        name: name,
        cid,
        formula: p.MolecularFormula ?? "—",
        mw: p.MolecularWeight ? parseFloat(p.MolecularWeight) : null,
        smiles: p.CanonicalSMILES ?? "—",
        density: null,
        bp: null,
        source: "pubchem"
      };
    } catch (err) {
      // Network or CORS failure — silently fall back
      return null;
    }
  }

  /* Parse an uploaded dataset. Accepts:
   *   CSV with two columns "x,y" (header optional)
   *   JSON of form {"x": [...], "y": [...]}  OR  [{x,y},...]
   */
  async function parseUpload(file) {
    const text = await file.text();
    const name = file.name.toLowerCase();
    if (name.endsWith(".json")) {
      const obj = JSON.parse(text);
      if (Array.isArray(obj) && obj.length && "x" in obj[0]) {
        return { x: obj.map(o => +o.x), y: obj.map(o => +o.y), source: "upload" };
      }
      if (obj.x && obj.y) {
        return { x: obj.x.map(Number), y: obj.y.map(Number), source: "upload" };
      }
      throw new Error("Unrecognized JSON dataset shape");
    }
    // CSV path
    const lines = text.split(/\r?\n/).filter(l => l.trim().length);
    let start = 0;
    // Skip header if non-numeric
    if (isNaN(parseFloat(lines[0].split(/[,\t;]/)[0]))) start = 1;
    const x = [], y = [];
    for (let i = start; i < lines.length; i++) {
      const parts = lines[i].split(/[,\t;]/).map(s => s.trim());
      if (parts.length < 2) continue;
      const a = parseFloat(parts[0]), b = parseFloat(parts[1]);
      if (Number.isFinite(a) && Number.isFinite(b)) { x.push(a); y.push(b); }
    }
    return { x, y, source: "upload" };
  }

  /* Generate a synthetic, but physically reasonable, dataset for the
   * selected target property. Used when no experimental data is loaded,
   * so the tool can be demoed end-to-end. The "true" generating
   * function is a Redlich-Kister with mild noise + perturbations that
   * deliberately make a single model not perfectly fit.
   */
  function synthesizeDataset(property, components, variable = "composition") {
    const n = 21;
    const seed = property.length + (components?.length || 0);
    const wig = (k) => Math.sin(k * 7.13 + seed) * Math.cos(k * 2.7 + seed * 0.3);

    // ----- temperature axis ----------------------------------------
    if (variable === "temperature") {
      // 0 °C → 200 °C, 21 samples
      const x = Array.from({ length: n }, (_, i) => i * 10);
      let y;
      switch (property) {
        case "viscosity":
          // Arrhenius μ = A·exp(B/T) → realistic dead-oil-like curve
          y = x.map(t => 0.4 * Math.exp(1800 / (t + 273.15)) + 0.05 * wig(t));
          break;
        case "vaporPressure":
          // Antoine in T (Reid-like): log10 P = A - B/(T+C)
          y = x.map(t => Math.pow(10, 7.2 - 1600 / (t + 230)) + 0.1 * wig(t));
          break;
        case "density":
          y = x.map(t => 0.92 - 0.00075 * t + 0.002 * wig(t));
          break;
        case "thermalConductivity":
          y = x.map(t => 0.18 - 0.0002 * t + 0.003 * wig(t));
          break;
        case "surfaceTension":
          y = x.map(t => 30 - 0.08 * t + 0.4 * wig(t));
          break;
        default:
          // generic: mild Arrhenius-like trend so something fits
          y = x.map(t => Math.exp(2 - 0.01 * t) + 0.05 * wig(t));
      }
      return { x, y, source: "synthetic", variable };
    }

    // ----- density axis (for Lee-Gonzalez-Eakin) -------------------
    if (variable === "density") {
      // 0.05 to 0.50 g/cc — gas-phase range
      const x = Array.from({ length: n }, (_, i) => 0.05 + i * (0.45 / (n - 1)));
      let y;
      switch (property) {
        case "viscosity":
          // Lee-Gonzalez-Eakin form
          y = x.map(rho => 1e-4 * 110 * Math.exp(4.0 * Math.pow(rho, 1.6)) + 1e-4 * wig(rho * 10));
          break;
        case "compressibilityZ":
          y = x.map(rho => 1 - 0.4 * rho + 0.6 * rho * rho + 0.01 * wig(rho));
          break;
        default:
          y = x.map(rho => Math.exp(2 * rho) + 0.05 * wig(rho));
      }
      return { x, y, source: "synthetic", variable };
    }

    // ----- API gravity axis ----------------------------------------
    if (variable === "api") {
      // 10..50 °API range
      const x = Array.from({ length: n }, (_, i) => 10 + i * (40 / (n - 1)));
      let y;
      switch (property) {
        case "viscosity":
          // Beggs-Robinson form, evaluated at T = 100 °F
          // x = 10^(3.0324 - 0.02023·API), μ = 10^(x · T^-1.163) - 1
          y = x.map(api => {
            const z = 3.0324 - 0.02023 * api;
            const Xb = Math.pow(10, z);
            return Math.pow(10, Xb * Math.pow(100, -1.163)) - 1 + 0.1 * wig(api);
          });
          break;
        case "specificGravity":
          y = x.map(api => 141.5 / (api + 131.5) + 0.002 * wig(api));
          break;
        case "molecularWeight":
          // Riazi-Daubert approximate trend with API
          y = x.map(api => 400 - 6 * api + 0.04 * api * api + 1 * wig(api));
          break;
        default:
          y = x.map(api => 100 - api + 0.5 * wig(api));
      }
      return { x, y, source: "synthetic", variable };
    }

    // ----- composition axis (default) ------------------------------
    const x = Array.from({ length: n }, (_, i) => i / (n - 1));

    let y;
    switch (property) {
      /* ---------- Primary ---------- */
      case "density":
        // ρ in g/cm³ — water/ethanol-like, small negative excess
        y = x.map(xi => 0.789 * xi + 0.997 * (1 - xi)
                       + xi * (1 - xi) * (-0.05 + 0.02 * (xi - 0.5))
                       + 0.002 * wig(xi));
        break;

      case "viscosity":
        // mPa·s — asymmetric maximum
        y = x.map(xi => {
          const x2 = 1 - xi;
          return 0.6 * xi + 1.8 * x2 + xi * x2 * (1.5 + 0.3 * (xi - x2))
                 + 0.04 * wig(xi);
        });
        break;

      case "excessMolarVolume":
        // cm³/mol — characteristic negative excess
        y = x.map(xi => {
          const x2 = 1 - xi, d = xi - x2;
          return xi * x2 * (-4.2 + 0.8 * d - 0.5 * d * d) + 0.03 * wig(xi);
        });
        break;

      case "activityCoefficient":
        // γ — Margules-like, ≥ 1, peaks near dilute
        y = x.map(xi => {
          const x2 = 1 - xi;
          return Math.exp(x2 * x2 * (1.1 + 0.4 * xi)) + 0.02 * wig(xi);
        });
        break;

      case "vaporPressure":
        // kPa — log-mixed with positive deviation
        y = x.map(xi => {
          const lnP = xi * Math.log(5.5) + (1 - xi) * Math.log(12.0)
                    + xi * (1 - xi) * 0.45;
          return Math.exp(lnP) + 0.08 * wig(xi);
        });
        break;

      /* ---------- Secondary ---------- */
      case "refractiveIndex":
        y = x.map(xi => 1.3614 * xi + 1.3330 * (1 - xi)
                       + xi * (1 - xi) * (0.005 + 0.002 * (xi - 0.5))
                       + 0.0008 * wig(xi));
        break;

      case "surfaceTension":
        // mN/m — ethanol 22, water 72, strong negative excess
        y = x.map(xi => 22 * xi + 72 * (1 - xi)
                       - xi * (1 - xi) * 42
                       + 0.4 * wig(xi));
        break;

      case "electricalConductivity":
        // mS/cm — parabolic with a maximum
        y = x.map(xi => 0.05 + xi * (1 - xi) * 4.5 + 0.05 * wig(xi));
        break;

      case "speedOfSound":
        // m/s — water ~1480, ethanol ~1180
        y = x.map(xi => 1180 * xi + 1480 * (1 - xi)
                       + xi * (1 - xi) * 30
                       + 3 * wig(xi));
        break;

      /* ---------- Other ---------- */
      case "solubility":
        // mol/L — increases through midrange (cosolvency)
        y = x.map(xi => 0.2 + xi * (1 - xi) * 1.8 + 0.4 * xi
                       + 0.02 * wig(xi));
        break;

      case "heatCapacity":
        // J/(mol·K) — ethanol 112, water 75
        y = x.map(xi => 112 * xi + 75 * (1 - xi)
                       - xi * (1 - xi) * 6
                       + 0.4 * wig(xi));
        break;

      case "thermalConductivity":
        // W/(m·K) — water 0.60, ethanol 0.17
        y = x.map(xi => 0.17 * xi + 0.60 * (1 - xi)
                       - xi * (1 - xi) * 0.04
                       + 0.004 * wig(xi));
        break;

      /* ---------- Petroleum ---------- */
      case "apiGravity":
        // API gravity, °API. Light end ~50 → heavy end ~15
        y = x.map(xi => 50 * xi + 15 * (1 - xi)
                       + xi * (1 - xi) * (-3.0 + 1.2 * (xi - 0.5))
                       + 0.4 * wig(xi));
        break;

      case "specificGravity":
        // SG ≈ 141.5 / (API + 131.5); spans 0.78..0.97
        y = x.map(xi => 0.78 * xi + 0.965 * (1 - xi)
                       + xi * (1 - xi) * 0.012
                       + 0.003 * wig(xi));
        break;

      case "molecularWeight":
        // MW (g/mol) — light end ~80 → heavy end ~450
        y = x.map(xi => 80 * xi + 450 * (1 - xi)
                       + xi * (1 - xi) * 25
                       + 2 * wig(xi));
        break;

      case "compressibilityZ":
        // Z factor, gas mixture, typical 0.85..1.0
        y = x.map(xi => 0.88 + xi * (1 - xi) * 0.18 + 0.02 * xi
                       + 0.005 * wig(xi));
        break;

      case "watsonK":
        // Watson K factor — paraffinic ~12.5, aromatic ~10
        y = x.map(xi => 12.5 * xi + 10.5 * (1 - xi)
                       - xi * (1 - xi) * 0.4
                       + 0.06 * wig(xi));
        break;

      default:
        y = x.map(xi => xi * (1 - xi));
    }
    return { x, y, source: "synthetic", variable };
  }

  async function getDataset(opts) {
    const { sources, property, components, uploadedData, variable } = opts;
    if (sources?.upload && uploadedData?.x?.length) {
      return { ...uploadedData, variable: variable || "composition" };
    }
    // We don't fetch experimental mixture data from PubChem (PubChem
    // doesn't have mixture excess properties broadly) — instead we use a
    // synthetic dataset derived from the property, anchored to component
    // properties where possible.
    return synthesizeDataset(property, components, variable || "composition");
  }

  return { fetchCompound, parseUpload, getDataset, synthesizeDataset,
           localDB, petroleumPresets, compoundCategories,
           findCompound, suggestCompounds };
})();

window.DataManager = DataManager;
