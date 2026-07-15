/* =========================================================
   SNAKE
   Fitur:
   - Area permainan lebih luas
   - Kontrol WASD & Arrow Keys
   - Makanan biasa muncul acak
   - Makanan BONUS (bola besar) muncul berkala, bernilai lebih besar,
     lalu hilang lagi jika tidak dimakan dalam waktu tertentu
   - Skor & High Score
   - Game Over & Restart via popup modal
   - Kecepatan bertambah setiap beberapa poin
   - Dekorasi bertema ular di sisi kiri & kanan + headline dekoratif
   ========================================================= */

(function () {
  const GRID_SIZE = 20; // ukuran satu sel (px)
  const GRID_COUNT = 26; // jumlah sel per baris/kolom -> area diperluas (520x520)
  const CANVAS_SIZE = GRID_SIZE * GRID_COUNT;

  const BASE_SPEED_MS = 150; // kecepatan awal (ms per langkah)
  const SPEED_INCREASE_EVERY = 5; // setiap X poin, kecepatan bertambah
  const SPEED_STEP_MS = 12; // pengurangan interval tiap kenaikan level

  const BONUS_POINTS = 5; // makanan bonus bernilai 5x makanan biasa
  const BONUS_SPAWN_CHANCE_PER_TICK = 0.006; // peluang muncul bonus tiap "tick" jika belum ada
  const BONUS_LIFETIME_TICKS = 55; // berapa lama bonus bertahan sebelum hilang lagi

  let container = null;
  let canvas, ctx;
  let snake, direction, nextDirection, food, bonusFood, bonusTicksLeft, score, highScore, gameOver, loopId, currentSpeed;

  function render() {
    const html = `
      <div class="snake-headline">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 8c2 0 2 3 4 3s2-3 4-3 2 3 4 3 2-3 4-3"></path>
          <circle cx="4" cy="15" r="1.3" fill="currentColor" stroke="none"></circle>
          <path d="M4 15c2 0 2-3 4-3"></path>
        </svg>
        <span>Ayo makan sebanyak-banyaknya!</span>
      </div>
      <div class="score-board">
        <div class="score-pill">Skor: <strong id="snake-score">0</strong></div>
        <div class="score-pill">High Score: <strong id="snake-highscore">${highScore}</strong></div>
      </div>
      <canvas id="snake-canvas" class="game-canvas" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}"></canvas>
      <p style="margin-top:12px; color:var(--color-text-muted); font-size:0.85rem;">
        Kontrol: WASD atau Arrow Keys &bull; Bola besar = bonus ${BONUS_POINTS}x poin!
      </p>
    `;

    window.wrapWithDecorations(container, "snake", html);

    canvas = document.getElementById("snake-canvas");
    ctx = canvas.getContext("2d");

    document.addEventListener("keydown", handleKeyDown);
  }

  function resetState() {
    snake = [
      { x: 9, y: 12 },
      { x: 8, y: 12 },
      { x: 7, y: 12 },
    ];
    direction = "right";
    nextDirection = "right";
    score = 0;
    gameOver = false;
    currentSpeed = BASE_SPEED_MS;
    food = spawnFood();
    bonusFood = null;
    bonusTicksLeft = 0;
  }

  function spawnFood() {
    let position;
    do {
      position = {
        x: Math.floor(Math.random() * GRID_COUNT),
        y: Math.floor(Math.random() * GRID_COUNT),
      };
    } while (
      snake.some((seg) => seg.x === position.x && seg.y === position.y) ||
      (bonusFood && bonusFood.x === position.x && bonusFood.y === position.y)
    );
    return position;
  }

  function maybeSpawnBonusFood() {
    if (bonusFood) return; // sudah ada bonus aktif

    if (Math.random() < BONUS_SPAWN_CHANCE_PER_TICK) {
      let position;
      do {
        position = {
          x: Math.floor(Math.random() * GRID_COUNT),
          y: Math.floor(Math.random() * GRID_COUNT),
        };
      } while (
        snake.some((seg) => seg.x === position.x && seg.y === position.y) ||
        (food.x === position.x && food.y === position.y)
      );
      bonusFood = position;
      bonusTicksLeft = BONUS_LIFETIME_TICKS;
    }
  }

  function handleKeyDown(e) {
    const key = e.key.toLowerCase();
    if (["arrowup", "w"].includes(key) && direction !== "down") nextDirection = "up";
    else if (["arrowdown", "s"].includes(key) && direction !== "up") nextDirection = "down";
    else if (["arrowleft", "a"].includes(key) && direction !== "right") nextDirection = "left";
    else if (["arrowright", "d"].includes(key) && direction !== "left") nextDirection = "right";
  }

  function gameStep() {
    if (gameOver) return;

    direction = nextDirection;
    const head = { ...snake[0] };

    if (direction === "up") head.y--;
    else if (direction === "down") head.y++;
    else if (direction === "left") head.x--;
    else if (direction === "right") head.x++;

    // Cek tabrakan dengan dinding
    if (head.x < 0 || head.x >= GRID_COUNT || head.y < 0 || head.y >= GRID_COUNT) {
      return endGame();
    }

    // Cek tabrakan dengan tubuh sendiri
    if (snake.some((seg) => seg.x === head.x && seg.y === head.y)) {
      return endGame();
    }

    snake.unshift(head);

    let ateSomething = false;

    // Cek apakah makan makanan biasa
    if (head.x === food.x && head.y === food.y) {
      score++;
      ateSomething = true;
      SFX.play("eat");
      food = spawnFood();

      // Tambah kecepatan setiap kelipatan SPEED_INCREASE_EVERY
      if (score % SPEED_INCREASE_EVERY === 0) {
        currentSpeed = Math.max(50, currentSpeed - SPEED_STEP_MS);
        restartLoop();
      }
    }

    // Cek apakah makan makanan bonus (bola besar)
    if (bonusFood && head.x === bonusFood.x && head.y === bonusFood.y) {
      score += BONUS_POINTS;
      ateSomething = true;
      bonusFood = null;
      SFX.play("win");
    }

    if (ateSomething) {
      document.getElementById("snake-score").textContent = score;
      if (score > highScore) {
        highScore = score;
        document.getElementById("snake-highscore").textContent = highScore;
      }
    } else {
      snake.pop(); // tidak makan apa-apa, ular tetap sepanjang semula
    }

    // Kelola umur makanan bonus
    if (bonusFood) {
      bonusTicksLeft--;
      if (bonusTicksLeft <= 0) bonusFood = null;
    } else {
      maybeSpawnBonusFood();
    }

    draw();
  }

  function draw() {
    // Background
    ctx.fillStyle = "#04101f";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Grid tipis (estetika)
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    for (let i = 0; i <= GRID_COUNT; i++) {
      ctx.beginPath();
      ctx.moveTo(i * GRID_SIZE, 0);
      ctx.lineTo(i * GRID_SIZE, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * GRID_SIZE);
      ctx.lineTo(CANVAS_SIZE, i * GRID_SIZE);
      ctx.stroke();
    }

    // Makanan biasa
    ctx.fillStyle = "#f87171";
    ctx.beginPath();
    ctx.arc(
      food.x * GRID_SIZE + GRID_SIZE / 2,
      food.y * GRID_SIZE + GRID_SIZE / 2,
      GRID_SIZE / 2.5,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Makanan bonus (bola besar, berkedip agar mencolok)
    if (bonusFood) {
      const pulse = 1 + Math.sin(Date.now() / 120) * 0.12;
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(
        bonusFood.x * GRID_SIZE + GRID_SIZE / 2,
        bonusFood.y * GRID_SIZE + GRID_SIZE / 2,
        (GRID_SIZE / 1.5) * pulse,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Ular - digambar sebagai segmen membulat berwarna hijau bergradasi,
    // dengan kepala yang punya mata & lidah supaya terlihat seperti ular
    // sungguhan, bukan sekadar kotak-kotak pixel.
    drawSnakeBody();
  }

  /**
   * Menggambar rectangle dengan sudut membulat (kompatibel di semua browser,
   * tidak bergantung pada ctx.roundRect bawaan).
   */
  function drawRoundedRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawSnakeBody() {
    const total = snake.length;

    // Gambar dari ekor ke kepala supaya kepala selalu tampil di atas (overlap rapi)
    for (let i = total - 1; i >= 0; i--) {
      const seg = snake[i];
      const isHead = i === 0;
      const px = seg.x * GRID_SIZE;
      const py = seg.y * GRID_SIZE;
      const pad = isHead ? 0.5 : 1.5;
      const size = GRID_SIZE - pad * 2;

      // Warna hijau bergradasi: lebih terang di kepala, meredup ke ekor
      const fade = 1 - (i / Math.max(total - 1, 1)) * 0.45;
      const green = Math.round(180 * fade + 40);
      const bodyColor = isHead ? "#22c55e" : `rgb(22, ${green}, 94)`;

      ctx.fillStyle = bodyColor;
      drawRoundedRect(px + pad, py + pad, size, size, isHead ? 8 : 6);
      ctx.fill();

      // Sisik sederhana pada badan (bukan kepala) untuk tekstur visual
      if (!isHead && i % 2 === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.beginPath();
        ctx.arc(px + GRID_SIZE / 2, py + GRID_SIZE / 2, GRID_SIZE / 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    drawSnakeHeadDetails();
  }

  /**
   * Menambahkan mata & lidah pada kepala ular, mengarah sesuai arah gerak.
   */
  function drawSnakeHeadDetails() {
    const head = snake[0];
    const cx = head.x * GRID_SIZE + GRID_SIZE / 2;
    const cy = head.y * GRID_SIZE + GRID_SIZE / 2;

    // Offset arah mata & lidah berdasarkan arah gerak saat ini
    const dirOffset = {
      up: { ex: 0, ey: -1, tx: 0, ty: -1 },
      down: { ex: 0, ey: 1, tx: 0, ty: 1 },
      left: { ex: -1, ey: 0, tx: -1, ty: 0 },
      right: { ex: 1, ey: 0, tx: 1, ty: 0 },
    }[direction];

    // Posisi dua mata, tegak lurus terhadap arah gerak
    const perpX = dirOffset.ey;
    const perpY = -dirOffset.ex;
    const eyeOffset = GRID_SIZE / 4.5;
    const eyeForward = GRID_SIZE / 6;

    const eye1 = {
      x: cx + dirOffset.ex * eyeForward + perpX * eyeOffset,
      y: cy + dirOffset.ey * eyeForward + perpY * eyeOffset,
    };
    const eye2 = {
      x: cx + dirOffset.ex * eyeForward - perpX * eyeOffset,
      y: cy + dirOffset.ey * eyeForward - perpY * eyeOffset,
    };

    [eye1, eye2].forEach((eye) => {
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(eye.x, eye.y, GRID_SIZE / 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#04101f";
      ctx.beginPath();
      ctx.arc(
        eye.x + dirOffset.ex * 1.2,
        eye.y + dirOffset.ey * 1.2,
        GRID_SIZE / 16,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });

    // Lidah kecil menjulur di depan mulut (berkedip pelan mengikuti waktu)
    const tongueOut = Math.sin(Date.now() / 200) > 0;
    if (tongueOut) {
      const tongueBaseX = cx + dirOffset.tx * (GRID_SIZE / 2);
      const tongueBaseY = cy + dirOffset.ty * (GRID_SIZE / 2);
      const tongueTipX = cx + dirOffset.tx * (GRID_SIZE / 1.1);
      const tongueTipY = cy + dirOffset.ty * (GRID_SIZE / 1.1);

      ctx.strokeStyle = "#f87171";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tongueBaseX, tongueBaseY);
      ctx.lineTo(tongueTipX, tongueTipY);
      ctx.stroke();
    }
  }

  function endGame() {
    gameOver = true;
    clearInterval(loopId);
    SFX.play("gameover");

    window.showEndModal({
      icon: window.ICONS.gameover,
      title: "Game Over!",
      message: `Ular menabrak! Skor akhir: ${score}.`,
      type: "lose",
    });
  }

  function restartLoop() {
    clearInterval(loopId);
    loopId = setInterval(gameStep, currentSpeed);
  }

  function restart() {
    window.closeEndModal();
    resetState();
    document.getElementById("snake-score").textContent = "0";
    document.getElementById("snake-highscore").textContent = highScore;
    draw();
    restartLoop();
  }

  function init(containerEl) {
    container = containerEl;
    highScore = 0; // reset high score tiap kali membuka game dari menu
    render();
    resetState();
    draw();
    restartLoop();
  }

  function destroy() {
    clearInterval(loopId);
    document.removeEventListener("keydown", handleKeyDown);
    window.closeEndModal();
    container = null;
  }

  window.Games = window.Games || {};
  window.Games.snake = { init, restart, destroy };
})();
