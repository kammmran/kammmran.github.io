// Shared color utilities for academy color tools.
// All functions are pure and return plain objects / strings.
(function (global) {

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function hexToRgb(hex) {
    if (!hex) return null;
    hex = hex.trim().replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    if (hex.length === 8) hex = hex.slice(0, 6);
    if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
    return { r: parseInt(hex.slice(0,2), 16), g: parseInt(hex.slice(2,4), 16), b: parseInt(hex.slice(4,6), 16) };
  }

  function rgbToHex(r, g, b) {
    const toHex = n => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
    return '#' + toHex(r) + toHex(g) + toHex(b);
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360 / 360;
    s = clamp(s, 0, 100) / 100;
    l = clamp(l, 0, 100) / 100;
    let r, g, b;
    if (s === 0) { r = g = b = l; }
    else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1; if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }

  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d = max - min;
    const v = max;
    const s = max === 0 ? 0 : d / max;
    let h = 0;
    if (d !== 0) {
      switch (max) {
        case r: h = ((g - b) / d) % 6; break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h = (h * 60 + 360) % 360;
    }
    return { h, s: s * 100, v: v * 100 };
  }

  function hsvToRgb(h, s, v) {
    h = ((h % 360) + 360) % 360 / 360;
    s = clamp(s, 0, 100) / 100;
    v = clamp(v, 0, 100) / 100;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    let r, g, b;
    switch (i % 6) {
      case 0: r = v; g = t; b = p; break;
      case 1: r = q; g = v; b = p; break;
      case 2: r = p; g = v; b = t; break;
      case 3: r = p; g = q; b = v; break;
      case 4: r = t; g = p; b = v; break;
      case 5: r = v; g = p; b = q; break;
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
  }

  function rgbToCmyk(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const k = 1 - Math.max(r, g, b);
    if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
    const c = (1 - r - k) / (1 - k);
    const m = (1 - g - k) / (1 - k);
    const y = (1 - b - k) / (1 - k);
    return { c: c * 100, m: m * 100, y: y * 100, k: k * 100 };
  }

  function rgbToHwb(r, g, b) {
    const hsv = rgbToHsv(r, g, b);
    const rN = r / 255, gN = g / 255, bN = b / 255;
    const w = Math.min(rN, gN, bN) * 100;
    const bl = (1 - Math.max(rN, gN, bN)) * 100;
    return { h: hsv.h, w, b: bl };
  }

  // sRGB -> Linear -> OKLab -> OKLCH
  function srgbToLinear(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function rgbToOklab(r, g, b) {
    const lr = srgbToLinear(r), lg = srgbToLinear(g), lb = srgbToLinear(b);
    const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
    const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
    const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
    const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
    return {
      L: 0.2104542553*l_ + 0.7936177850*m_ - 0.0040720468*s_,
      a: 1.9779984951*l_ - 2.4285922050*m_ + 0.4505937099*s_,
      b: 0.0259040371*l_ + 0.7827717662*m_ - 0.8086757660*s_
    };
  }
  function rgbToOklch(r, g, b) {
    const { L, a, b: bb } = rgbToOklab(r, g, b);
    const c = Math.sqrt(a * a + bb * bb);
    let h = Math.atan2(bb, a) * 180 / Math.PI;
    if (h < 0) h += 360;
    return { l: L, c, h };
  }

  // WCAG relative luminance
  function relativeLuminance(r, g, b) {
    return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
  }

  function contrastRatio(rgb1, rgb2) {
    const l1 = relativeLuminance(rgb1.r, rgb1.g, rgb1.b);
    const l2 = relativeLuminance(rgb2.r, rgb2.g, rgb2.b);
    const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  // CSS named colors (subset of full list — covers all 148 names)
  const NAMED = {
    'aliceblue':'#f0f8ff','antiquewhite':'#faebd7','aqua':'#00ffff','aquamarine':'#7fffd4','azure':'#f0ffff','beige':'#f5f5dc','bisque':'#ffe4c4','black':'#000000','blanchedalmond':'#ffebcd','blue':'#0000ff','blueviolet':'#8a2be2','brown':'#a52a2a','burlywood':'#deb887','cadetblue':'#5f9ea0','chartreuse':'#7fff00','chocolate':'#d2691e','coral':'#ff7f50','cornflowerblue':'#6495ed','cornsilk':'#fff8dc','crimson':'#dc143c','cyan':'#00ffff','darkblue':'#00008b','darkcyan':'#008b8b','darkgoldenrod':'#b8860b','darkgray':'#a9a9a9','darkgreen':'#006400','darkkhaki':'#bdb76b','darkmagenta':'#8b008b','darkolivegreen':'#556b2f','darkorange':'#ff8c00','darkorchid':'#9932cc','darkred':'#8b0000','darksalmon':'#e9967a','darkseagreen':'#8fbc8f','darkslateblue':'#483d8b','darkslategray':'#2f4f4f','darkturquoise':'#00ced1','darkviolet':'#9400d3','deeppink':'#ff1493','deepskyblue':'#00bfff','dimgray':'#696969','dodgerblue':'#1e90ff','firebrick':'#b22222','floralwhite':'#fffaf0','forestgreen':'#228b22','fuchsia':'#ff00ff','gainsboro':'#dcdcdc','ghostwhite':'#f8f8ff','gold':'#ffd700','goldenrod':'#daa520','gray':'#808080','green':'#008000','greenyellow':'#adff2f','honeydew':'#f0fff0','hotpink':'#ff69b4','indianred':'#cd5c5c','indigo':'#4b0082','ivory':'#fffff0','khaki':'#f0e68c','lavender':'#e6e6fa','lavenderblush':'#fff0f5','lawngreen':'#7cfc00','lemonchiffon':'#fffacd','lightblue':'#add8e6','lightcoral':'#f08080','lightcyan':'#e0ffff','lightgoldenrodyellow':'#fafad2','lightgray':'#d3d3d3','lightgreen':'#90ee90','lightpink':'#ffb6c1','lightsalmon':'#ffa07a','lightseagreen':'#20b2aa','lightskyblue':'#87cefa','lightslategray':'#778899','lightsteelblue':'#b0c4de','lightyellow':'#ffffe0','lime':'#00ff00','limegreen':'#32cd32','linen':'#faf0e6','magenta':'#ff00ff','maroon':'#800000','mediumaquamarine':'#66cdaa','mediumblue':'#0000cd','mediumorchid':'#ba55d3','mediumpurple':'#9370db','mediumseagreen':'#3cb371','mediumslateblue':'#7b68ee','mediumspringgreen':'#00fa9a','mediumturquoise':'#48d1cc','mediumvioletred':'#c71585','midnightblue':'#191970','mintcream':'#f5fffa','mistyrose':'#ffe4e1','moccasin':'#ffe4b5','navajowhite':'#ffdead','navy':'#000080','oldlace':'#fdf5e6','olive':'#808000','olivedrab':'#6b8e23','orange':'#ffa500','orangered':'#ff4500','orchid':'#da70d6','palegoldenrod':'#eee8aa','palegreen':'#98fb98','paleturquoise':'#afeeee','palevioletred':'#db7093','papayawhip':'#ffefd5','peachpuff':'#ffdab9','peru':'#cd853f','pink':'#ffc0cb','plum':'#dda0dd','powderblue':'#b0e0e6','purple':'#800080','rebeccapurple':'#663399','red':'#ff0000','rosybrown':'#bc8f8f','royalblue':'#4169e1','saddlebrown':'#8b4513','salmon':'#fa8072','sandybrown':'#f4a460','seagreen':'#2e8b57','seashell':'#fff5ee','sienna':'#a0522d','silver':'#c0c0c0','skyblue':'#87ceeb','slateblue':'#6a5acd','slategray':'#708090','snow':'#fffafa','springgreen':'#00ff7f','steelblue':'#4682b4','tan':'#d2b48c','teal':'#008080','thistle':'#d8bfd8','tomato':'#ff6347','turquoise':'#40e0d0','violet':'#ee82ee','wheat':'#f5deb3','white':'#ffffff','whitesmoke':'#f5f5f5','yellow':'#ffff00','yellowgreen':'#9acd32'
  };

  function closestName(r, g, b) {
    let best = null, bestD = Infinity;
    for (const [name, hex] of Object.entries(NAMED)) {
      const c = hexToRgb(hex);
      const d = (r - c.r) ** 2 + (g - c.g) ** 2 + (b - c.b) ** 2;
      if (d < bestD) { bestD = d; best = name; }
    }
    return best;
  }

  function nameToHex(name) { return NAMED[name.toLowerCase()] || null; }

  // Parse arbitrary CSS color string
  function parse(str) {
    if (!str) return null;
    str = str.trim().toLowerCase();
    if (str[0] === '#') return hexToRgb(str);
    if (NAMED[str]) return hexToRgb(NAMED[str]);
    let m;
    if ((m = str.match(/^rgba?\(([^)]+)\)/))) {
      const parts = m[1].split(/[,\s\/]+/).filter(Boolean).map(parseFloat);
      return { r: parts[0], g: parts[1], b: parts[2] };
    }
    if ((m = str.match(/^hsla?\(([^)]+)\)/))) {
      const parts = m[1].split(/[,\s\/]+/).filter(Boolean);
      const h = parseFloat(parts[0]);
      const s = parseFloat(parts[1]);
      const l = parseFloat(parts[2]);
      return hslToRgb(h, s, l);
    }
    return null;
  }

  // Color-blindness simulation matrices (Brettel/Vienot/Mollon model, simplified Machado 2009 approximations)
  const CB_MATRICES = {
    protanopia:   [[0.567, 0.433, 0], [0.558, 0.442, 0], [0, 0.242, 0.758]],
    protanomaly:  [[0.817, 0.183, 0], [0.333, 0.667, 0], [0, 0.125, 0.875]],
    deuteranopia: [[0.625, 0.375, 0], [0.7, 0.3, 0], [0, 0.3, 0.7]],
    deuteranomaly:[[0.8, 0.2, 0], [0.258, 0.742, 0], [0, 0.142, 0.858]],
    tritanopia:   [[0.95, 0.05, 0], [0, 0.433, 0.567], [0, 0.475, 0.525]],
    tritanomaly:  [[0.967, 0.033, 0], [0, 0.733, 0.267], [0, 0.183, 0.817]],
    achromatopsia:[[0.299, 0.587, 0.114], [0.299, 0.587, 0.114], [0.299, 0.587, 0.114]],
    achromatomaly:[[0.618, 0.320, 0.062], [0.163, 0.775, 0.062], [0.163, 0.320, 0.516]]
  };

  function simulateCb(r, g, b, type) {
    const m = CB_MATRICES[type];
    if (!m) return { r, g, b };
    return {
      r: clamp(Math.round(m[0][0] * r + m[0][1] * g + m[0][2] * b), 0, 255),
      g: clamp(Math.round(m[1][0] * r + m[1][1] * g + m[1][2] * b), 0, 255),
      b: clamp(Math.round(m[2][0] * r + m[2][1] * g + m[2][2] * b), 0, 255)
    };
  }

  global.ColorLib = {
    clamp, hexToRgb, rgbToHex, rgbToHsl, hslToRgb, rgbToHsv, hsvToRgb,
    rgbToCmyk, rgbToHwb, rgbToOklch, contrastRatio, relativeLuminance,
    closestName, nameToHex, parse, simulateCb, NAMED, CB_MATRICES
  };
})(window);
