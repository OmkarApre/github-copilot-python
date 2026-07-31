// Client-side rendering and interaction for the Flask-backed Sudoku.
const SIZE = 9;
const BOX_SIZE = 3;
let puzzle = [];
let solution = [];
let currentDifficulty = 'easy';
let hintsUsed = 0;
let timerInterval = null;
let secondsElapsed = 0;
let gameActive = false;

function createBoardElement() {
  const boardDiv = document.getElementById('sudoku-board');
  boardDiv.innerHTML = '';

  for (let i = 0; i < SIZE; i++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'sudoku-row';
    for (let j = 0; j < SIZE; j++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.maxLength = 1;
      input.className = 'sudoku-cell';
      input.dataset.row = i;
      input.dataset.col = j;
      const boxClass = ((Math.floor(i / BOX_SIZE) + Math.floor(j / BOX_SIZE)) % 2 === 0) ? 'box-even' : 'box-odd';
      input.classList.add(boxClass);
      rowDiv.appendChild(input);
    }
    boardDiv.appendChild(rowDiv);
  }
}

function setMessage(text, type = 'info') {
  const msg = document.getElementById('message');
  msg.textContent = text;
  msg.dataset.type = type;
}

function formatTime(totalSeconds) {
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function updateTimer() {
  document.getElementById('timer').textContent = `Time: ${formatTime(secondsElapsed)}`;
}

function startTimer() {
  clearInterval(timerInterval);
  secondsElapsed = 0;
  updateTimer();
  gameActive = true;
  timerInterval = setInterval(() => {
    secondsElapsed += 1;
    updateTimer();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  gameActive = false;
}

function getBoardFromInputs() {
  const board = [];
  const inputs = document.querySelectorAll('#sudoku-board .sudoku-cell');
  for (let row = 0; row < SIZE; row += 1) {
    board[row] = [];
    for (let col = 0; col < SIZE; col += 1) {
      const idx = row * SIZE + col;
      const input = inputs[idx];
      const rawValue = input.value.trim();
      board[row][col] = rawValue ? parseInt(rawValue, 10) : 0;
    }
  }
  return board;
}

function clearHighlights() {
  document.querySelectorAll('#sudoku-board .sudoku-cell').forEach((input) => {
    input.classList.remove('incorrect', 'invalid');
  });
}

function highlightInvalidEntries(board) {
  clearHighlights();
  const inputs = document.querySelectorAll('#sudoku-board .sudoku-cell');
  const invalidSet = new Set();

  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      const value = board[row][col];
      if (!value || inputs[row * SIZE + col].disabled) {
        continue;
      }
      const seenInRow = board[row].filter((cell) => cell === value).length > 1;
      const seenInCol = Array.from({ length: SIZE }, (_, index) => board[index][col]).filter((cell) => cell === value).length > 1;
      const startRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
      const startCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
      let seenInBox = 0;
      for (let boxRow = startRow; boxRow < startRow + BOX_SIZE; boxRow += 1) {
        for (let boxCol = startCol; boxCol < startCol + BOX_SIZE; boxCol += 1) {
          if (board[boxRow][boxCol] === value) {
            seenInBox += 1;
          }
        }
      }
      if (seenInRow || seenInCol || seenInBox > 1) {
        invalidSet.add(row * SIZE + col);
      }
    }
  }

  invalidSet.forEach((index) => {
    inputs[index].classList.add('invalid');
  });
}

function renderPuzzle(puz, solutionBoard, difficulty) {
  puzzle = puz;
  solution = solutionBoard;
  currentDifficulty = difficulty;
  hintsUsed = 0;
  createBoardElement();
  const inputs = document.querySelectorAll('#sudoku-board .sudoku-cell');
  inputs.forEach((input, index) => {
    const row = Math.floor(index / SIZE);
    const col = index % SIZE;
    const value = puzzle[row][col];
    if (value !== 0) {
      input.value = value;
      input.disabled = true;
      input.classList.add('prefilled');
    } else {
      input.value = '';
      input.disabled = false;
      input.classList.remove('prefilled', 'hint');
    }
  });

  clearHighlights();
  setMessage('');
  document.getElementById('hints-used').textContent = 'Hints: 0';
  startTimer();
}

function saveScore(name) {
  const storageKey = 'sudoku-top-ten';
  const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
  stored.push({
    name,
    time: secondsElapsed,
    hints: hintsUsed,
    difficulty: currentDifficulty,
    date: new Date().toISOString(),
  });
  stored.sort((a, b) => a.time - b.time || a.hints - b.hints);
  localStorage.setItem(storageKey, JSON.stringify(stored.slice(0, 10)));
  renderLeaderboard();
}

function renderLeaderboard() {
  const leaderboardBody = document.getElementById('leaderboard-body');
  const entries = JSON.parse(localStorage.getItem('sudoku-top-ten') || '[]');
  if (!leaderboardBody) {
    return;
  }

  leaderboardBody.innerHTML = '';
  if (!entries.length) {
    leaderboardBody.innerHTML = '<tr><td colspan="5">No scores yet.</td></tr>';
    return;
  }

  entries.forEach((entry, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${entry.name}</td>
      <td>${formatTime(entry.time)}</td>
      <td>${entry.hints}</td>
      <td>${entry.difficulty}</td>
    `;
    leaderboardBody.appendChild(row);
  });
}

async function newGame() {
  try {
    const response = await fetch(`/new?difficulty=${encodeURIComponent(currentDifficulty)}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Unable to create a new game.');
    }
    renderPuzzle(data.puzzle, data.solution, data.difficulty);
  } catch (error) {
    setMessage(error.message, 'error');
  }
}

async function checkSolution() {
  try {
    const board = getBoardFromInputs();
    const response = await fetch('/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ board }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Unable to check the solution.');
    }

    highlightInvalidEntries(board);
    const incorrect = new Set(data.incorrect.map((entry) => entry[0] * SIZE + entry[1]));
    document.querySelectorAll('#sudoku-board .sudoku-cell').forEach((input, index) => {
      if (input.disabled) {
        return;
      }
      input.classList.remove('incorrect');
      if (incorrect.has(index)) {
        input.classList.add('incorrect');
      }
    });

    if (data.solved) {
      stopTimer();
      const name = window.prompt('Enter your name for the leaderboard:');
      
      if (name) {
        saveScore(name.trim());
      }
      setMessage(`Congratulations! You solved it in ${formatTime(secondsElapsed)}.`, 'success');
    } else if (incorrect.size > 0) {
      setMessage('Some cells are still incorrect.', 'error');
    } else {
      setMessage('Board looks valid so far.', 'info');
    }
  } catch (error) {
    setMessage(error.message, 'error');
  }
}

async function requestHint() {
  try {
    const response = await fetch('/hint');
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Unable to offer a hint.');
    }
    const input = document.querySelector(`#sudoku-board .sudoku-cell[data-row="${data.row}"][data-col="${data.col}"]`);
    if (!input) {
      throw new Error('Hint cell not found.');
    }
    input.value = data.value;
    input.disabled = true;
    input.classList.add('hint');
    input.classList.remove('prefilled');
    hintsUsed += 1;
    document.getElementById('hints-used').textContent = `Hints: ${hintsUsed}`;
    setMessage(`Hint placed at row ${data.row + 1}, column ${data.col + 1}.`, 'info');
  } catch (error) {
    setMessage(error.message, 'error');
  }
}

function attachBoardEvents() {
  const boardDiv = document.getElementById('sudoku-board');
  boardDiv.addEventListener('input', (event) => {
    const input = event.target;
    if (!input.matches('.sudoku-cell')) {
      return;
    }
    if (input.disabled) {
      return;
    }
    const value = input.value.replace(/[^1-9]/g, '');
    input.value = value;
    if (value) {
      const board = getBoardFromInputs();
      highlightInvalidEntries(board);
    } else {
      clearHighlights();
    }
  });
}
// Replaces window.prompt() with a custom modal, since prompt() is blocked
// in some environments (e.g. embedded iframes / previews).
function askPlayerName(summaryText, onSubmit) {
  const modal = document.getElementById('name-modal');
  const input = document.getElementById('player-name-input');
  const summary = document.getElementById('modal-summary');
  const submitBtn = document.getElementById('modal-submit-btn');

  summary.textContent = summaryText || '';
  input.value = '';
  modal.style.display = 'flex';
  input.focus();

  function handleSubmit() {
    const name = input.value.trim() || 'Anonymous';
    modal.style.display = 'none';
    submitBtn.removeEventListener('click', handleSubmit);
    input.removeEventListener('keydown', handleEnterKey);
    onSubmit(name);
  }

  function handleEnterKey(e) {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  }

  submitBtn.addEventListener('click', handleSubmit);
  input.addEventListener('keydown', handleEnterKey);
}

window.addEventListener('load', () => {
  attachBoardEvents();
  document.getElementById('new-game').addEventListener('click', newGame);
  document.getElementById('check-solution').addEventListener('click', checkSolution);
  document.getElementById('hint-button').addEventListener('click', requestHint);
  document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark');
  });
  document.getElementById('difficulty-select').addEventListener('change', (event) => {
    currentDifficulty = event.target.value;
    newGame();
  });
  renderLeaderboard();
  newGame();
});