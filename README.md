# 🎮 Game Center

Sebuah website **game center** berisi **5 mini game** dalam satu halaman, dibuat murni menggunakan **HTML, CSS, dan JavaScript (Vanilla JS)** — tanpa framework (React/Vue/Angular), tanpa library CSS (Bootstrap), dan tanpa library game (Phaser).

Cocok dijalankan langsung dari **Visual Studio Code** menggunakan ekstensi **Live Server**, tanpa perlu Node.js, npm, database, atau server backend apa pun.

---

## 📂 Struktur Folder

```
game-center/
│
├── index.html          # Halaman utama (menu + shell game)
├── style.css            # Semua styling & animasi
├── script.js            # Navigasi antar layar + helper audio
│
├── assets/
│   ├── images/          # Tempat gambar/ikon tambahan (opsional)
│   ├── sounds/          # Tempat file audio tambahan (opsional)
│   └── icons/           # Tempat ikon tambahan (opsional)
│
├── games/
│   ├── flappybird.js     # Logika game Flappy Bird
│   ├── snake.js          # Logika game Snake
│   ├── tictactoe.js       # Logika game Tic Tac Toe
│   ├── breakout.js        # Logika game Breakout
│   └── guessnumber.js     # Logika game Tebak Angka
│
└── README.md
```

> **Catatan tentang audio:** Efek suara dibuat langsung menggunakan **Web Audio API** (nada "beep" sintetis) di dalam `script.js`, jadi tidak memerlukan file audio eksternal. Folder `assets/sounds/` disediakan sebagai tempat jika kamu ingin mengganti dengan file `.mp3`/`.wav` bebas hak cipta sendiri.

---

## 🚀 Cara Menjalankan di VS Code

1. **Buka folder proyek** `game-center` di Visual Studio Code
   (`File > Open Folder...` lalu pilih folder `game-center`).

2. **Install ekstensi Live Server** (jika belum ada):
   - Buka tab **Extensions** (`Ctrl+Shift+X` / `Cmd+Shift+X`).
   - Cari **"Live Server"** oleh Ritwick Dey.
   - Klik **Install**.

3. **Jalankan website:**
   - Klik kanan pada file `index.html` di file explorer VS Code.
   - Pilih **"Open with Live Server"**.
   - Browser akan otomatis terbuka di alamat seperti `http://127.0.0.1:5500/index.html`.

4. Selesai! Website game center siap dimainkan. 🎉

> Alternatif: kamu juga bisa langsung membuka file `index.html` di browser dengan cara klik dua kali (tanpa Live Server), namun disarankan tetap menggunakan Live Server agar reload otomatis saat mengedit kode.

---

## ✨ Daftar Fitur

### Umum
- Tampilan modern: gradient biru tua + aksen cyan, card dengan shadow, border radius, animasi hover.
- Font **Poppins** dari Google Fonts.
- Semua ikon menggunakan SVG kustom bertema (bukan emoji bawaan sistem), termasuk ikon kartu game, tombol, dan judul.
- Popup modal saat menang / kalah / seri, lengkap dengan tombol **Main Lagi** dan **Ke Menu** yang berdekatan.
- Judul di layar game selalu benar-benar center menggunakan layout grid 3 kolom.
- Dekorasi animasi ringan bertema di sisi kiri & kanan setiap game (tidak mengganggu permainan, otomatis hilang di layar sempit).
- Animasi CSS: fade in, slide, zoom, bounce, transisi antar menu.
- Navigasi: **Home**, **Restart**, **Back to Menu** pada setiap game.
- Fully responsif untuk HP dan laptop.
- Efek suara ringan (klik, menang, kalah, game over, makan makanan, lewati pipa) menggunakan Web Audio API.

### 🐦 Flappy Bird
- HTML5 Canvas
- Burung digambar sebagai **sprite pixel-art 8-bit** (dibuat langsung dengan canvas, tanpa file gambar eksternal), dengan animasi kepakan sayap
- Gravitasi & mekanik lompat (flap)
- Pipa muncul secara acak
- Skor & high score
- Collision detection (tabrakan pipa/lantai/atap)
- Kontrol: **Space** atau **klik mouse**
- Dekorasi awan melayang di sisi kiri & kanan
- Game over ditampilkan lewat popup modal

### 🐍 Snake
- Area permainan yang lebih luas (26x26 grid)
- Kontrol **WASD** dan **Arrow Keys**
- Makanan biasa muncul acak di grid
- **Makanan bonus (bola besar)** muncul berkala dan bernilai 5x poin biasa, lalu hilang lagi jika tidak segera dimakan
- Skor & high score
- Kecepatan bertambah setiap 5 poin
- Headline dekoratif bertema ular + dekorasi animasi di sisi kiri & kanan
- Game over ditampilkan lewat popup modal

### ❌⭕ Tic Tac Toe
- Mode **Player vs Player** dan **Player vs Computer**
- Level kesulitan untuk mode vs Computer: **Easy**, **Medium**, **Hard**, dikalibrasi supaya peluang menang pemain kira-kira 50% / 25% / 5% (lihat catatan di bawah)
- AI menggunakan **Minimax**, dikombinasikan dengan peluang "kesalahan" acak sesuai level
- Indikator giliran pemain
- Highlight garis kemenangan
- Skor pertandingan (X, O, Seri)
- Dekorasi X/O melayang di sisi kiri & kanan
- Popup modal saat menang / kalah / seri

> **Catatan tentang persentase kemenangan:** karena Tic Tac Toe dengan permainan sempurna selalu berakhir seri, persentase di atas dicapai dengan mengatur seberapa sering komputer "sengaja" bermain kurang optimal — ini adalah target perkiraan (tuning), bukan jaminan matematis yang presisi persis di setiap sesi permainan.

### 🧱 Breakout
- HTML5 Canvas dengan paddle, bola, dan susunan bata berwarna
- Kontrol paddle: **Keyboard** (Arrow Keys / A-D) **dan Mouse** sekaligus
- Bata di baris atas bernilai poin lebih tinggi
- Sistem nyawa (3 nyawa)
- Menang saat semua bata hancur, kalah saat nyawa habis
- Skor & high score
- Dekorasi bata & bola melayang di sisi kiri & kanan
- Popup modal saat menang / kalah

### 🔢 Tebak Angka
- Saat game dimulai, tersedia **3 kartu misteri tertutup** — setiap kartu sudah menyimpan angka rahasia acak
- Player memilih salah satu kartu; angka di baliknya menjadi target tebakan
- Petunjuk "terlalu besar" / "terlalu kecil" setelah setiap tebakan
- Hitung jumlah percobaan & riwayat tebakan
- 3 tingkat kesulitan:
  - **Easy**: 1–50
  - **Medium**: 1–100
  - **Hard**: 1–500
- Dekorasi angka melayang di sisi kiri & kanan
- Popup modal saat berhasil menebak

---

## 🖼️ Screenshot

> Tambahkan screenshot tampilan website di sini setelah dijalankan.

```
assets/images/screenshot-menu.png       -> Tampilan menu utama
assets/images/screenshot-flappybird.png -> Tampilan game Flappy Bird
assets/images/screenshot-snake.png      -> Tampilan game Snake
assets/images/screenshot-tictactoe.png  -> Tampilan game Tic Tac Toe
assets/images/screenshot-breakout.png   -> Tampilan game Breakout
assets/images/screenshot-guessnumber.png-> Tampilan game Tebak Angka
```

---

## 🛠️ Teknologi

- HTML5 (Canvas untuk Flappy Bird & Snake)
- CSS3 (Custom Properties, Grid, Flexbox, Animation)
- JavaScript ES6+ (Vanilla, modular per file)
- Web Audio API (efek suara tanpa file eksternal)
- Google Fonts (Poppins)

Tidak ada dependensi eksternal, tidak ada proses build, tidak ada backend — cukup buka dan mainkan!

---

## 📄 Lisensi

Bebas digunakan dan dimodifikasi untuk keperluan belajar maupun pengembangan lebih lanjut.
