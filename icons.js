// ============================================================
// ICONOS PROPIOS — controles e interfaz
// Todo vectorial, ningún emoji ni carácter de teclado.
// ============================================================

function iconSVG(paths, viewBox = '0 0 24 24') {
  return `<svg viewBox="${viewBox}" fill="currentColor">${paths}</svg>`;
}

const ICONS = {
  prev: iconSVG('<polygon points="16,4 16,20 6,12"/>'),
  next: iconSVG('<polygon points="8,4 8,20 18,12"/>'),

  add: iconSVG('<rect x="10.5" y="4" width="3" height="16" rx="1.2"/><rect x="4" y="10.5" width="16" height="3" rx="1.2"/>'),

  close: iconSVG(`<rect x="10.5" y="2" width="3" height="20" rx="1.2" transform="rotate(45 12 12)"/>
                  <rect x="10.5" y="2" width="3" height="20" rx="1.2" transform="rotate(-45 12 12)"/>`),

  knight: iconSVG(`<path d="M6 20 h12 l-1.5-6 2-4 -2-3 1-3 -3-2 -3 1 -2 3 -2 4 -1.5 6 z" />`,
                   '0 0 24 24')
};

function iconButton(name) { return ICONS[name] || ''; }
