/* =========================================================
   FLAPPY BIRD
   Fitur:
   - HTML5 Canvas
   - Burung digambar sebagai SPRITE PIXEL-ART (gaya retro 8-bit),
     dibuat langsung dengan canvas (bukan file gambar eksternal)
   - Gravitasi & mekanik lompat (flap)
   - Pipa muncul acak
   - Skor & High Score
   - Collision detection
   - Kontrol: Space atau klik mouse
   - Popup modal saat game over
   - Dekorasi awan melayang di sisi kiri & kanan
   ========================================================= */

(function () {
  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 500;

  const GRAVITY = 0.45;
  const FLAP_STRENGTH = -7.5;
  const PIPE_WIDTH = 60;
  const PIPE_GAP = 150;
  const PIPE_SPEED = 2.4;
  const PIPE_SPAWN_INTERVAL_FRAMES = 100;

  const BIRD_PIXEL_SIZE = 3.4; // ukuran tiap "pixel" sprite saat digambar

  // ---------------------------------------------------------
  // SPRITE PIXEL-ART BURUNG (grid 8x8)
  // '.' = transparan, huruf lain = kode warna di PIXEL_COLORS
  // Dua frame dipakai bergantian agar sayap terlihat "mengepak"
  // ---------------------------------------------------------
  const PIXEL_COLORS = {
    O: "#fbbf24", // badan (kuning/oranye)
    W: "#f59e0b", // sayap (oranye gelap)
    B: "#f97316", // paruh (oranye kemerahan)
    E: "#04101f", // mata (gelap)
  };

  const FRAME_WING_UP = [
    "...OO...",
    ".OOOOOO.",
    "OOOOEOOO",
    "OOOOOOOB",
    "OWWOOOOB",
    ".OWWOOO.",
    "..OOOO..",
    "...OO...",
  ];

  const FRAME_WING_DOWN = [
    "...OO...",
    ".OOOOOO.",
    "OOOOEOOO",
    "OOOOOOOB",
    "OOOOOOOB",
    ".OWWWOO.",
    "..OWWO..",
    "...OO...",
  ];

  let container = null;
  let canvas, ctx;
  let bird, pipes, frameCount, score, highScore, gameOver, started, animationId;

  function render() {
    const html = `
      <div class="score-board">
        <div class="score-pill">Skor: <strong id="flappy-score">0</strong></div>
        <div class="score-pill">High Score: <strong id="flappy-highscore">${highScore}</strong></div>
      </div>
      <canvas id="flappy-canvas" class="game-canvas" width="${CANVAS_WIDTH}" height="${CANVAS_HEIGHT}"></canvas>
      <p style="margin-top:12px; color:var(--color-text-muted); font-size:0.85rem;">
        Kontrol: Tekan Space atau Klik untuk terbang
      </p>
    `;

    window.wrapWithDecorations(container, "clouds", html);

    canvas = document.getElementById("flappy-canvas");
    ctx = canvas.getContext("2d");

    canvas.addEventListener("click", handleFlapInput);
    document.addEventListener("keydown", handleKeyDown);
  }

  function resetState() {
    bird = { x: 80, y: CANVAS_HEIGHT / 2, velocity: 0, size: 24 };
    pipes = [];
    frameCount = 0;
    score = 0;
    gameOver = false;
    started = false;
  }

  function handleKeyDown(e) {
    if (e.code === "Space") {
      e.preventDefault();
      handleFlapInput();
    }
  }

  function handleFlapInput() {
    if (gameOver) return;
    if (!started) started = true;
    bird.velocity = FLAP_STRENGTH;
    SFX.play("click");
  }

  function spawnPipe() {
    const minGapY = 60;
    const maxGapY = CANVAS_HEIGHT - 60 - PIPE_GAP;
    const gapY = Math.floor(Math.random() * (maxGapY - minGapY + 1)) + minGapY;

    pipes.push({ x: CANVAS_WIDTH, gapY, passed: false });
  }

  function update() {
    if (!started || gameOver) return;

    frameCount++;

    bird.velocity += GRAVITY;
    bird.y += bird.velocity;

    if (frameCount % PIPE_SPAWN_INTERVAL_FRAMES === 0) {
      spawnPipe();
    }

    pipes.forEach((pipe) => {
      pipe.x -= PIPE_SPEED;

      if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x) {
        pipe.passed = true;
        score++;
        SFX.play("pipe");
        document.getElementById("flappy-score").textContent = score;
        if (score > highScore) {
          highScore = score;
          document.getElementById("flappy-highscore").textContent = highScore;
        }
      }
    });

    pipes = pipes.filter((pipe) => pipe.x + PIPE_WIDTH > 0);

    if (bird.y + bird.size / 2 >= CANVAS_HEIGHT || bird.y - bird.size / 2 <= 0) {
      return endGame();
    }

    for (const pipe of pipes) {
      const birdLeft = bird.x - bird.size / 2;
      const birdRight = bird.x + bird.size / 2;
      const birdTop = bird.y - bird.size / 2;
      const birdBottom = bird.y + bird.size / 2;

      const withinPipeX = birdRight > pipe.x && birdLeft < pipe.x + PIPE_WIDTH;
      const hitsTopPipe = birdTop < pipe.gapY;
      const hitsBottomPipe = birdBottom > pipe.gapY + PIPE_GAP;

      if (withinPipeX && (hitsTopPipe || hitsBottomPipe)) {
        return endGame();
      }
    }
  }

  /**
   * Menggambar sprite pixel-art burung pada posisi & rotasi saat ini.
   * Frame sayap bergantian setiap beberapa frame supaya terlihat mengepak.
   */
  function drawBirdSprite() {
    const wingFlap = Math.floor(frameCount / 6) % 2 === 0;
    const frame = wingFlap ? FRAME_WING_UP : FRAME_WING_DOWN;
    const gridSize = 8;
    const spriteSize = gridSize * BIRD_PIXEL_SIZE;

    ctx.save();
    ctx.translate(bird.x, bird.y);
    const angle = Math.max(-0.4, Math.min(0.9, bird.velocity / 10));
    ctx.rotate(angle);
    ctx.translate(-spriteSize / 2, -spriteSize / 2);

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const code = frame[row][col];
        if (code === ".") continue;
        ctx.fillStyle = PIXEL_COLORS[code] || "#fbbf24";
        ctx.fillRect(col * BIRD_PIXEL_SIZE, row * BIRD_PIXEL_SIZE, BIRD_PIXEL_SIZE + 0.5, BIRD_PIXEL_SIZE + 0.5);
      }
    }

    ctx.restore();
  }

  function draw() {
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, "#0b1220");
    gradient.addColorStop(1, "#16264d");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = "#22d3ee";
    pipes.forEach((pipe) => {
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY);
      ctx.fillRect(pipe.x, pipe.gapY + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT - (pipe.gapY + PIPE_GAP));
    });

    drawBirdSprite();

    if (!started && !gameOver) {
      ctx.fillStyle = "#e6f1ff";
      ctx.font = "16px Poppins, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Klik atau tekan Space untuk mulai", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);
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
      message: `Burung menabrak! Skor akhir: ${score}.`,
      type: "lose",
    });
  }

  function restart() {
    window.closeEndModal();
    resetState();
    const scoreEl = document.getElementById("flappy-score");
    const highScoreEl = document.getElementById("flappy-highscore");
    if (scoreEl) scoreEl.textContent = "0";
    if (highScoreEl) highScoreEl.textContent = highScore;
  }

  function init(containerEl) {
    container = containerEl;
    highScore = 0;
    render();
    resetState();
    gameLoop();
  }

  function destroy() {
    cancelAnimationFrame(animationId);
    document.removeEventListener("keydown", handleKeyDown);
    window.closeEndModal();
    container = null;
  }

  window.Games = window.Games || {};
  window.Games.flappybird = { init, restart, destroy };
})();
