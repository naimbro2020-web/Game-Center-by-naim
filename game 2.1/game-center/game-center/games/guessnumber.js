/* =========================================================
   TEBAK ANGKA
   Mekanisme baru:
   - Saat game dimulai, sistem menyiapkan 3 kartu TERTUTUP.
     Setiap kartu sudah punya angka rahasia acak di baliknya
     (player tidak melihat nilainya).
   - Player memilih salah satu dari 3 kartu tersebut.
   - Nilai kartu yang dipilih menjadi ANGKA RAHASIA yang harus
     ditebak, lalu permainan tebak-tebakan berjalan seperti biasa
     (petunjuk lebih besar / lebih kecil).
   - Tingkat kesulitan: Easy (1-50), Medium (1-100), Hard (1-500)
   - Dekorasi angka melayang di sisi kiri & kanan
   - Popup modal saat berhasil menebak
   ========================================================= */

(function () {
  const DIFFICULTY = {
    easy: { min: 1, max: 50, label: "Easy (1-50)" },
    medium: { min: 1, max: 100, label: "Medium (1-100)" },
    hard: { min: 1, max: 500, label: "Hard (1-500)" },
  };

  let container = null;
  let difficulty = "medium";
  let hiddenCandidates = []; // 3 angka rahasia di balik kartu
  let secretNumber = null; // angka rahasia yang aktif (dipilih dari salah satu kartu)
  let cardChosen = false; // apakah player sudah memilih kartu
  let attempts = 0;
  let history = []; // riwayat tebakan: { value, result }
  let finished = false;

  function generateCandidates() {
    const { min, max } = DIFFICULTY[difficulty];
    const candidates = [];
    for (let i = 0; i < 3; i++) {
      candidates.push(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    return candidates;
  }

  function render() {
    const { min, max } = DIFFICULTY[difficulty];

    let bodyHTML;

    if (!cardChosen) {
      // Tahap 1: pemain memilih salah satu dari 3 kartu tertutup
      bodyHTML = `
        <p class="ttt-turn-indicator">Pilih salah satu kartu misteri untuk memulai!</p>
        <div class="guess-cards" id="guess-cards">
          <button class="guess-card-btn" data-card="0">?</button>
          <button class="guess-card-btn" data-card="1">?</button>
          <button class="guess-card-btn" data-card="2">?</button>
        </div>
      `;
    } else {
      // Tahap 2: permainan tebak angka seperti biasa
      bodyHTML = `
        <div class="score-board">
          <div class="score-pill">Rentang: <strong>${min} - ${max}</strong></div>
          <div class="score-pill">Percobaan: <strong id="guess-attempts">${attempts}</strong></div>
        </div>

        <div id="guess-message"></div>

        <div class="guess-input-row">
          <input
            type="number"
            id="guess-input"
            min="${min}"
            max="${max}"
            placeholder="${min}-${max}"
            ${finished ? "disabled" : ""}
          />
          <button class="btn btn-play" id="guess-submit" ${finished ? "disabled" : ""}>Tebak!</button>
        </div>

        <div class="guess-history" id="guess-history">
          ${history.map((h) => `<span class="guess-chip ${h.result}">${h.value}</span>`).join("")}
        </div>
      `;
    }

    const html = `
      <div class="mode-select">
        ${Object.keys(DIFFICULTY)
          .map(
            (key) => `
          <button class="mode-btn ${difficulty === key ? "active" : ""}" data-difficulty="${key}">
            ${DIFFICULTY[key].label}
          </button>`
          )
          .join("")}
      </div>
      ${bodyHTML}
    `;

    window.wrapWithDecorations(container, "numbers", html);

    bindEvents();
  }

  function bindEvents() {
    document.querySelectorAll(".mode-btn[data-difficulty]").forEach((btn) => {
      btn.addEventListener("click", () => {
        difficulty = btn.dataset.difficulty;
        startNewRound();
      });
    });

    // Tahap pilih kartu
    document.querySelectorAll(".guess-card-btn").forEach((btn) => {
      btn.addEventListener("click", () => handleCardChoice(parseInt(btn.dataset.card, 10)));
    });

    // Tahap tebak angka
    const input = document.getElementById("guess-input");
    const submitBtn = document.getElementById("guess-submit");
    if (submitBtn) {
      submitBtn.addEventListener("click", handleGuess);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleGuess();
      });
      input.focus();
    }
  }

  function handleCardChoice(cardIndex) {
    SFX.play("click");
    secretNumber = hiddenCandidates[cardIndex];
    cardChosen = true;
    render();
  }

  function handleGuess() {
    if (finished) return;

    const input = document.getElementById("guess-input");
    const value = parseInt(input.value, 10);
    const { min, max } = DIFFICULTY[difficulty];

    if (isNaN(value) || value < min || value > max) {
      showMessage(`Masukkan angka antara ${min} dan ${max}!`, "message-draw");
      return;
    }

    attempts++;
    SFX.play("click");

    if (value === secretNumber) {
      history.push({ value, result: "correct" });
      finished = true;
      document.getElementById("guess-attempts").textContent = attempts;
      renderHistoryOnly();

      SFX.play("win");
      window.showEndModal({
        icon: window.ICONS.trophy,
        title: "Berhasil Ditebak!",
        message: `Angkanya adalah ${secretNumber}. Kamu berhasil dalam ${attempts} percobaan!`,
        type: "win",
      });
      return;
    } else if (value < secretNumber) {
      history.push({ value, result: "low" });
      showMessage("Terlalu kecil! Coba angka lebih besar.", "message-draw");
    } else {
      history.push({ value, result: "high" });
      showMessage("Terlalu besar! Coba angka lebih kecil.", "message-draw");
    }

    document.getElementById("guess-attempts").textContent = attempts;
    renderHistoryOnly();

    const freshInput = document.getElementById("guess-input");
    if (freshInput) {
      freshInput.value = "";
      freshInput.focus();
    }
  }

  // Merender ulang hanya bagian riwayat & percobaan tanpa membangun ulang seluruh layout
  // (menghindari kedipan pada input saat mengetik cepat)
  function renderHistoryOnly() {
    const historyEl = document.getElementById("guess-history");
    if (historyEl) {
      historyEl.innerHTML = history.map((h) => `<span class="guess-chip ${h.result}">${h.value}</span>`).join("");
    }
  }

  function showMessage(text, className) {
    const msgEl = document.getElementById("guess-message");
    if (msgEl) msgEl.innerHTML = `<p class="game-message ${className}">${text}</p>`;
  }

  function startNewRound() {
    hiddenCandidates = generateCandidates();
    secretNumber = null;
    cardChosen = false;
    attempts = 0;
    history = [];
    finished = false;
    render();
  }

  function restart() {
    window.closeEndModal();
    startNewRound();
  }

  function init(containerEl) {
    container = containerEl;
    startNewRound();
  }

  function destroy() {
    window.closeEndModal();
    container = null;
  }

  window.Games = window.Games || {};
  window.Games.guessnumber = { init, restart, destroy };
})();
