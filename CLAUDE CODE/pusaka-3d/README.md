# Pusaka Coffee — 3D Immersive Landing Page

Landing page cafe dengan latar **WebGL fixed** (Three.js), scroll **sangat mulus**
(Lenis), dan **koreografi scroll-driven** (GSAP ScrollTrigger). Struktur modular,
di-bundle dengan Vite, di-styling dengan Tailwind CSS v4.

---

## 1. Instalasi

```bash
# dari dalam folder pusaka-3d/
npm install

# atau instal manual dari nol:
npm install three gsap lenis
npm install -D vite tailwindcss @tailwindcss/vite
```

## 2. Menjalankan

```bash
npm run dev       # http://localhost:5173  (juga terekspos ke IP LAN untuk tes HP)
npm run build     # output ke dist/
npm run preview   # pratinjau hasil build
```

## 3. Struktur folder

```
pusaka-3d/
├── index.html               # #webgl-canvas + #scroll-container (Hero, Catalog, Reservation)
├── package.json
├── vite.config.js            # plugin @tailwindcss/vite
├── .gitignore
├── public/
│   └── models/
│       ├── README.md
│       └── coffee.glb        # (opsional) model 3D kustom Anda — taruh di sini
└── src/
    ├── style.css             # Tailwind v4 (@theme tokens) + CSS layout & komponen
    ├── scene.js              # class CoffeeScene: Scene, Camera, Renderer, Lights,
    │                         #   Particles (PointsMaterial gold), GLTFLoader + fallback
    └── main.js               # Lenis + GSAP ticker sync + master ScrollTrigger timeline
```

## 4. Cara kerja singkat

| Bagian | File | Isi |
|---|---|---|
| Canvas fixed `z-index:-1`, kontainer scroll `z-index:10` | `index.html`, `style.css` | sesuai spesifikasi layout |
| Scene / Camera / Renderer (`alpha`, `antialias`, pixelRatio ≤ 2) | `scene.js` `_initRenderer/_initScene/_initCamera` | |
| Ambient hangat `0xfff5ea` + Directional gold `0xd4af37` | `scene.js` `_initLights` | plus rim light & point light glow |
| Partikel cahaya emas melayang | `scene.js` `_initParticles` | `PointsMaterial` + sprite bulat, additive |
| GLTFLoader model `.glb` | `scene.js` `_initModel` | fallback "biji kopi emas" prosedural bila `.glb` tak ada |
| Lenis `duration: 1.2, smoothWheel: true` | `main.js` | |
| Sinkron Lenis ⇄ ScrollTrigger ⇄ GSAP ticker | `main.js` | `gsap.ticker.add(t => lenis.raf(t*1000))` + `lagSmoothing(0)` |
| Timeline scrub `1.5`, trigger `#scroll-container` | `main.js` | rotasi model, kamera Z/Y, rotasi partikel |
| Fade/parallax teks selaras kamera | `main.js` | reveal + parallax per-section + hero exit |
| Resize kamera & renderer | `scene.js` `resize()` + `main.js` `ScrollTrigger.refresh()` | |
| Optimasi mobile | `scene.js` | tanpa shadow, pixelRatio 1.5, partikel 1400, fog lebih tipis |

## 5. Kustomisasi cepat

- **Model 3D**: taruh `coffee.glb` di `public/models/` (lihat README di sana).
- **Warna / font**: ubah token di blok `@theme` pada `src/style.css`.
- **Intensitas animasi scroll**: ubah target di `master.to(...)` pada `src/main.js`.
- **Nomor WhatsApp**: konstanta `WA_NUMBER` di `src/main.js`.
- **Konten menu / teks**: langsung di `index.html`.

## 6. Deploy

Hasil `npm run build` (folder `dist/`) adalah situs statis biasa — bisa di-drop ke
**Netlify / Vercel / Cloudflare Pages / GitHub Pages**. Pastikan `public/models/*.glb`
ikut ter-deploy (Vite menyalin `public/` apa adanya).
