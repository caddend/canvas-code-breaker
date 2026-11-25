const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const COLORS = [
  '#e06c75', // красный
  '#98c379', // зеленый
  '#61afef', // синий
  '#e5c07b', // желтый
  '#c678dd', // фиолетовый
  '#56b6c2'  // бирюзовый
];

const CODE_LEN = 4;
const MAX_ATTEMPTS = 8;
const PEG_RADIUS = 15;
const PALETTE_RADIUS = 18;

let secretCode = [];
let attempts = [];
let currentGuess = [];
let selectedColorIndex = 0;
let gameState = 'playing'; // 'playing', 'won', 'lost'

function generateSecretCode() {
  const code = [];
  for (let i = 0; i < CODE_LEN; i++) {
    code.push(Math.floor(Math.random() * COLORS.length));
  }
  return code;
}

function initGame() {
  secretCode = generateSecretCode();
  attempts = [];
  currentGuess = [];
  selectedColorIndex = 0;
  gameState = 'playing';
  draw();
}

function evaluateGuess(guess, code) {
  let exact = 0;
  let colorOnly = 0;
  const codeCopy = [...code];
  const guessCopy = [...guess];

  for (let i = 0; i < CODE_LEN; i++) {
    if (guessCopy[i] === codeCopy[i]) {
      exact++;
      guessCopy[i] = -1;
      codeCopy[i] = -2;
    }
  }

  for (let i = 0; i < CODE_LEN; i++) {
    if (guessCopy[i] !== -1) {
      const targetIndex = codeCopy.indexOf(guessCopy[i]);
      if (targetIndex !== -1) {
        colorOnly++;
        codeCopy[targetIndex] = -2;
      }
    }
  }

  return { exact, colorOnly };
}

function submitGuess() {
  if (currentGuess.length !== CODE_LEN || gameState !== 'playing') return;

  const result = evaluateGuess(currentGuess, secretCode);
  attempts.push({ guess: [...currentGuess], ...result });
  currentGuess = [];

  if (result.exact === CODE_LEN) {
    gameState = 'won';
  } else if (attempts.length >= MAX_ATTEMPTS) {
    gameState = 'lost';
  }
  draw();
}

function drawPeg(x, y, radius, color, isHollow = false) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  if (isHollow) {
    ctx.strokeStyle = '#3e4451';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#282c34';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawFeedback(x, y, exact, colorOnly) {
  const positions = [
    { dx: -7, dy: -7 },
    { dx: 7, dy: -7 },
    { dx: -7, dy: 7 },
    { dx: 7, dy: 7 }
  ];

  for (let i = 0; i < CODE_LEN; i++) {
    const fx = x + positions[i].dx;
    const fy = y + positions[i].dy;
    ctx.beginPath();
    ctx.arc(fx, fy, 4, 0, Math.PI * 2);
    if (i < exact) {
      ctx.fillStyle = '#e06c75'; // точное совпадение (позиция и цвет)
      ctx.fill();
    } else if (i < exact + colorOnly) {
      ctx.fillStyle = '#abb2bf'; // совпадение только цвета
      ctx.fill();
    } else {
      ctx.strokeStyle = '#4b5263';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Секретный код / заголовок
  ctx.fillStyle = '#282c34';
  ctx.fillRect(15, 15, 430, 50);
  ctx.strokeStyle = '#3e4451';
  ctx.strokeRect(15, 15, 430, 50);

  for (let i = 0; i < CODE_LEN; i++) {
    const x = 150 + i * 44;
    const y = 40;
    if (gameState === 'playing') {
      drawPeg(x, y, 14, '#3e4451');
      ctx.fillStyle = '#abb2bf';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('?', x, y);
    } else {
      drawPeg(x, y, 14, COLORS[secretCode[i]]);
    }
  }

  // Ряды попыток
  for (let row = 0; row < MAX_ATTEMPTS; row++) {
    const y = 100 + row * 48;
    ctx.fillStyle = row === attempts.length && gameState === 'playing' ? '#2c313a' : '#23272e';
    ctx.fillRect(15, y - 20, 430, 42);

    ctx.fillStyle = '#5c6370';
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${MAX_ATTEMPTS - row}`, 30, y + 5);

    const rowData = attempts[row];
    const isCurrent = row === attempts.length;

    for (let col = 0; col < CODE_LEN; col++) {
      const x = 90 + col * 55;
      if (rowData) {
        drawPeg(x, y, PEG_RADIUS, COLORS[rowData.guess[col]]);
      } else if (isCurrent && col < currentGuess.length) {
        drawPeg(x, y, PEG_RADIUS, COLORS[currentGuess[col]]);
      } else {
        drawPeg(x, y, PEG_RADIUS, '#3e4451', true);
      }
    }

    const fbX = 370;
    if (rowData) {
      drawFeedback(fbX, y, rowData.exact, rowData.colorOnly);
    } else {
      drawFeedback(fbX, y, 0, 0);
    }
  }

  // Палитра выбора цветов
  const paletteY = 520;
  ctx.fillStyle = '#abb2bf';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ВЫБЕРИТЕ ЦВЕТ ДЛЯ ВВОДА', canvas.width / 2, paletteY - 30);

  for (let i = 0; i < COLORS.length; i++) {
    const x = 65 + i * 66;
    drawPeg(x, paletteY, PALETTE_RADIUS, COLORS[i]);
    if (i === selectedColorIndex) {
      ctx.beginPath();
      ctx.arc(x, paletteY, PALETTE_RADIUS + 4, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // Кнопки управления / завершения
  const btnY = 575;
  if (gameState === 'playing') {
    // Кнопка Удалить
    ctx.fillStyle = '#e06c75';
    ctx.fillRect(40, btnY, 90, 40);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('СТЕРЕТЬ', 85, btnY + 24);

    // Кнопка Проверить
    ctx.fillStyle = currentGuess.length === CODE_LEN ? '#98c379' : '#4b5263';
    ctx.fillRect(330, btnY, 90, 40);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('ОТПРАВИТЬ', 375, btnY + 24);
  } else {
    ctx.fillStyle = gameState === 'won' ? '#98c379' : '#e06c75';
    ctx.fillRect(40, btnY, 380, 44);
    ctx.fillStyle = '#1e2227';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    const msg = gameState === 'won' ? 'ПОБЕДА! Сыграть снова' : 'ПОРАЖЕНИЕ! Нажмите для рестарта';
    ctx.fillText(msg, canvas.width / 2, btnY + 27);
  }
}

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (gameState !== 'playing') {
    if (y >= 575 && y <= 620 && x >= 40 && x <= 420) {
      initGame();
    }
    return;
  }

  // Выбор цвета в палитре
  const paletteY = 520;
  for (let i = 0; i < COLORS.length; i++) {
    const cx = 65 + i * 66;
    const dist = Math.hypot(x - cx, y - paletteY);
    if (dist <= PALETTE_RADIUS + 5) {
      selectedColorIndex = i;
      if (currentGuess.length < CODE_LEN) {
        currentGuess.push(selectedColorIndex);
      }
      draw();
      return;
    }
  }

  // Кнопка Удалить
  if (x >= 40 && x <= 130 && y >= 575 && y <= 615) {
    if (currentGuess.length > 0) {
      currentGuess.pop();
      draw();
    }
    return;
  }

  // Кнопка Отправить
  if (x >= 330 && x <= 420 && y >= 575 && y <= 615) {
    submitGuess();
  }
});

initGame();
