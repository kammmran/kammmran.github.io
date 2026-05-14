/* =====================================================================
 * estimators.js
 * Petroleum property estimators (Tb + SG → Tc, Pc, MW, ω, …).
 *
 * These are PREDICTION methods, not curve fits, so they sit outside
 * the correlation registry. The UI exposes them as a "Estimate
 * Properties" panel that runs against the loaded mixture.
 *
 * Inputs:
 *   Tb  -- normal boiling point (K)
 *   SG  -- specific gravity (60/60 °F)
 *
 * All formulas adapted from open literature (Riazi 2005 + ASTM D2887).
 * =================================================================== */

const Estimators = (() => {

  /* Watson characterization factor (paraffinicity index)
   *   K_w = (1.8·Tb)^(1/3) / SG       (Tb in K, output dimensionless)
   *   Aromatic ≈ 10, naphthenic ≈ 11, paraffinic ≈ 12.5
   */
  function watsonK(Tb_K, SG) {
    return Math.cbrt(1.8 * Tb_K) / SG;
  }

  /* API gravity from specific gravity */
  function api(SG)  { return 141.5 / SG - 131.5; }
  function sgFromAPI(API) { return 141.5 / (API + 131.5); }

  /* Riazi-Daubert (1980, generalized 2-parameter)
   *   θ = a · Tb^b · SG^c · exp(d·Tb + e·SG + f·Tb·SG)
   *
   *   MW   :  a=42.965,   b=1.26007,  c=4.98308,   d=2.097e-4,  e=-7.78712, f=2.08476e-3
   *   Tc   :  a=9.5233,   b=0.81067,  c=0.53691,   d=-9.314e-4, e=-0.54444, f=6.4791e-4   (output K)
   *   Pc   :  a=31.9583,  b=-0.85077, c=2.91976,   d=-1.41246e-3,e= 0.20876, f=-1.04293e-3 (output bar)
   *   Vc   :  a=1.7842e-4,b=2.38791,  c=-1.68403,  d=-1.30890e-3,e=-2.65324, f=2.5036e-3   (output cm³/g)
   */
  function _riaziD(coeffs, Tb_K, SG) {
    const [a, b, c, d, e, f] = coeffs;
    return a * Math.pow(Tb_K, b) * Math.pow(SG, c)
             * Math.exp(d * Tb_K + e * SG + f * Tb_K * SG);
  }

  function riaziDaubertMW(Tb_K, SG) {
    return _riaziD([42.965, 1.26007, 4.98308, 2.097e-4, -7.78712, 2.08476e-3], Tb_K, SG);
  }
  function riaziDaubertTc(Tb_K, SG) {
    return _riaziD([9.5233, 0.81067, 0.53691, -9.314e-4, -0.54444, 6.4791e-4], Tb_K, SG);
  }
  function riaziDaubertPc(Tb_K, SG) {
    return _riaziD([31.9583, -0.85077, 2.91976, -1.41246e-3, 0.20876, -1.04293e-3], Tb_K, SG);
  }

  /* Kesler-Lee (1976) — critical properties + acentric factor
   * Tc = 341.7 + 811·SG + (0.4244 + 0.1174·SG)·Tb
   *      + (0.4669 - 3.2623·SG)·1e5 / Tb         (Tb,Tc in °R; output here in K)
   * ln Pc = 8.3634 - 0.0566/SG
   *       - (0.24244 + 2.2898/SG + 0.11857/SG²)·1e-3·Tb
   *       + (1.4685 + 3.648/SG + 0.47227/SG²)·1e-7·Tb²
   *       - (0.42019 + 1.6977/SG²)·1e-10·Tb³     (output psia → bar)
   * Acentric factor (Kesler-Lee):
   *   if Tb_r < 0.8:
   *     ω = (-ln(Pc/1.01325) - 5.92714 + 6.09648/Tb_r + 1.28862·ln(Tb_r) - 0.169347·Tb_r⁶)
   *          / (15.2518 - 15.6875/Tb_r - 13.4721·ln(Tb_r) + 0.43577·Tb_r⁶)
   *   else use Edmister form.
   */
  function keslerLee(Tb_K, SG) {
    const Tb_R = Tb_K * 1.8;
    const Tc_R = 341.7 + 811 * SG + (0.4244 + 0.1174 * SG) * Tb_R
               + (0.4669 - 3.2623 * SG) * 1e5 / Tb_R;
    const Tc_K = Tc_R / 1.8;

    const lnPc = 8.3634 - 0.0566 / SG
               - (0.24244 + 2.2898 / SG + 0.11857 / (SG * SG)) * 1e-3 * Tb_R
               + (1.4685 + 3.648 / SG + 0.47227 / (SG * SG)) * 1e-7 * Tb_R * Tb_R
               - (0.42019 + 1.6977 / (SG * SG)) * 1e-10 * Tb_R * Tb_R * Tb_R;
    const Pc_psia = Math.exp(lnPc);
    const Pc_bar = Pc_psia * 0.0689476;

    const Tbr = Tb_K / Tc_K;
    let omega;
    if (Tbr < 0.8) {
      const num = -Math.log(Pc_bar / 1.01325) - 5.92714 + 6.09648 / Tbr
                + 1.28862 * Math.log(Tbr) - 0.169347 * Math.pow(Tbr, 6);
      const den =  15.2518 - 15.6875 / Tbr - 13.4721 * Math.log(Tbr)
                + 0.43577 * Math.pow(Tbr, 6);
      omega = num / den;
    } else {
      omega = -7.904 + 0.1352 * (1.8 * Tb_K)
            - 0.007465 * Math.pow(1.8 * Tb_K, 2) + 8.359 * Tbr
            + (1.408 - 0.01063 * 1.8 * Tb_K) / Tbr;
    }
    return { Tc: Tc_K, Pc: Pc_bar, omega };
  }

  /* Twu (1984) characterization — perturbation about an n-paraffin.
   * Returns Tc (K), Pc (bar), Vc (cm³/mol), MW (g/mol).
   * Output is reasonable for Tb in 200–800 K.
   */
  function twu(Tb_K, SG) {
    const Tb = Tb_K;
    // n-paraffin reference (subscript "p")
    const Tcp = Tb * (0.533272 + 0.191017e-3 * Tb + 0.779681e-7 * Tb * Tb
                    - 0.284376e-10 * Tb * Tb * Tb + 0.959468e28 / Math.pow(Tb, 13));
    const alpha = 1 - Tb / Tcp;
    const Pcp = Math.pow(3.83354 + 1.19629 * Math.sqrt(alpha) + 34.8888 * alpha
                       + 36.1952 * alpha * alpha + 104.193 * Math.pow(alpha, 4), 2);
    const Vcp = Math.pow(1 - (0.419869 - 0.505839 * alpha - 1.56436 * Math.pow(alpha, 3)
                              - 9481.7 * Math.pow(alpha, 14)), -8);
    const SGp = 0.843593 - 0.128624 * alpha - 3.36159 * Math.pow(alpha, 3)
              - 13749.5 * Math.pow(alpha, 12);
    // Perturbation for the fraction's actual SG
    const dSGT = Math.exp(5 * (SGp - SG)) - 1;
    const fT = dSGT * (-0.362456 / Math.sqrt(Tb) + (0.0398285 - 0.948125 / Math.sqrt(Tb)) * dSGT);
    const Tc = Tcp * Math.pow((1 + 2 * fT) / (1 - 2 * fT), 2);

    const dSGV = Math.exp(4 * (SGp * SGp - SG * SG)) - 1;
    const fV = dSGV * (0.466590 / Math.sqrt(Tb) + (-0.182421 + 3.01721 / Math.sqrt(Tb)) * dSGV);
    const Vc = Vcp * Math.pow((1 + 2 * fV) / (1 - 2 * fV), 2);

    const dSGP = Math.exp(0.5 * (SGp - SG)) - 1;
    const fP = dSGP * ((2.53262 - 46.1955 / Math.sqrt(Tb) - 0.00127885 * Tb)
                     + (-11.4277 + 252.140 / Math.sqrt(Tb) + 0.00230535 * Tb) * dSGP);
    const Pc = Pcp * (Tc / Tcp) * (Vcp / Vc) * Math.pow((1 + 2 * fP) / (1 - 2 * fP), 2);

    // MW from Twu's correlation
    const theta = Math.log(Tb);
    const MWp = Math.exp(5.71419 + 2.71579 * theta - 0.286590 * theta * theta
                        - 39.8544 / theta - 0.122488 / (theta * theta))
              - 24.7522 * theta + 35.3155 * theta * theta;
    const dSGM = Math.exp(5 * (SGp - SG)) - 1;
    const fM = dSGM * ((0.0123420 - 0.328086 / Math.sqrt(Tb))
                     + (-0.0175617 + 0.193168 / Math.sqrt(Tb)) * dSGM);
    const MW = Math.exp(Math.log(MWp) * Math.pow((1 + 2 * fM) / (1 - 2 * fM), 2));

    return { Tc, Pc, Vc, MW };
  }

  /* Bulk run — for a list of components with Tb (°C → K) and density (→ SG):
   * returns per-component estimates plus mixture pseudo-criticals
   * (Kay's rule: linear mole-fraction average).
   */
  function estimateMixture(components) {
    const rows = [];
    let xTcSum = 0, xPcSum = 0, xMWSum = 0, xKwSum = 0, xSum = 0;
    for (const c of components) {
      if (c.bp == null || c.density == null) continue;
      const Tb = c.bp + 273.15;
      const SG = c.density / 0.999;             // density g/cc relative to water
      const apiV = api(SG);
      const Kw   = watsonK(Tb, SG);
      const rd   = { MW: riaziDaubertMW(Tb, SG), Tc: riaziDaubertTc(Tb, SG), Pc: riaziDaubertPc(Tb, SG) };
      let kl, tw;
      try { kl = keslerLee(Tb, SG); } catch (e) { kl = null; }
      try { tw = twu(Tb, SG); }       catch (e) { tw = null; }
      rows.push({ component: c.name, x: c.x, Tb, SG, api: apiV, Kw, riaziDaubert: rd, keslerLee: kl, twu: tw });

      const xi = Number.isFinite(c.x) ? c.x : 0;
      xSum    += xi;
      xTcSum  += xi * (kl?.Tc ?? rd.Tc);
      xPcSum  += xi * (kl?.Pc ?? rd.Pc);
      xMWSum  += xi * rd.MW;
      xKwSum  += xi * Kw;
    }
    const mixture = xSum > 0 ? {
      Tpc: xTcSum / xSum, Ppc: xPcSum / xSum,
      MW: xMWSum / xSum,  Kw: xKwSum / xSum
    } : null;
    return { rows, mixture };
  }

  return {
    watsonK, api, sgFromAPI,
    riaziDaubertMW, riaziDaubertTc, riaziDaubertPc,
    keslerLee, twu,
    estimateMixture
  };
})();

window.Estimators = Estimators;
