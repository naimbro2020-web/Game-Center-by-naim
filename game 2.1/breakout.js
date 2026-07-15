/* =========================================================
   BREAKOUT
   Fitur:
   - Kontrol paddle: Keyboard (Arrow/A-D) DAN Mouse
   - Bola memantul, menghancurkan bata
   - Power-up "×2": beberapa bata (acak) menjatuhkan kapsul "×2"
     saat pecah. Jika paddle berhasil menangkapnya, bola pemain
     akan DIGANDAKAN (multi-ball) selama sisa permainan.
   - Skor & high score
   - Nyawa (lives), Game Over & Menang saat semua bata hancur
   - Collision detection (dinding, paddle, bata)
   - Popup modal saat menang / kalah
   - Dekorasi bata & bola melayang di sisi kiri & kanan
   ========================================================= */

(function () {
  const CANVAS_WIDTH = 480;
  const CANVAS_HEIGHT = 520;

  const PADDLE_WIDTH = 90;
  const PADDLE_HEIGHT = 14;
  const PADDLE_SPEED = 7;

  const BALL_RADIUS = 8;
  const BASE_BALL_SPEED = 4.2;
  const MAX_BALLS = 6; // batas jumlah bola supaya permainan tetap terkendali

  const BRICK_ROWS = 5;
  const BRICK_COLS = 8;
  const BRICK_HEIGHT = 22;
  const BRICK_PADDING = 6;
  const BRICK_TOP_OFFSET = 50;
  const BRICK_SIDE_OFFSET = 10;

  const BRICK_COLORS = ["#f87171", "#fbbf24", "#34d399", "#22d3ee", "#818cf8"];
  const BRICK_POINTS = [50, 40, 30, 20, 10]; // baris atas bernilai lebih tinggi

  const STARTING_LIVES = 3;

  const POWERUP_DROP_CHANCE = 0.18; // peluang bata pecah menjatuhkan kapsul ×2
  const POWERUP_SIZE = 30;
  const POWERUP_FALL_SPEED = 2.3;

  let container = null;
  let canvas, ctx;
  let paddle, balls, powerups, bricks, score, highScore, lives, gameOver, gameWon, started, animationId;
  let keys = { left: false, right: false };
  let brickWidth = 0;

  function render() {
    const html = `
      <div class="score-board">
        <div class="score-pill">Skor: <strong id="brk-score">0</strong></div>
        <div class="score-pill">High Score: <strong id="brk-highscore">${highScore}</strong></div>
        <div class="score-pill">Nyawa: <strong id="brk-lives">${STARTING_LIVES}</strong></div>
      </div>
      <canvas id="brk-canvas" class="game-canvas" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}"></canvas>
      <p style="margin-top:12px; color:var(--color-text-muted); font-size:0.85rem;">
        Kontrol: Arrow Keys / A-D, atau gerakkan mouse &bull; Tangkap kapsul <strong>×2</strong> untuk menggandakan bola!
      </p>
    `;

    window.wrapWithDecorations(container, "breakout", html);

    canvas = document.getElementById("brk-canvas");
    ctx = canvas.getContext("2d");

    brickWidth = (CANVAS_WIDTH - BRICK_SIDE_OFFSET * 2 - BRICK_PADDING * (BRICK_COLS - 1)) / BRICK_COLS;

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("click", handleClickStart);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
  }

  function buildBricks() {
    const newBricks = [];
    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        newBricks.push({
          x: BRICK_SIDE_OFFSET + col * (brickWidth + BRICK_PADDING),
          y: BRICK_TOP_OFFSET + row * (BRICK_HEIGHT + BRICK_PADDING),
          width: brickWidth,
          height: BRICK_HEIGHT,
          alive: true,
          color: BRICK_COLORS[row % BRICK_COLORS.length],
          points: BRICK_POINTS[row % BRICK_POINTS.length],
        });
      }
    }
    return newBricks;
  }

  function createBall(x, y, vx, vy) {
    return { x, y, vx, vy };
  }

  function resetState() {
    paddle = {
      x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
      y: CANVAS_HEIGHT - 30,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT,
    };
    balls = [
      createBall(
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT - 30 - BALL_RADIUS - 2,
        BASE_BALL_SPEED * (Math.random() < 0.5 ? -1 : 1),
        -BASE_BALL_SPEED
      ),
    ];
    powerups = [];
    bricks = buildBricks();
    score = 0;
    lives = STARTING_LIVES;
    gameOver = false;
    gameWon = false;
    started = false;
  }

  function handleMouseMove(e) {
    if (gameOver) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    paddle.x = Math.min(Math.max(mouseX - paddle.width / 2, 0), CANVAS_WIDTH - paddle.width);
  }

  function handleClickStart() {
    if (!started && !gameOver) {
      started = true;
      SFX.play("click");
    }
  }

  function handleKeyDown(e) {
    const key = e.key.toLowerCase();
    if (key === "arrowleft" || key === "a") keys.left = true;
    if (key === "arrowright" || key === "d") keys.right = true;
    if (key === " " && !started && !gameOver) {
      started = true;
      SFX.play("click");
    }
  }

  function handleKeyUp(e) {
    const key = e.key.toLowerCase();
    if (key === "arrowleft" || key === "a") keys.left = false;
    if (key === "arrowright" || key === "d") keys.right = false;
  }

  function update() {
    if (gameOver) return;

    // Kontrol keyboard (bisa dipakai bersamaan dengan mouse)
    if (keys.left) paddle.x -= PADDLE_SPEED;
    if (keys.right) paddle.x += PADDLE_SPEED;
    paddle.x = Math.min(Math.max(paddle.x, 0), CANVAS_WIDTH - paddle.width);

    if (!started) {
      // Bola pertama menempel di atas paddle sebelum permainan dimulai
      balls[0].x = paddle.x + paddle.width / 2;
      balls[0].y = paddle.y - BALL_RADIUS - 2;
      return;
    }

    updateBalls();
    updatePowerups();

    // Cek kemenangan (semua bata hancur)
    if (bricks.every((b) => !b.alive)) {
      return winGame();
    }
  }

  /**
   * Update fisika & tabrakan untuk SEMUA bola yang sedang aktif.
   * Nyawa hanya berkurang jika seluruh bola jatuh melewati paddle.
   */
  function updateBalls() {
    for (const ball of balls) {
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Pantulan dinding kiri/kanan
      if (ball.x - BALL_RADIUS <= 0 || ball.x + BALL_RADIUS >= CANVAS_WIDTH) {
        ball.vx *= -1;
        ball.x = Math.min(Math.max(ball.x, BALL_RADIUS), CANVAS_WIDTH - BALL_RADIUS);
      }

      // Pantulan atap
      if (ball.y - BALL_RADIUS <= 0) {
        ball.vy *= -1;
        ball.y = BALL_RADIUS;
      }

      // Pantulan dengan paddle
      if (
        ball.y + BALL_RADIUS >= paddle.y &&
        ball.y + BALL_RADIUS <= paddle.y + paddle.height + 8 &&
        ball.x >= paddle.x &&
        ball.x <= paddle.x + paddle.width &&
        ball.vy > 0
      ) {
        const hitPos = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
        const speed = Math.hypot(ball.vx, ball.vy);
        ball.vx = hitPos * speed;
        ball.vy = -Math.abs(ball.vy);
        ball.y = paddle.y - BALL_RADIUS;
        SFX.play("click");
      }

      // Cek tabrakan dengan bata (satu bata per bola per frame)
      for (const brick of bricks) {
        if (!brick.alive) continue;

        if (
          ball.x + BALL_RADIUS > brick.x &&
          ball.x - BALL_RADIUS < brick.x + brick.width &&
          ball.y + BALL_RADIUS > brick.y &&
          ball.y - BALL_RADIUS < brick.y + brick.height
        ) {
          brick.alive = false;
          ball.vy *= -1;
          score += brick.points;
          SFX.play("eat");

          document.getElementById("brk-score").textContent = score;
          if (score > highScore) {
            highScore = score;
            document.getElementById("brk-highscore").textContent = highScore;
          }

          maybeDropPowerup(brick);
          break;
        }
      }
    }

    // Buang bola yang jatuh melewati paddle
    balls = balls.filter((ball) => ball.y - BALL_RADIUS <= CANVAS_HEIGHT);

    // Kalau semua bola habis, kurangi nyawa
    if (balls.length === 0) {
      loseLife();
    }
  }

  /**
   * Dengan peluang tertentu, bata yang baru pecah menjatuhkan kapsul "×2".
   */
  function maybeDropPowerup(brick) {
    if (Math.random() < POWERUP_DROP_CHANCE) {
      powerups.push({
        x: brick.x + brick.width / 2 - POWERUP_SIZE / 2,
        y: brick.y,
        vy: POWERUP_FALL_SPEED,
      });
    }
  }

  /**
   * Update posisi kapsul ×2 yang sedang jatuh, dan cek apakah tertangkap paddle.
   */
  function updatePowerups() {
    for (const powerup of powerups) {
      powerup.y += powerup.vy;
    }

    // Cek apakah paddle menangkap kapsul
    powerups.forEach((powerup) => {
      const caught =
        powerup.y + POWERUP_SIZE >= paddle.y &&
        powerup.y <= paddle.y + paddle.height &&
        powerup.x + POWERUP_SIZE >= paddle.x &&
        powerup.x <= paddle.x + paddle.width;

      if (caught) {
        powerup.caught = true;
        duplicateBall();
        SFX.play("win");
      }
    });

    // Buang kapsul yang sudah tertangkap atau jatuh melewati layar
    powerups = powerups.filter((p) => !p.caught && p.y <= CANVAS_HEIGHT);
  }

  /**
   * Menggandakan salah satu bola aktif menjadi bola baru dengan arah
   * berlawanan, sehingga jumlah bola bertambah (maksimal MAX_BALLS).
   */
  function duplicateBall() {
    if (balls.length >= MAX_BALLS || balls.length === 0) return;

    const source = balls[balls.length - 1];
    const newBall = createBall(source.x, source.y, -source.vx || BASE_BALL_SPEED, source.vy);
    balls.push(newBall);
  }

  function loseLife() {
    lives--;
    document.getElementById("brk-lives").textContent = lives;
    SFX.play("lose");

    if (lives <= 0) {
      return endGame();
    }

    // Reset ke satu bola baru, tunggu klik/space lagi
    paddle.x = CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2;
    powerups = [];
    balls = [
      createBall(
        paddle.x + paddle.width / 2,
        paddle.y - BALL_RADIUS - 2,
        BASE_BALL_SPEED * (Math.random() < 0.5 ? -1 : 1),
        -BASE_BALL_SPEED
      ),
    ];
    started = false;
  }

  function draw() {
    // Background
    ctx.fillStyle = "#04101f";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Bata
    bricks.forEach((brick) => {
      if (!brick.alive) return;
      ctx.fillStyle = brick.color;
      ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
    });

    // Kapsul power-up ×2
    powerups.forEach((powerup) => {
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.roundRect
        ? ctx.roundRect(powerup.x, powerup.y, POWERUP_SIZE, POWERUP_SIZE, 6)
        : ctx.rect(powerup.x, powerup.y, POWERUP_SIZE, POWERUP_SIZE);
      ctx.fill();

      ctx.fillStyle = "#04101f";
      ctx.font = "bold 13px Poppins, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("×2", powerup.x + POWERUP_SIZE / 2, powerup.y + POWERUP_SIZE / 2 + 1);
    });

    // Paddle
    ctx.fillStyle = "#22d3ee";
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // Semua bola aktif
    ctx.fillStyle = "#e6f1ff";
    balls.forEach((ball) => {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    });

    // Pesan sebelum mulai
    if (!started && !gameOver) {
      ctx.fillStyle = "#e6f1ff";
      ctx.font = "15px Poppins, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("Klik canvas atau tekan Space untuk mulai", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }
  }

  function gameLoop() {
    update();
    draw();
    animationId = requestAnimationFrame(gameLoop);
  }

  function endGame() {
    gameOver = true;
    SFX.play("gameover");
    window.showEndModal({
      icon: window.ICONS.gameover,
      title: "Game Over!",
      message: `Skor akhir kamu: ${score}. Nyawa habis, coba lagi!`,
      type: "lose",
    });
  }

  function winGame() {
    gameOver = true;
    gameWon = true;
    SFX.play("win");
    window.showEndModal({
      icon: window.ICONS.trophy,
      title: "Kamu Menang!",
      message: `Semua bata hancur! Skor akhir: ${score}.`,
      type: "win",
    });
  }

  function restart() {
    window.closeEndModal();
    resetState();
    document.getElementById("brk-score").textContent = "0";
    document.getElementById("brk-highscore").textContent = highScore;
    document.getElementById("brk-lives").textContent = STARTING_LIVES;
    draw();
  }

  function init(containerEl) {
    container = containerEl;
    highScore = 0; // reset high score tiap kali membuka game dari menu
    render();
    resetState();
    draw();
    gameLoop();
  }

  function destroy() {
    cancelAnimationFrame(animationId);
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("keyup", handleKeyUp);
    window.closeEndModal();
    container = null;
  }

  window.Games = window.Games || {};
  window.Games.breakout = { init, restart, destroy };
})();
