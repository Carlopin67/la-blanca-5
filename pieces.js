// ============================================================
// PIEZAS PROPIAS EN SVG — estilo clásico blanco/negro
// Dibujadas a medida (no dependen de fuentes del sistema, que
// renderizan los símbolos Unicode de ajedrez de forma poco fiable
// e ignoran el color en algunas plataformas/iOS).
// ============================================================

const PIECE_PALETTE = {
  w: { fill: '#fefdfb', stroke: '#1a1712', accent: '#1a1712' },
  b: { fill: '#232019', stroke: '#000000', accent: '#fefdfb' }
};

function svgWrap(inner) {
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">${inner}</svg>`;
}

function base(fill, stroke, w = 46, cx = 50, y = 84, h = 9) {
  return `<rect x="${cx - w/2}" y="${y}" width="${w}" height="${h}" rx="4"
    fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>`;
}

const PIECE_BUILDERS = {
  P: (c) => {
    const { fill, stroke } = PIECE_PALETTE[c];
    return svgWrap(`
      ${base(fill, stroke, 40, 50, 82, 9)}
      <polygon points="40,82 60,82 68,68 32,68" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
      <circle cx="50" cy="46" r="17" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
    `);
  },

  R: (c) => {
    const { fill, stroke } = PIECE_PALETTE[c];
    return svgWrap(`
      ${base(fill, stroke, 54, 50, 84, 9)}
      <polygon points="32,84 68,84 64,52 36,52" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
      <rect x="30" y="34" width="40" height="12" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
      <rect x="30" y="18" width="10" height="18" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
      <rect x="45" y="18" width="10" height="18" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
      <rect x="60" y="18" width="10" height="18" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
    `);
  },

  N: (c) => {
    const { fill, stroke, accent } = PIECE_PALETTE[c];
    const pts = [
      [28,86],[72,86],
      [70,66],[75,50],[68,40],
      [77,32],[83,26],
      [69,20],[59,13],
      [54,20],[58,6],[50,15],
      [46,4],[40,17],
      [34,26],[30,40],
      [26,56],[30,72]
    ].map(p => p.join(',')).join(' ');
    return svgWrap(`
      ${base(fill, stroke, 46, 50, 86, 8)}
      <polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="66" cy="32" r="2.8" fill="${accent}"/>
    `);
  },

  B: (c) => {
    const { fill, stroke } = PIECE_PALETTE[c];
    return svgWrap(`
      ${base(fill, stroke, 44, 50, 84, 9)}
      <polygon points="34,84 66,84 62,54 38,54" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
      <polygon points="38,54 62,54 57,42 43,42" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
      <circle cx="50" cy="28" r="15" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
      <rect x="47" y="10" width="6" height="9" rx="2" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
      <circle cx="50" cy="8" r="4.5" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
    `);
  },

  Q: (c) => {
    const { fill, stroke } = PIECE_PALETTE[c];
    const balls = [
      [30, 30, 6.5], [40, 22, 7], [50, 17, 8], [60, 22, 7], [70, 30, 6.5]
    ].map(([x,y,r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>`).join('');
    return svgWrap(`
      ${base(fill, stroke, 50, 50, 84, 9)}
      <polygon points="30,84 70,84 65,50 35,50" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
      <rect x="28" y="36" width="44" height="14" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
      ${balls}
    `);
  },

  K: (c) => {
    const { fill, stroke } = PIECE_PALETTE[c];
    return svgWrap(`
      ${base(fill, stroke, 50, 50, 84, 9)}
      <polygon points="30,84 70,84 64,44 36,44" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
      <rect x="33" y="34" width="34" height="10" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
      <path d="M 36 34 A 14 14 0 0 1 64 34 Z" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
      <rect x="46.5" y="9" width="7" height="15" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
      <rect x="40" y="14.5" width="20" height="6" fill="${fill}" stroke="${stroke}" stroke-width="2.5"/>
    `);
  }
};

function getPieceSVG(type, color) {
  return PIECE_BUILDERS[type](color);
}
