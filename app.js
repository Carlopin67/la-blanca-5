// ============================================================
// MOTOR DE AJEDREZ (parser SAN + estado del tablero)
// ============================================================

function createInitialBoard() {
  const empty = () => new Array(8).fill(null);
  const board = [empty(), empty(), empty(), empty(), empty(), empty(), empty(), empty()];
  const backRank = ['R','N','B','Q','K','B','N','R'];
  for (let f = 0; f < 8; f++) {
    board[0][f] = { type: backRank[f], color: 'b' };
    board[1][f] = { type: 'P', color: 'b' };
    board[6][f] = { type: 'P', color: 'w' };
    board[7][f] = { type: backRank[f], color: 'w' };
  }
  return board;
}

function newGameState() {
  return {
    board: createInitialBoard(),
    turn: 'w',
    enPassantTarget: null,
    castling: { wK: true, wQ: true, bK: true, bQ: true },
    moveHistory: [],
    positions: [],
    lastMoveSquares: [null], // {from, to} por posición, para resaltar
    result: null
  };
}

function squareToCoords(square) {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = 8 - parseInt(square[1], 10);
  return { file, rank };
}
function coordsToSquare(file, rank) {
  return String.fromCharCode('a'.charCodeAt(0) + file) + (8 - rank);
}
function inBounds(file, rank) { return file >= 0 && file < 8 && rank >= 0 && rank < 8; }
function pieceAt(board, file, rank) { return inBounds(file, rank) ? board[rank][file] : null; }

function isPathClear(board, fromFile, fromRank, toFile, toRank) {
  const dFile = Math.sign(toFile - fromFile);
  const dRank = Math.sign(toRank - fromRank);
  let f = fromFile + dFile, r = fromRank + dRank;
  while (f !== toFile || r !== toRank) {
    if (pieceAt(board, f, r)) return false;
    f += dFile; r += dRank;
  }
  return true;
}

function canPieceReach(state, piece, fromFile, fromRank, toFile, toRank, isCapture) {
  const board = state.board;
  const dFile = toFile - fromFile;
  const dRank = toRank - fromRank;
  switch (piece.type) {
    case 'N':
      return (Math.abs(dFile) === 1 && Math.abs(dRank) === 2) ||
             (Math.abs(dFile) === 2 && Math.abs(dRank) === 1);
    case 'B':
      if (Math.abs(dFile) !== Math.abs(dRank)) return false;
      return isPathClear(board, fromFile, fromRank, toFile, toRank);
    case 'R':
      if (dFile !== 0 && dRank !== 0) return false;
      return isPathClear(board, fromFile, fromRank, toFile, toRank);
    case 'Q':
      if (dFile !== 0 && dRank !== 0 && Math.abs(dFile) !== Math.abs(dRank)) return false;
      return isPathClear(board, fromFile, fromRank, toFile, toRank);
    case 'K':
      return Math.abs(dFile) <= 1 && Math.abs(dRank) <= 1 && (dFile !== 0 || dRank !== 0);
    case 'P': {
      const direction = piece.color === 'w' ? -1 : 1;
      const startRank = piece.color === 'w' ? 6 : 1;
      if (isCapture) {
        return dRank === direction && Math.abs(dFile) === 1;
      } else {
        if (dFile !== 0) return false;
        if (dRank === direction && !pieceAt(board, toFile, toRank)) return true;
        if (dRank === 2 * direction && fromRank === startRank &&
            !pieceAt(board, toFile, fromRank + direction) &&
            !pieceAt(board, toFile, toRank)) return true;
        return false;
      }
    }
  }
  return false;
}

function findSourceSquares(state, pieceType, color, toFile, toRank, isCapture, hintFile, hintRank) {
  const board = state.board;
  const candidates = [];
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const p = pieceAt(board, f, r);
      if (!p || p.color !== color || p.type !== pieceType) continue;
      if (hintFile !== null && f !== hintFile) continue;
      if (hintRank !== null && r !== hintRank) continue;
      if (canPieceReach(state, p, f, r, toFile, toRank, isCapture)) {
        candidates.push({ file: f, rank: r });
      }
    }
  }
  return candidates;
}

const SAN_REGEX = /^([NBRQK]?)([a-h]?)([1-8]?)(x?)([a-h][1-8])(=([NBRQ]))?[+#]?$/;

function parseSANToken(token) {
  if (token === 'O-O' || token === '0-0') return { castle: 'K' };
  if (token === 'O-O-O' || token === '0-0-0') return { castle: 'Q' };
  const match = SAN_REGEX.exec(token);
  if (!match) return null;
  const [, pieceLetter, hintFileChar, hintRankChar, captureFlag, destSquare, , promotion] = match;
  return {
    pieceType: pieceLetter || 'P',
    hintFile: hintFileChar ? hintFileChar.charCodeAt(0) - 'a'.charCodeAt(0) : null,
    hintRank: hintRankChar ? 8 - parseInt(hintRankChar, 10) : null,
    isCapture: captureFlag === 'x',
    dest: squareToCoords(destSquare),
    promotion: promotion || null
  };
}

function applyMove(state, token) {
  const board = state.board;
  const color = state.turn;
  const parsed = parseSANToken(token);
  if (!parsed) { console.warn('No se pudo parsear:', token); return false; }

  let movedFrom = null, movedTo = null;

  if (parsed.castle) {
    const rank = color === 'w' ? 7 : 0;
    if (parsed.castle === 'K') {
      board[rank][6] = board[rank][4]; board[rank][4] = null;
      board[rank][5] = board[rank][7]; board[rank][7] = null;
      movedFrom = coordsToSquare(4, rank); movedTo = coordsToSquare(6, rank);
    } else {
      board[rank][2] = board[rank][4]; board[rank][4] = null;
      board[rank][3] = board[rank][0]; board[rank][0] = null;
      movedFrom = coordsToSquare(4, rank); movedTo = coordsToSquare(2, rank);
    }
    state.castling[color + 'K'] = false;
    state.castling[color + 'Q'] = false;
  } else {
    const { file: toFile, rank: toRank } = parsed.dest;
    const candidates = findSourceSquares(
      state, parsed.pieceType, color, toFile, toRank,
      parsed.isCapture, parsed.hintFile, parsed.hintRank
    );
    if (candidates.length === 0) { console.warn('Sin origen válido para:', token); return false; }
    const { file: fromFile, rank: fromRank } = candidates[0];
    const movingPiece = board[fromRank][fromFile];

    if (parsed.pieceType === 'P' && parsed.isCapture && !pieceAt(board, toFile, toRank)) {
      const capturedRank = toRank + (color === 'w' ? 1 : -1);
      board[capturedRank][toFile] = null;
    }

    board[toRank][toFile] = movingPiece;
    board[fromRank][fromFile] = null;

    if (parsed.promotion) board[toRank][toFile] = { type: parsed.promotion, color };

    if (movingPiece.type === 'K') {
      state.castling[color + 'K'] = false;
      state.castling[color + 'Q'] = false;
    }
    if (movingPiece.type === 'R') {
      if (fromFile === 0) state.castling[color + 'Q'] = false;
      if (fromFile === 7) state.castling[color + 'K'] = false;
    }

    movedFrom = coordsToSquare(fromFile, fromRank);
    movedTo = coordsToSquare(toFile, toRank);

    if (parsed.pieceType === 'P' && Math.abs(toRank - fromRank) === 2) {
      state.enPassantTarget = { file: toFile, rank: (toRank + fromRank) / 2 };
    } else {
      state.enPassantTarget = null;
    }
  }

  state.turn = color === 'w' ? 'b' : 'w';
  state.moveHistory.push(token);
  state.positions.push(JSON.parse(JSON.stringify(board)));
  state.lastMoveSquares.push({ from: movedFrom, to: movedTo });
  return true;
}

function loadGame(pgnText) {
  const state = newGameState();
  state.positions.push(JSON.parse(JSON.stringify(state.board)));

  const resultMatch = pgnText.match(/(1-0|0-1|1\/2-1\/2|\*)\s*$/);
  if (resultMatch) {
    state.result = resultMatch[1];
    pgnText = pgnText.slice(0, resultMatch.index);
  }

  const tokens = pgnText
    .replace(/\d+\.(\.\.)?/g, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(t => t.length > 0);

  for (const token of tokens) applyMove(state, token);
  return state;
}


// ============================================================
// UI / REPRODUCTOR
// ============================================================

let gameState = null;
let currentPly = 0;

const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const moveStripEl = document.getElementById('moveStrip');
const pgnInput = document.getElementById('pgnInput');

function renderBoard(boardArray, highlight) {
  boardEl.innerHTML = '';
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const sq = document.createElement('div');
      const isLight = (r + f) % 2 === 0;
      sq.className = 'square ' + (isLight ? 'light' : 'dark');
      const square = coordsToSquare(f, r);
      if (highlight) {
        if (highlight.from === square) sq.classList.add('highlight-from');
        if (highlight.to === square) sq.classList.add('highlight-to');
      }
      const piece = boardArray[r][f];
      if (piece) {
        const pieceEl = document.createElement('div');
        pieceEl.className = 'piece ' + (piece.color === 'w' ? 'white-piece' : 'black-piece');
        pieceEl.innerHTML = getPieceSVG(piece.type, piece.color);
        sq.appendChild(pieceEl);
      }
      boardEl.appendChild(sq);
    }
  }
}

function renderStatus() {
  const total = gameState.positions.length - 1;
  let text = `Jugada ${currentPly} / ${total}`;
  if (currentPly === total && gameState.result) {
    const resultLabel = { '1-0': 'Ganan blancas', '0-1': 'Ganan negras', '1/2-1/2': 'Tablas' }[gameState.result] || gameState.result;
    text += ` · ${resultLabel}`;
  }
  statusEl.textContent = text;
  document.getElementById('prevBtn').disabled = currentPly === 0;
  document.getElementById('nextBtn').disabled = currentPly === total;
}

// ---------- Tira de contexto: un par de jugadas antes y después ----------
function moveLabel(ply) {
  if (ply === 0) return 'Inicio';
  const moveNumber = Math.ceil(ply / 2);
  const san = gameState.moveHistory[ply - 1];
  const isWhiteMove = ply % 2 === 1;
  return isWhiteMove ? `${moveNumber}.${san}` : `${san}`;
}

function renderMoveStrip() {
  moveStripEl.innerHTML = '';
  const total = gameState.positions.length - 1;
  const windowRadius = 2;

  for (let offset = -windowRadius; offset <= windowRadius; offset++) {
    const ply = currentPly + offset;
    const chip = document.createElement('div');
    chip.className = 'moveChip';

    if (ply < 0 || ply > total) {
      chip.classList.add('empty');
    } else {
      let label = moveLabel(ply);
      // si el primer chip visible es una jugada negra y su pareja blanca
      // no entra en la ventana, anteponemos el número con "..."
      if (offset === -windowRadius && ply > 0 && ply % 2 === 0 && (ply - 1) < (currentPly - windowRadius)) {
        label = `${Math.ceil(ply / 2)}...${gameState.moveHistory[ply - 1]}`;
      }
      chip.textContent = label;
      if (offset === 0) chip.classList.add('current');
      else chip.classList.add('dim' + Math.abs(offset));
      if (hasNote(ply)) chip.classList.add('hasNote');
      if (ply !== currentPly) {
        chip.addEventListener('click', () => { stopAutoplay(); goToPly(ply); });
      }
    }
    moveStripEl.appendChild(chip);
  }
}

// ---------- Notas por jugada (persistentes, el alma de la app) ----------
const notesArea = document.getElementById('notesArea');
const notesLabelEl = document.getElementById('notesLabel');
let notesSaveTimer = null;

function simpleHash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) hash = ((hash << 5) + hash) + str.charCodeAt(i);
  return (hash >>> 0).toString(36);
}

function currentGameId() {
  return simpleHash(gameState.moveHistory.join(' ') || 'partida-vacia');
}

function noteKey(ply) {
  return `chess-notes:${currentGameId()}:${ply}`;
}

function hasNote(ply) {
  try { return !!localStorage.getItem(noteKey(ply)); } catch (e) { return false; }
}

function loadNote(ply) {
  try { return localStorage.getItem(noteKey(ply)) || ''; } catch (e) { return ''; }
}

function saveNote(ply, text) {
  try {
    if (text.trim()) localStorage.setItem(noteKey(ply), text);
    else localStorage.removeItem(noteKey(ply));
  } catch (e) { /* almacenamiento no disponible: se ignora silenciosamente */ }
}

function renderNotesForCurrentPly() {
  const label = currentPly === 0 ? 'Inicio' : moveLabel(currentPly);
  notesLabelEl.innerHTML = `Notas · <span class="notesLabelMove">${label}</span>`;
  notesArea.value = loadNote(currentPly);
}

notesArea.addEventListener('input', () => {
  clearTimeout(notesSaveTimer);
  const ply = currentPly;
  const text = notesArea.value;
  notesSaveTimer = setTimeout(() => { saveNote(ply, text); renderMoveStrip(); }, 350);
});

function goToPly(ply) {
  const total = gameState.positions.length - 1;
  currentPly = Math.max(0, Math.min(ply, total));
  renderBoard(gameState.positions[currentPly], gameState.lastMoveSquares[currentPly]);
  renderStatus();
  renderMoveStrip();
  renderNotesForCurrentPly();
}

function stepForward() { goToPly(currentPly + 1); }
function stepBackward() { goToPly(currentPly - 1); }

function loadFromInput() {
  gameState = loadGame(pgnInput.value);
  currentPly = 0;
  goToPly(0);
}

// ---------- Mantener pulsado: avance/retroceso acelerado ----------
// Toque simple = un paso. Mantener pulsado = repetición que se
// acelera moderadamente cuanto más tiempo se mantiene.
function bindHold(button, action, atBoundary) {
  let holdTimeout = null;
  let holdInterval = null;
  let steps = 0;
  let interval = 260;

  function tick() {
    action();
    steps++;
    if (atBoundary()) { stop(); return; }
    if (steps % 5 === 0 && interval > 90) {
      interval = Math.max(90, interval - 35);
      clearInterval(holdInterval);
      holdInterval = setInterval(tick, interval);
    }
  }

  function stop() {
    clearTimeout(holdTimeout);
    clearInterval(holdInterval);
    holdTimeout = null;
    holdInterval = null;
    steps = 0;
    interval = 260;
  }

  button.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    action();
    if (atBoundary()) return;
    holdTimeout = setTimeout(() => {
      holdInterval = setInterval(tick, interval);
    }, 380);
  });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(evt =>
    button.addEventListener(evt, stop)
  );
}

// ---------- Controles ----------
bindHold(document.getElementById('prevBtn'), stepBackward, () => currentPly === 0);
bindHold(document.getElementById('nextBtn'), stepForward, () => currentPly === gameState.positions.length - 1);

// ---------- Iconos de los botones (inyectados por JS, nada de emoji) ----------
document.getElementById('prevBtn').innerHTML = iconButton('prev');
document.getElementById('nextBtn').innerHTML = iconButton('next');
document.getElementById('logoMark').innerHTML = iconButton('knight');

// ---------- Registro del Service Worker ----------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.warn('SW no registrado:', err));
  });
}

// ---------- Partida de ejemplo al iniciar ----------
loadFromInput();
