/* =========================================================
   SCRIPT.JS - Logika utama Game Center
   Bertanggung jawab untuk:
   - Navigasi antar layar (Menu <-> Game)
   - Tombol Home, Restart, Back to Menu
   - Helper audio sederhana (Web Audio API, tanpa file eksternal)
   - Menghubungkan setiap kartu game ke modulnya masing-masing
   ========================================================= */

/* ---------------------------------------------------------
   AUDIO HELPER
   Menggunakan Web Audio API untuk membuat efek suara "beep"
   sederhana tanpa perlu file audio eksternal.
   Setiap game bisa memanggil window.SFX.play("click") dsb.
   --------------------------------------------------------- */
const SFX = (() => {
  let audioCtx = null;

  // AudioContext baru bisa dibuat setelah ada interaksi user (kebijakan browser)
  function getContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  // Memainkan nada beep sederhana
  function beep({ freq = 440, duration = 0.12, type = "sine", volume = 0.15 }) {
    try {
      const ctx = getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = type;
      oscillator.frequency.value = freq;
      gainNode.gain.value = volume;

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      oscillator.stop(ctx.currentTime + duration);
    } catch (err) {
      // Jika browser memblokir audio, gagalkan secara diam-diam
      console.warn("Audio tidak tersedia:", err);
    }
  }

  // Kumpulan preset efek suara yang bisa dipanggil dari game manapun
  const presets = {
    click: () => beep({ freq: 520, duration: 0.08, type: "square", volume: 0.12 }),
    win: () => {
      beep({ freq: 523, duration: 0.12, type: "triangle" });
      setTimeout(() => beep({ freq: 659, duration: 0.12, type: "triangle" }), 120);
      setTimeout(() => beep({ freq: 784, duration: 0.2, type: "triangle" }), 240);
    },
    lose: () => {
      beep({ freq: 300, duration: 0.15, type: "sawtooth" });
      setTimeout(() => beep({ freq: 200, duration: 0.25, type: "sawtooth" }), 150);
    },
    gameover: () => {
      beep({ freq: 400, duration: 0.15, type: "square" });
      setTimeout(() => beep({ freq: 250, duration: 0.3, type: "square" }), 150);
    },
    eat: () => beep({ freq: 700, duration: 0.08, type: "square", volume: 0.15 }),
    pipe: () => beep({ freq: 880, duration: 0.1, type: "sine", volume: 0.15 }),
    draw: () => beep({ freq: 440, duration: 0.2, type: "triangle" }),
  };

  return {
    play(name) {
      if (presets[name]) presets[name]();
    },
  };
})();
window.SFX = SFX; // agar bisa diakses dari file games/*.js

/* ---------------------------------------------------------
   ICON REGISTRY
   Kumpulan ikon SVG custom (bukan emoji bawaan sistem) yang
   dipakai di judul game & modal popup, supaya tampilan
   konsisten dengan tema desain website.
   --------------------------------------------------------- */
const ICONS = {
  flappybird: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12c3-4 7-5 10-3 1.5 1 3 1 5-1"></path><path d="M13 9c2-2 5-2 7 0-1.5 2-3.5 3-5.5 2.3"></path><circle cx="15.2" cy="9.2" r="0.6" fill="currentColor" stroke="none"></circle></svg>`,
  tictactoe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><circle cx="15" cy="12" r="2"></circle></svg>`,
  breakout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="6" height="3" rx="1"></rect><rect x="14" y="5" width="6" height="3" rx="1"></rect><circle cx="12" cy="14" r="1.2" fill="currentColor" stroke="none"></circle><rect x="8" y="18" width="8" height="2" rx="1"></rect></svg>`,
  snake: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8c2 0 2 3 4 3s2-3 4-3 2 3 4 3 2-3 4-3"></path><circle cx="4" cy="15" r="1.3" fill="currentColor" stroke="none"></circle><path d="M4 15c2 0 2-3 4-3"></path></svg>`,
  guessnumber: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="6" width="6" height="9" rx="1.4"></rect><rect x="14" y="9" width="6" height="9" rx="1.4"></rect><path d="M11.6 11.5c0-.9 1.4-.8 1.4-1.7 0-.5-.4-.8-.9-.8s-.9.3-.9.8"></path></svg>`,
  trophy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v5a4 4 0 0 1-8 0V4z"></path><path d="M8 5H5a3 3 0 0 0 3 4"></path><path d="M16 5h3a3 3 0 0 1-3 4"></path><line x1="12" y1="13" x2="12" y2="17"></line><path d="M9 20h6"></path><path d="M10 17h4l1 3H9l1-3z"></path></svg>`,
  gameover: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><line x1="9" y1="9" x2="10.5" y2="10.5"></line><line x1="10.5" y1="9" x2="9" y2="10.5"></line><line x1="13.5" y1="9" x2="15" y2="10.5"></line><line x1="15" y1="9" x2="13.5" y2="10.5"></line><path d="M8.5 16c1-1.3 6-1.3 7 0"></path></svg>`,
  draw: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><line x1="8" y1="15" x2="16" y2="15"></line><circle cx="9" cy="10" r="1" fill="currentColor" stroke="none"></circle><circle cx="15" cy="10" r="1" fill="currentColor" stroke="none"></circle></svg>`,
};
window.ICONS = ICONS;

/* ---------------------------------------------------------
   NAVIGASI ANTAR LAYAR
   --------------------------------------------------------- */
const menuScreen = document.getElementById("menu-screen");
const gameScreen = document.getElementById("game-screen");
const gameContainer = document.getElementById("game-container");
const gameTitleLabel = document.getElementById("game-title");

const btnHome = document.getElementById("btn-home");
const btnRestart = document.getElementById("btn-restart");
const btnBack = document.getElementById("btn-back");

// Nama tampilan untuk setiap game (dipakai di judul atas)
const GAME_DISPLAY_NAMES = {
  flappybird: "Flappy Bird",
  tictactoe: "Tic Tac Toe",
  breakout: "Breakout",
  snake: "Snake",
  guessnumber: "Tebak Angka",
};

// Menyimpan id game yang sedang aktif, supaya tombol Restart tahu
// game mana yang harus di-restart.
let currentGameId = null;

/**
 * Menampilkan sebuah layar (menu atau game) dan menyembunyikan yang lain.
 */
function showScreen(screenEl) {
  [menuScreen, gameScreen].forEach((el) => el.classList.remove("active"));
  screenEl.classList.add("active");
}

/**
 * Membuka game tertentu ke dalam #game-container.
 * Setiap modul game harus terdaftar di window.Games[gameId] dengan
 * method: init(container), restart(), destroy()
 */
function openGame(gameId) {
  const gameModule = window.Games && window.Games[gameId];
  if (!gameModule) {
    console.error(`Game "${gameId}" belum terdaftar di window.Games`);
    return;
  }

  // Bersihkan game sebelumnya (hentikan interval/animasi agar tidak bocor memori)
  destroyCurrentGame();

  currentGameId = gameId;
  const iconSvg = ICONS[gameId] || "";
  gameTitleLabel.innerHTML = `${iconSvg}<span>${GAME_DISPLAY_NAMES[gameId] || "Game"}</span>`;

  // Kosongkan container lalu biarkan modul game merender dirinya sendiri
  gameContainer.innerHTML = "";
  gameModule.init(gameContainer);

  showScreen(gameScreen);
}

/**
 * Menghentikan game yang sedang berjalan (memanggil destroy() jika ada)
 */
function destroyCurrentGame() {
  if (currentGameId && window.Games[currentGameId] && window.Games[currentGameId].destroy) {
    window.Games[currentGameId].destroy();
  }
}

/**
 * Restart game yang sedang aktif.
 */
function restartCurrentGame() {
  if (currentGameId && window.Games[currentGameId] && window.Games[currentGameId].restart) {
    SFX.play("click");
    window.Games[currentGameId].restart();
  }
}

/**
 * Kembali ke menu utama (menghentikan game yang berjalan).
 */
function goToMenu() {
  SFX.play("click");
  destroyCurrentGame();
  currentGameId = null;
  showScreen(menuScreen);
}

/* ---------------------------------------------------------
   MODAL POPUP (dipakai semua game saat menang / kalah / seri)
   Menampilkan pesan + tombol "Main Lagi" & "Ke Menu" yang
   berdekatan langsung, tanpa perlu scroll ke topbar.
   --------------------------------------------------------- */
function showEndModal({ icon = ICONS.gameover, title, message, type = "lose" }) {
  // Hapus modal lama jika masih ada (mencegah dobel modal)
  const existing = document.querySelector(".modal-overlay");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.innerHTML = `
    <div class="modal-box modal-${type}">
      <div class="modal-icon">${icon}</div>
      <h3 class="modal-title">${title}</h3>
      <p class="modal-message">${message}</p>
      <div class="modal-actions">
        <button class="btn btn-play" id="modal-restart-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 1 2.4 5.7"></path><path d="M4 17v-5h5"></path></svg>
          Main Lagi
        </button>
        <button class="btn btn-nav" id="modal-home-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11.5L12 4l8 7.5"></path><path d="M6 10v9h12v-9"></path></svg>
          Ke Menu
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById("modal-restart-btn").addEventListener("click", () => {
    overlay.remove();
    restartCurrentGame();
  });
  document.getElementById("modal-home-btn").addEventListener("click", () => {
    overlay.remove();
    goToMenu();
  });
}
window.showEndModal = showEndModal;

/**
 * Menutup modal popup jika sedang terbuka (dipanggil game saat restart
 * dipicu lewat topbar, bukan lewat tombol modal).
 */
function closeEndModal() {
  const existing = document.querySelector(".modal-overlay");
  if (existing) existing.remove();
}
window.closeEndModal = closeEndModal;

/* ---------------------------------------------------------
   LAYOUT + DEKORASI SAMPING
   Membungkus konten sebuah game dengan dekorasi kiri/kanan
   yang sesuai tema, supaya area kosong di sisi game terisi
   animasi ringan tanpa mengganggu permainan.
   --------------------------------------------------------- */
const DECOR_MARKUP = {
  numbers: `<span class="floating-item">7</span><span class="floating-item">42</span><span class="floating-item">9</span><span class="floating-item">15</span><span class="floating-item">3</span>`,
  xo: `
    <span class="floating-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="5" x2="19" y2="19"></line><line x1="19" y1="5" x2="5" y2="19"></line></svg></span>
    <span class="floating-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"></circle></svg></span>
    <span class="floating-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="5" x2="19" y2="19"></line><line x1="19" y1="5" x2="5" y2="19"></line></svg></span>
    <span class="floating-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"></circle></svg></span>
  `,
  snake: `<span class="snake-trail"></span><span class="snake-trail"></span><span class="snake-trail"></span><span class="snake-trail"></span><span class="snake-trail"></span><span class="snake-trail"></span><span class="snake-trail"></span>`,
  clouds: `<span class="cloud-shape"></span><span class="cloud-shape"></span><span class="cloud-shape"></span>`,
  breakout: `<span class="brick-item"></span><span class="brick-item"></span><span class="brick-item"></span><span class="brick-item"></span><span class="ball-item"></span>`,
};

/**
 * Membungkus HTML konten game dengan dekorasi kiri & kanan sesuai tema.
 * @param {HTMLElement} container - elemen #game-container
 * @param {string} decorType - salah satu key di DECOR_MARKUP
 * @param {string} innerHTML - HTML konten utama game
 * @returns {HTMLElement} elemen .game-main tempat konten dirender (gunakan ini untuk querySelector)
 */
function wrapWithDecorations(container, decorType, innerHTML) {
  const decorHTML = DECOR_MARKUP[decorType] || "";

  container.innerHTML = `
    <div class="game-layout">
      <div class="side-decor decor-${decorType}">${decorHTML}</div>
      <div class="game-main">${innerHTML}</div>
      <div class="side-decor decor-${decorType}">${decorHTML}</div>
    </div>
  `;

  return container.querySelector(".game-main");
}
window.wrapWithDecorations = wrapWithDecorations;

/* ---------------------------------------------------------
   CEGAH SCROLL HALAMAN SAAT BERMAIN
   Tombol panah & Space secara default membuat browser scroll
   halaman. Saat layar game sedang aktif, kita cegah perilaku
   itu supaya layar tidak "geser-geser" ketika mengontrol game
   (Snake, Breakout, Flappy Bird, dll).
   --------------------------------------------------------- */
const SCROLL_BLOCKING_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " ", "Spacebar"];

document.addEventListener(
  "keydown",
  (e) => {
    const isGameScreenActive = gameScreen.classList.contains("active");
    if (isGameScreenActive && SCROLL_BLOCKING_KEYS.includes(e.key)) {
      e.preventDefault();
    }
  },
  { passive: false }
);

/* ---------------------------------------------------------
   EVENT LISTENERS
   --------------------------------------------------------- */

// Tombol Play pada setiap kartu game
document.querySelectorAll(".btn-play").forEach((btn) => {
  btn.addEventListener("click", () => {
    SFX.play("click");
    const gameId = btn.dataset.game;
    openGame(gameId);
  });
});

// Tombol navigasi di layar game
btnHome.addEventListener("click", goToMenu);
btnBack.addEventListener("click", goToMenu);
btnRestart.addEventListener("click", restartCurrentGame);

/* ---------------------------------------------------------
   INISIALISASI AWAL
   --------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  showScreen(menuScreen);
});
