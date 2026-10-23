/* Shared formula parser + equation balancer. Depends on CHEM (chem-data.js). */
(function (global) {
  const AW = global.CHEM ? global.CHEM.AW : {};

  function parseFormula(s){
    s = s.replace(/\[/g,'(').replace(/\]/g,')');
    let i = 0;
    function group(){
      const st = {};
      while (i < s.length){
        const ch = s[i];
        if (ch === '('){ i++; const sub = group(); if (s[i] !== ')') throw new Error('Unbalanced ()'); i++; const n = num(); for (const k in sub) st[k] = (st[k]||0) + sub[k]*n; }
        else if (ch === ')') break;
        else if (/[A-Z]/.test(ch)){ let el = ch; i++; while (i<s.length && /[a-z]/.test(s[i])){ el+=s[i]; i++; } if (!(el in AW)) throw new Error('Unknown element "'+el+'"'); const n = num(); st[el] = (st[el]||0) + n; }
        else throw new Error('Bad character "'+ch+'"');
      }
      return st;
    }
    function num(){ let t=''; while(i<s.length && /\d/.test(s[i])){ t+=s[i]; i++; } return t?+t:1; }
    const r = group(); if (i < s.length) throw new Error('Bad character "'+s[i]+'"'); return r;
  }

  function gcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ [a,b]=[b,a%b]; } return a||1; }

  function balance(eq){
    const norm = eq.replace(/->|→|⟶/g,'=').replace(/\s+/g,'');
    if (!norm.includes('=')) throw new Error('Use = or -> between reactants and products.');
    const [lhs, rhs] = norm.split('=');
    if (!lhs || !rhs) throw new Error('Both sides are required.');
    const left = lhs.split('+').filter(Boolean);
    const right = rhs.split('+').filter(Boolean);
    const species = [...left, ...right];
    const comps = species.map(parseFormula);
    const elements = [...new Set(comps.flatMap(c => Object.keys(c)))];
    const M = elements.map(el => species.map((sp, j) => (comps[j][el]||0) * (j < left.length ? 1 : -1)));
    const cols = species.length;

    const rows = M.map(r => r.map(v => [v,1]));
    function red([a,b]){ if (b<0){ a=-a; b=-b; } const g=gcd(a,b); return [a/g, b/g]; }
    const fr = {
      sub:(a,b)=>red([a[0]*b[1]-b[0]*a[1], a[1]*b[1]]),
      mul:(a,b)=>red([a[0]*b[0], a[1]*b[1]]),
      div:(a,b)=>red([a[0]*b[1], a[1]*b[0]]),
    };

    let pivotCols = [], r = 0;
    for (let c = 0; c < cols && r < rows.length; c++){
      let piv = -1;
      for (let i = r; i < rows.length; i++){ if (rows[i][c][0] !== 0){ piv = i; break; } }
      if (piv < 0) continue;
      [rows[r], rows[piv]] = [rows[piv], rows[r]];
      const pv = rows[r][c];
      rows[r] = rows[r].map(v => fr.div(v, pv));
      for (let i = 0; i < rows.length; i++){ if (i !== r && rows[i][c][0] !== 0){ const f = rows[i][c]; rows[i] = rows[i].map((v,k)=>fr.sub(v, fr.mul(f, rows[r][k]))); } }
      pivotCols.push(c); r++;
    }
    const freeCols = [...Array(cols).keys()].filter(c => !pivotCols.includes(c));
    if (freeCols.length !== 1) throw new Error(freeCols.length === 0 ? 'No solution (over-determined).' : 'Underdetermined - multiple independent reactions.');

    const free = freeCols[0];
    const x = new Array(cols).fill([0,1]);
    x[free] = [1,1];
    pivotCols.forEach((pc, idx) => { x[pc] = red([-rows[idx][free][0], rows[idx][free][1]]); });

    let lcm = 1; x.forEach(v => { lcm = lcm/gcd(lcm, v[1])*v[1]; });
    let ints = x.map(v => Math.round(v[0]*lcm/v[1]));
    if (ints.every(v=>v<=0)) ints = ints.map(v=>-v);
    if (ints.some(v=>v<0)) ints = ints.map(v=>-v);
    const g = ints.reduce((a,b)=>gcd(a,b||a), ints[0]||1);
    ints = ints.map(v => v/g);
    if (ints.some(v => v <= 0)) throw new Error('Could not find a positive integer solution.');

    return { species, left, right, ints, elements, comps };
  }

  global.ChemBalance = { parseFormula, balance, gcd };
})(this);
