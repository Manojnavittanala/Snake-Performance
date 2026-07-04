const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("bestScore");
const speedLabel = document.getElementById("speedLabel");
const overlay = document.getElementById("overlay");
const overlayKicker = document.getElementById("overlayKicker");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const startButton = document.getElementById("startButton");
const pauseButton = document.getElementById("pauseButton");
const restartButton = document.getElementById("restartButton");
const soundButton = document.getElementById("soundButton");
const difficultyButtons = document.querySelectorAll(".difficulty-button");
const directionButtons = document.querySelectorAll("[data-direction]");

const gridSize = 20;
const tileCount = canvas.width / gridSize;
const startSnake = [
  { x: 8, y: 14 },
  { x: 7, y: 14 },
  { x: 6, y: 14 }
];

let snake;
let food;
let direction;
let nextDirection;
let score;
let bestScore = Number(localStorage.getItem("snakeBestScore")) || 0;
let gameTimer;
let gameSpeed = 120;
let running = false;
let paused = false;
let soundEnabled = true;

const colors = {
  board: "#11150f",
  grid: "rgba(233, 239, 221, 0.055)",
  snakeHead: "#8af07f",
  snakeBody: "#45b657",
  snakeBodyAlt: "#359649",
  food: "#f0c85b",
  foodCore: "#eb6a5f"
};

function resetGame() {
  snake = startSnake.map((segment) => ({ ...segment }));
  direction = { x: 1, y: 0 };
  nextDirection = { x: 1, y: 0 };
  score = 0;
  scoreEl.textContent = score;
  bestScoreEl.textContent = bestScore;
  placeFood();
  draw();
}

function startGame() {
  if (running && !paused) return;

  if (!running) {
    resetGame();
  }

  running = true;
  paused = false;
  hideOverlay();
  clearInterval(gameTimer);
  gameTimer = setInterval(gameLoop, gameSpeed);
}

function pauseGame() {
  if (!running) return;

  paused = !paused;
  clearInterval(gameTimer);

  if (paused) {
    showOverlay("Paused", "Take a breath", "Press Space or tap Pause to continue.");
  } else {
    hideOverlay();
    gameTimer = setInterval(gameLoop, gameSpeed);
  }
}

function restartGame() {
  clearInterval(gameTimer);
  running = false;
  paused = false;
  startGame();
}

function gameLoop() {
  direction = nextDirection;

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  if (hasCollision(head)) {
    endGame();
    return;
  }

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreEl.textContent = score;
    playTone(660, 0.06);
    placeFood();
  } else {
    snake.pop();
  }

  draw();
}

function hasCollision(head) {
  const hitWall = head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount;
  const hitSelf = snake.some((segment) => segment.x === head.x && segment.y === head.y);

  return hitWall || hitSelf;
}

function endGame() {
  clearInterval(gameTimer);
  running = false;
  paused = false;
  playTone(180, 0.16);

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("snakeBestScore", String(bestScore));
    bestScoreEl.textContent = bestScore;
  }

  showOverlay("Game Over", `Score ${score}`, "Press Start, Restart, or Space to play again.");
}

function placeFood() {
  do {
    food = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };
  } while (snake.some((segment) => segment.x === food.x && segment.y === food.y));
}

function draw() {
  ctx.fillStyle = colors.board;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawFood();
  drawSnake();
}

function drawGrid() {
  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;

  for (let i = 0; i <= tileCount; i += 1) {
    const position = i * gridSize + 0.5;
    ctx.beginPath();
    ctx.moveTo(position, 0);
    ctx.lineTo(position, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, position);
    ctx.lineTo(canvas.width, position);
    ctx.stroke();
  }
}

function drawSnake() {
  snake.forEach((segment, index) => {
    const isHead = index === 0;
    const inset = isHead ? 2 : 3;
    const x = segment.x * gridSize + inset;
    const y = segment.y * gridSize + inset;
    const size = gridSize - inset * 2;

    ctx.fillStyle = isHead
      ? colors.snakeHead
      : index % 2 === 0
        ? colors.snakeBody
        : colors.snakeBodyAlt;
    roundRect(x, y, size, size, isHead ? 6 : 5);
    ctx.fill();
  });
}

function drawFood() {
  const centerX = food.x * gridSize + gridSize / 2;
  const centerY = food.y * gridSize + gridSize / 2;

  ctx.fillStyle = colors.food;
  ctx.beginPath();
  ctx.arc(centerX, centerY, gridSize * 0.38, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = colors.foodCore;
  ctx.beginPath();
  ctx.arc(centerX + 2, centerY - 2, gridSize * 0.16, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

function setDirection(newDirection) {
  const directions = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  };

  const requested = directions[newDirection];
  if (!requested) return;

  const reversing = requested.x === -direction.x && requested.y === -direction.y;
  if (!reversing) {
    nextDirection = requested;
  }
}

function setDifficulty(speed) {
  gameSpeed = Number(speed);
  const multiplier = Math.round((120 / gameSpeed) * 10) / 10;
  speedLabel.textContent = `${multiplier}x`;

  if (running && !paused) {
    clearInterval(gameTimer);
    gameTimer = setInterval(gameLoop, gameSpeed);
  }
}

function showOverlay(kicker, title, text) {
  overlayKicker.textContent = kicker;
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlay.classList.add("is-visible");
}

function hideOverlay() {
  overlay.classList.remove("is-visible");
}

function playTone(frequency, duration) {
  if (!soundEnabled) return;

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const audio = new AudioContext();
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();

  oscillator.frequency.value = frequency;
  oscillator.type = "square";
  gain.gain.setValueAtTime(0.04, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);

  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + duration);
}

document.addEventListener("keydown", (event) => {
  const keyMap = {
    ArrowUp: "up",
    w: "up",
    W: "up",
    ArrowDown: "down",
    s: "down",
    S: "down",
    ArrowLeft: "left",
    a: "left",
    A: "left",
    ArrowRight: "right",
    d: "right",
    D: "right"
  };

  if (keyMap[event.key]) {
    event.preventDefault();
    setDirection(keyMap[event.key]);
  }

  if (event.code === "Space") {
    event.preventDefault();
    if (running) {
      pauseGame();
    } else {
      startGame();
    }
  }
});

startButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", pauseGame);
restartButton.addEventListener("click", restartGame);

soundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundButton.classList.toggle("is-muted", !soundEnabled);
});

difficultyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    difficultyButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    setDifficulty(button.dataset.speed);
  });
});

directionButtons.forEach((button) => {
  button.addEventListener("click", () => setDirection(button.dataset.direction));
});

resetGame();
