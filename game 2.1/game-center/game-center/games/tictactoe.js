/* =========================================================
   TIC TAC TOE
   Fitur:
   - Mode Player vs Player & Player vs Computer
   - Mode vs Computer: simbol pemain diacak setiap ronde baru
     (kadang dapat X, kadang dapat O) -> X selalu jalan duluan
     sesuai aturan baku, jadi jika pemain kebagian O, komputer
     otomatis jalan lebih dulu.
   - Level kesulitan (Easy/Medium/Hard) dikalibrasi supaya
     peluang MENANG pemain kira-kira:
       Easy   -> ~50%
       Medium -> ~25%
       Hard   -> ~5%
     Catatan: karena Tic Tac Toe dengan permainan sempurna selalu
     berakhir seri, angka di atas adalah target perkiraan yang
     dicapai dengan mengatur seberapa sering komputer "sengaja"
     tidak bermain optimal (bukan jaminan matematis persis).
   - Indikator giliran, highlight pemenang, skor pertandingan
   - Dekorasi X/O melayang di sisi kiri & kanan
   - Popup modal saat menang / kalah / seri
   ========================================================= */

(function () {
  // ---- STATE GAME ----
  let board = Array(9).fill(null); // isi papan: null | "X" | "O"
  let currentPlayer = "X"; // giliran saat ini (X selalu mulai duluan)
  let mode = "pvp"; // "pvp" atau "pvc" (player vs computer)
  let difficulty = "medium"; // "easy" | "medium" | "hard" (hanya dipakai saat mode pvc)
  let playerSymbol = "X"; // simbol milik pemain manusia saat mode pvc (diacak tiap ronde)
  let computerSymbol = "O"; // simbol milik komputer saat mode pvc
  let gameOver = false;
  let scores = { X: 0, O: 0, draw: 0 };

  // Peluang komputer "sengaja" membuat langkah acak (bukan langkah terbaik).
  const MISTAKE_CHANCE = {
    easy: 0.6,
    medium: 0.3,
    hard: 0.07,
  };

  // Kombinasi kemenangan (index papan 0-8)
  const WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // baris
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // kolom
    [0, 4, 8], [2, 4, 6],            // diagonal
  ];

  let container = null;

  /**
   * Mengacak simbol pemain (X atau O) untuk ronde baru mode vs Computer.
   */
  function randomizePlayerSymbol() {
    playerSymbol = Math.random() < 0.5 ? "X" : "O";
    computerSymbol = playerSymbol === "X" ? "O" : "X";
  }

  /**
   * Membuat tampilan HTML untuk Tic Tac Toe di dalam container.
   */
  function render() {
    const difficultySelectHTML =
      mode === "pvc"
        ? `
      <div class="mode-select">
        <button class="mode-btn ${difficulty === "easy" ? "active" : ""}" data-difficulty="easy">Easy</button>
        <button class="mode-btn ${difficulty === "medium" ? "active" : ""}" data-difficulty="medium">Medium</button>
        <button class="mode-btn ${difficulty === "hard" ? "active" : ""}" data-difficulty="hard">Hard</button>
      </div>`
        : "";

    const symbolInfoHTML =
      mode === "pvc"
        ? `<p class="ttt-turn-indicator">Kamu bermain sebagai <strong>${playerSymbol}</strong> &bull; Komputer sebagai <strong>${computerSymbol}</strong></p>`
        : "";

    const html = `
      <div class="mode-select">
        <button class="mode-btn ${mode === "pvp" ? "active" : ""}" data-mode="pvp">Player vs Player</button>
        <button class="mode-btn ${mode === "pvc" ? "active" : ""}" data-mode="pvc">Player vs Computer</button>
      </div>
      ${difficultySelectHTML}
      ${symbolInfoHTML}

      <div class="score-board">
        <div class="score-pill">Skor X: <strong id="ttt-score-x">${scores.X}</strong></div>
        <div class="score-pill">Seri: <strong id="ttt-score-draw">${scores.draw}</strong></div>
        <div class="score-pill">Skor O: <strong id="ttt-score-o">${scores.O}</strong></div>
      </div>

      <p class="ttt-turn-indicator" id="ttt-turn-indicator">Giliran: <strong>${currentPlayer}</strong></p>

      <div class="ttt-board" id="ttt-board"></div>
    `;

    window.wrapWithDecorations(container, "xo", html);

    renderBoard();
    bindModeButtons();
    bindDifficultyButtons();
    maybeTriggerComputerFirstMove();
  }

  /**
   * Menggambar ulang sel-sel papan sesuai state `board`.
   */
  function renderBoard() {
    const boardEl = document.getElementById("ttt-board");
    boardEl.innerHTML = "";

    board.forEach((value, index) => {
      const cell = document.createElement("div");
      cell.className = "ttt-cell" + (value ? " filled" : "");
      cell.textContent = value ? value : "";
      cell.dataset.index = index;
      cell.addEventListener("click", () => handleCellClick(index));
      boardEl.appendChild(cell);
    });
  }

  function bindModeButtons() {
    document.querySelectorAll(".mode-btn[data-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        mode = btn.dataset.mode;
        if (mode === "pvc") randomizePlayerSymbol();
        resetBoardOnly();
        render();
      });
    });
  }

  function bindDifficultyButtons() {
    document.querySelectorAll(".mode-btn[data-difficulty]").forEach((btn) => {
      btn.addEventListener("click", () => {
        difficulty = btn.dataset.difficulty;
        resetBoardOnly();
        render();
      });
    });
  }

  /**
   * Jika mode vs Computer dan komputer kebagian simbol X (jalan duluan),
   * biarkan AI langsung jalan begitu ronde baru dimulai.
   */
  function maybeTriggerComputerFirstMove() {
    if (mode === "pvc" && currentPlayer === computerSymbol && !gameOver) {
      const boardEl = document.getElementById("ttt-board");
      if (boardEl) boardEl.style.pointerEvents = "none";
      setTimeout(() => {
        computerMove();
        const boardEl2 = document.getElementById("ttt-board");
        if (boardEl2) boardEl2.style.pointerEvents = "auto";
      }, 400);
    }
  }

  /**
   * Menangani klik pada salah satu sel papan.
   */
  function handleCellClick(index) {
    if (gameOver || board[index]) return; // sel sudah terisi atau game selesai

    // Pada mode vs Computer, pemain hanya boleh klik saat giliran simbolnya sendiri
    if (mode === "pvc" && currentPlayer !== playerSymbol) return;

    placeMark(index, currentPlayer);

    const winnerInfo = checkWinner();
    if (winnerInfo) {
      finishGame(winnerInfo);
      return;
    }

    if (board.every((cell) => cell !== null)) {
      finishGame({ winner: "draw" });
      return;
    }

    // Ganti giliran
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    updateTurnIndicator();

    // Jika mode vs Computer dan sekarang giliran komputer, biarkan AI jalan
    if (mode === "pvc" && currentPlayer === computerSymbol && !gameOver) {
      const boardEl = document.getElementById("ttt-board");
      if (boardEl) boardEl.style.pointerEvents = "none";
      setTimeout(() => {
        computerMove();
        const boardEl2 = document.getElementById("ttt-board");
        if (boardEl2) boardEl2.style.pointerEvents = "auto";
      }, 400);
    }
  }

  function placeMark(index, player) {
    board[index] = player;
    SFX.play("click");
    renderBoard();
  }

  function updateTurnIndicator() {
    const indicator = document.getElementById("ttt-turn-indicator");
    if (indicator) indicator.innerHTML = `Giliran: <strong>${currentPlayer}</strong>`;
  }

  /**
   * Mengecek apakah ada pemenang. Mengembalikan { winner, line } atau null.
   */
  function checkWinner() {
    for (const line of WIN_LINES) {
      const [a, b, c] = line;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a], line };
      }
    }
    return null;
  }

  /**
   * Menyelesaikan permainan: update skor, highlight garis menang,
   * lalu tampilkan popup modal (Restart & Home berdekatan).
   */
  function finishGame(result) {
    gameOver = true;

    if (result.winner === "draw") {
      scores.draw++;
      SFX.play("draw");
      window.showEndModal({
        icon: window.ICONS.draw,
        title: "Permainan Seri!",
        message: "Papan penuh tanpa ada pemenang. Coba lagi?",
        type: "draw",
      });
    } else {
      scores[result.winner]++;
      highlightWinLine(result.line);

      if (mode === "pvc") {
        const playerWon = result.winner === playerSymbol;
        SFX.play(playerWon ? "win" : "lose");
        window.showEndModal({
          icon: playerWon ? window.ICONS.trophy : window.ICONS.gameover,
          title: playerWon ? "Kamu Menang!" : "Komputer Menang!",
          message: playerWon
            ? "Kerja bagus! Kamu mengalahkan komputer."
            : "Belum beruntung kali ini. Coba lagi!",
          type: playerWon ? "win" : "lose",
        });
      } else {
        SFX.play("win");
        window.showEndModal({
          icon: window.ICONS.trophy,
          title: `Pemain ${result.winner} Menang!`,
          message: "Selamat! Main satu ronde lagi?",
          type: "win",
        });
      }
    }

    document.getElementById("ttt-score-x").textContent = scores.X;
    document.getElementById("ttt-score-o").textContent = scores.O;
    document.getElementById("ttt-score-draw").textContent = scores.draw;
  }

  function highlightWinLine(line) {
    const boardEl = document.getElementById("ttt-board");
    line.forEach((index) => {
      boardEl.children[index].classList.add("win-cell");
    });
  }

  /* ---------------------------------------------------------
     AI (MINIMAX + PELUANG "KESALAHAN" SESUAI LEVEL KESULITAN)
     Komputer bermain sebagai `computerSymbol` (bisa X atau O
     tergantung hasil acak di awal ronde).
     --------------------------------------------------------- */
  function computerMove() {
    if (gameOver) return;

    const mistakeChance = MISTAKE_CHANCE[difficulty] ?? MISTAKE_CHANCE.medium;
    let moveIndex;

    if (Math.random() < mistakeChance) {
      moveIndex = getRandomMove();
    } else {
      moveIndex = getBestMove();
    }

    if (moveIndex === -1) return;

    placeMark(moveIndex, computerSymbol);

    const winnerInfo = checkWinner();
    if (winnerInfo) {
      finishGame(winnerInfo);
      return;
    }

    if (board.every((cell) => cell !== null)) {
      finishGame({ winner: "draw" });
      return;
    }

    currentPlayer = playerSymbol;
    updateTurnIndicator();
  }

  function getRandomMove() {
    const emptyCells = board
      .map((val, idx) => (val === null ? idx : null))
      .filter((idx) => idx !== null);
    if (emptyCells.length === 0) return -1;
    return emptyCells[Math.floor(Math.random() * emptyCells.length)];
  }

  function getBestMove() {
    let bestScore = -Infinity;
    let move = -1;

    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = computerSymbol;
        const score = minimax(board, 0, false);
        board[i] = null;

        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }
    return move;
  }

  // Algoritma minimax klasik, digeneralisasi memakai computerSymbol/playerSymbol
  // supaya tetap benar walau simbol komputer & pemain berganti tiap ronde.
  function minimax(currentBoard, depth, isMaximizing) {
    const winnerInfo = checkWinnerForBoard(currentBoard);
    if (winnerInfo === computerSymbol) return 10 - depth;
    if (winnerInfo === playerSymbol) return depth - 10;
    if (currentBoard.every((c) => c !== null)) return 0;

    if (isMaximizing) {
      let best = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (currentBoard[i] === null) {
          currentBoard[i] = computerSymbol;
          best = Math.max(best, minimax(currentBoard, depth + 1, false));
          currentBoard[i] = null;
        }
      }
      return best;
    } else {
      let best = Infinity;
      for (let i = 0; i < 9; i++) {
        if (currentBoard[i] === null) {
          currentBoard[i] = playerSymbol;
          best = Math.min(best, minimax(currentBoard, depth + 1, true));
          currentBoard[i] = null;
        }
      }
      return best;
    }
  }

  function checkWinnerForBoard(b) {
    for (const [a, b1, c] of WIN_LINES) {
      if (b[a] && b[a] === b[b1] && b[a] === b[c]) return b[a];
    }
    return null;
  }

  /* ---------------------------------------------------------
     RESET / RESTART
     --------------------------------------------------------- */
  function resetBoardOnly() {
    board = Array(9).fill(null);
    currentPlayer = "X"; // X selalu jalan duluan sesuai aturan baku
    gameOver = false;
  }

  function restart() {
    window.closeEndModal();
    if (mode === "pvc") randomizePlayerSymbol(); // acak ulang simbol tiap ronde baru
    resetBoardOnly();
    render();
  }

  /* ---------------------------------------------------------
     LIFECYCLE (dipanggil oleh script.js)
     --------------------------------------------------------- */
  function init(containerEl) {
    container = containerEl;
    scores = { X: 0, O: 0, draw: 0 }; // reset skor tiap kali game dibuka dari menu
    mode = "pvp";
    randomizePlayerSymbol();
    resetBoardOnly();
    render();
  }

  function destroy() {
    window.closeEndModal();
    container = null;
  }

  // Daftarkan modul ini ke registry global
  window.Games = window.Games || {};
  window.Games.tictactoe = { init, restart, destroy };
})();
