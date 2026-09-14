/* ============================================================
   main.js — Integration Engine
   - Lenis Smooth Scroll
   - GSAP + ScrollTrigger disinkronkan ke GSAP ticker
   - Koreografi scroll-driven: model 3D, kamera, partikel, teks
   - Reservasi form → WhatsApp
   ============================================================ */

import './style.css';
import Lenis from 'lenis';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import CoffeeScene from './scene.js';

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============================================================
   1. DUNIA 3D
   ============================================================ */
const scene = new CoffeeScene(document.querySelector('#webgl-canvas'));

/* ============================================================
   2. LENIS SMOOTH SCROLL  +  SINKRONISASI GSAP TICKER
   ============================================================ */
const lenis = new Lenis({
  duration: 1.2,
  smoothWheel: true,
  wheelMultiplier: 0.9,
  touchMultiplier: 1.5,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
});

// Setiap Lenis scroll → beritahu ScrollTrigger untuk update
lenis.on('scroll', ScrollTrigger.update);

// Jalankan Lenis + render 3D dari SATU sumber waktu: GSAP ticker.
// Ini membuat scroll, animasi GSAP, dan render Three.js benar-benar selaras.
gsap.ticker.add((time) => {
  lenis.raf(time * 1000); // GSAP ticker pakai detik, Lenis minta milidetik
  scene.update();
  scene.render();
});
gsap.ticker.lagSmoothing(0);

// klik anchor → scroll mulus via Lenis
document.querySelectorAll('[data-scroll-to]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    const el = id && document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    lenis.scrollTo(el, { offset: 0, duration: 1.4 });
  });
});

/* ============================================================
   3. KOREOGRAFI SCROLL-DRIVEN (master timeline, scrub)
   ============================================================ */
if (!reducedMotion) {
  const master = gsap.timeline({
    scrollTrigger: {
      trigger: '#scroll-container',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.5,
    },
  });

  // --- Rotasi model 3D sepanjang scroll (2 putaran + miring) ---
  master.to(scene.model.rotation, { y: Math.PI * 2.4, x: 0.5, ease: 'none' }, 0);

  // --- Pergerakan kamera Z / Y : mendekat lalu turun ---
  master.to(
    scene.camera.position,
    { z: 3.4, y: -1.6, ease: 'none' },
    0
  );

  // --- Rotasi & pergeseran partikel ---
  master.to(scene.particles.rotation, { y: Math.PI * 0.6, x: 0.3, ease: 'none' }, 0);
  master.to(scene.particles.position, { z: 2, ease: 'none' }, 0);

  // --- Warna cahaya key light bergeser sedikit lebih hangat ---
  master.to(scene.keyLight, { intensity: 3.4, ease: 'none' }, 0);

  /* ----------------------------------------------------------
     4. ANIMASI TEKS HTML SELARAS DENGAN KAMERA 3D
     ---------------------------------------------------------- */

  // a) Reveal tiap elemen .reveal saat masuk viewport
  gsap.utils.toArray('.reveal').forEach((el) => {
    gsap.from(el, {
      opacity: 0,
      y: 42,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });

  // b) Parallax + fade tiap section (selaras dengan gerak kamera)
  gsap.utils.toArray('.section').forEach((section) => {
    const inner = section.querySelector('.section__inner');
    gsap.fromTo(
      inner,
      { yPercent: 6, autoAlpha: 0.35 },
      {
        yPercent: -6,
        autoAlpha: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );
  });

  // c) Hero keluar (fade + naik) saat mulai scroll
  gsap.to('.section--hero .section__inner', {
    autoAlpha: 0,
    y: -80,
    ease: 'none',
    scrollTrigger: {
      trigger: '.section--hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  });
} else {
  // reduced motion: tampilkan semua teks langsung
  gsap.set('.reveal', { opacity: 1, y: 0 });
}

/* ============================================================
   5. MAGNETIC BUTTONS (sentuhan mewah)
   ============================================================ */
if (!reducedMotion && window.matchMedia('(pointer: fine)').matches) {
  document.querySelectorAll('.btn').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      gsap.to(btn, {
        x: (e.clientX - r.left - r.width / 2) * 0.3,
        y: (e.clientY - r.top - r.height / 2) * 0.4,
        duration: 0.5,
        ease: 'power2.out',
      });
    });
    btn.addEventListener('pointerleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
    });
  });
}

/* ============================================================
   6. FORM RESERVASI → WHATSAPP
   ============================================================ */
const WA_NUMBER = '6281234567890'; // ganti dengan nomor WA cafe

document.getElementById('year').textContent = new Date().getFullYear();

const form = document.getElementById('reservation-form');
const dateInput = form.querySelector('input[name="date"]');
const errEl = form.querySelector('.form__error');

// default tanggal = besok
(() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  dateInput.min = new Date().toISOString().split('T')[0];
  dateInput.value = d.toISOString().split('T')[0];
})();

const toast = document.createElement('div');
toast.className = 'toast';
toast.setAttribute('role', 'status');
document.body.appendChild(toast);
let toastTimer;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 4000);
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const name = (data.get('name') || '').toString().trim();
  const date = data.get('date');
  const time = data.get('time');
  const guests = data.get('guests');
  const note = (data.get('note') || '').toString().trim();

  if (!name || !date || !time) {
    errEl.hidden = false;
    errEl.textContent = 'Mohon isi nama, tanggal, dan waktu.';
    return;
  }
  errEl.hidden = true;

  const msg =
    `Halo Pusaka Coffee Roasters, saya ingin reservasi meja.%0A%0A` +
    `Nama: ${encodeURIComponent(name)}%0A` +
    `Tanggal: ${date}%0A` +
    `Waktu: ${encodeURIComponent(time)}%0A` +
    `Jumlah tamu: ${guests}` +
    (note ? `%0ACatatan: ${encodeURIComponent(note)}` : '');

  showToast('Membuka WhatsApp untuk konfirmasi…');
  window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, '_blank', 'noopener');
});

/* ============================================================
   7. RESIZE (kamera + renderer) — sudah ditangani di scene.js,
   di sini hanya refresh ScrollTrigger setelah layout berubah
   ============================================================ */
window.addEventListener('resize', () => ScrollTrigger.refresh());
window.addEventListener('load', () => ScrollTrigger.refresh());

// Lenis mengubah tinggi dokumen → beri tahu ScrollTrigger
lenis.on('scroll', () => {});
ScrollTrigger.refresh();
