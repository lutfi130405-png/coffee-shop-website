/* ============================================================
   scene.js — Dunia 3D & WebGL Setup
   Kelas CoffeeScene: Scene, Camera, Renderer, Lights, Particles,
   dan GLTFLoader untuk model .glb (dengan fallback prosedural).
   ============================================================ */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const COLORS = {
  warmAmbient: 0xfff5ea, // ambient hangat
  gold: 0xd4af37,        // directional gold
  warmGold: 0xf3c649,    // partikel & emissive
  bean: 0xb8860b,
};

export default class CoffeeScene {
  /** @param {HTMLCanvasElement} canvas */
  constructor(canvas) {
    this.canvas = canvas;
    this.isMobile = window.matchMedia('(max-width: 768px)').matches;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.sizes = { width: window.innerWidth, height: window.innerHeight };
    this.clock = new THREE.Clock();

    // pointer parallax (halus)
    this.pointer = new THREE.Vector2(0, 0);
    this.pointerTarget = new THREE.Vector2(0, 0);

    this._initRenderer();
    this._initScene();
    this._initCamera();
    this._initLights();
    this._initParticles();
    this._initModel();
    this._bindEvents();
  }

  /* ---------- RENDERER ---------- */
  _initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(this.sizes.width, this.sizes.height);
    // setPixelRatio maksimal 2 — di mobile turunkan lagi untuk jaga 60 FPS
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobile ? 1.5 : 2));
    // TANPA shadow map — hemat GPU, tetap 60 FPS di mobile
    this.renderer.shadowMap.enabled = false;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
  }

  /* ---------- SCENE ---------- */
  _initScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0f0f0f, this.isMobile ? 0.02 : 0.035);

    // grup induk untuk model — dibuat sinkron supaya main.js bisa langsung
    // menganimasikan scene.model.rotation walau .glb belum selesai dimuat
    this.model = new THREE.Group();
    this.scene.add(this.model);
  }

  /* ---------- CAMERA ---------- */
  _initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      45,
      this.sizes.width / this.sizes.height,
      0.1,
      100
    );
    this.camera.position.set(0, 0, 6);
    this.scene.add(this.camera);

    // simpan posisi awal untuk referensi koreografi scroll
    this.cameraStart = this.camera.position.clone();
  }

  /* ---------- LIGHTS (mewah, hangat) ---------- */
  _initLights() {
    // Ambient hangat
    this.scene.add(new THREE.AmbientLight(COLORS.warmAmbient, 0.9));

    // Directional gold — key light
    this.keyLight = new THREE.DirectionalLight(COLORS.gold, 2.4);
    this.keyLight.position.set(4, 6, 5);
    this.scene.add(this.keyLight);

    // Rim light dingin tipis untuk memisahkan model dari background
    const rim = new THREE.DirectionalLight(0xbfd4ff, 0.5);
    rim.position.set(-5, -2, -4);
    this.scene.add(rim);

    // Point light emas yang "menempel" di model — memberi glow
    this.beanLight = new THREE.PointLight(COLORS.warmGold, 2.0, 25, 2);
    this.scene.add(this.beanLight);
  }

  /* ---------- PARTIKEL CAHAYA MELAYANG ---------- */
  _initParticles() {
    const count = this.isMobile ? 1400 : 4200;
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 34;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 26;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 22 - 3;
      speeds[i] = 0.15 + Math.random() * 0.6;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: COLORS.warmGold,
      size: this.isMobile ? 0.05 : 0.045,
      map: this._makeDotTexture(),
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    this.particles = new THREE.Points(geometry, material);
    this.particleSpeeds = speeds;
    this.scene.add(this.particles);
  }

  /** Sprite bulat lembut agar partikel terlihat seperti cahaya, bukan kotak */
  _makeDotTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,240,200,1)');
    g.addColorStop(0.4, 'rgba(243,198,73,0.5)');
    g.addColorStop(1, 'rgba(243,198,73,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /* ---------- MODEL 3D (.glb) + FALLBACK ---------- */
  _initModel() {
    const loader = new GLTFLoader();

    // Ganti path ini dengan model Anda: taruh file di /public/models/coffee.glb
    loader.load(
      '/models/coffee.glb',
      (gltf) => {
        const obj = gltf.scene;
        this._normalizeModel(obj, 2.4);
        // matikan shadow di semua mesh (kita tidak render shadow)
        obj.traverse((n) => {
          if (n.isMesh) {
            n.castShadow = false;
            n.receiveShadow = false;
          }
        });
        this.model.add(obj);
        this._modelReady = true;
      },
      undefined,
      () => {
        // .glb tidak ditemukan → pakai "biji kopi emas" prosedural
        console.info('[scene] /models/coffee.glb tidak ditemukan — memakai model fallback.');
        this.model.add(this._createFallbackBean());
        this._modelReady = true;
      }
    );
  }

  /** Skala & center model agar muat konsisten berapa pun ukurannya */
  _normalizeModel(obj, targetSize = 2.4) {
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = targetSize / Math.max(size.x, size.y, size.z || 1);
    obj.scale.setScalar(scale);
    obj.position.sub(center.multiplyScalar(scale));
  }

  /** Biji kopi emas prosedural — dipakai bila tidak ada .glb */
  _createFallbackBean() {
    const geo = new THREE.SphereGeometry(1, 64, 48);
    geo.scale(0.7, 1.05, 0.55);

    // ukir "seam" berbentuk S di dekat bidang x = 0
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const seam = Math.abs(v.x + Math.sin(v.y * 1.8) * 0.16);
      if (seam < 0.14) v.multiplyScalar(1 - 0.16 * (1 - seam / 0.14) ** 2);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: COLORS.gold,
      metalness: 0.55,
      roughness: 0.32,
      emissive: COLORS.warmGold,
      emissiveIntensity: 0.4,
    });
    const bean = new THREE.Mesh(geo, mat);

    // shell glow additif
    const glow = new THREE.Mesh(
      geo.clone(),
      new THREE.MeshBasicMaterial({
        color: COLORS.warmGold,
        transparent: true,
        opacity: 0.08,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide,
      })
    );
    glow.scale.setScalar(1.4);

    const g = new THREE.Group();
    g.add(bean, glow);
    return g;
  }

  /* ---------- EVENTS ---------- */
  _bindEvents() {
    this._onResize = this.resize.bind(this);
    window.addEventListener('resize', this._onResize);

    if (!this.isMobile) {
      window.addEventListener('pointermove', (e) => {
        this.pointerTarget.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.pointerTarget.y = -((e.clientY / window.innerHeight) * 2 - 1);
      }, { passive: true });
    } else {
      // di mobile pakai gyro sebagai parallax ringan
      window.addEventListener('deviceorientation', (e) => {
        if (e.gamma == null) return;
        this.pointerTarget.x = THREE.MathUtils.clamp(e.gamma / 35, -1, 1);
        this.pointerTarget.y = THREE.MathUtils.clamp((e.beta - 45) / 35, -1, 1);
      }, true);
    }
  }

  /* ---------- RESIZE ---------- */
  resize() {
    this.sizes.width = window.innerWidth;
    this.sizes.height = window.innerHeight;
    this.isMobile = this.sizes.width <= 768;

    this.camera.aspect = this.sizes.width / this.sizes.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.sizes.width, this.sizes.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobile ? 1.5 : 2));
  }

  /* ---------- UPDATE (per frame, dipanggil dari GSAP ticker) ---------- */
  update() {
    const t = this.clock.getElapsedTime();

    // idle rotation halus di atas rotasi yang di-drive scroll
    if (this.model) {
      this.model.rotation.y += 0.0018;
      this.model.position.y = Math.sin(t * 0.6) * 0.08;
    }

    // pointer parallax (lerp supaya smooth)
    this.pointer.x += (this.pointerTarget.x - this.pointer.x) * 0.05;
    this.pointer.y += (this.pointerTarget.y - this.pointer.y) * 0.05;
    this.camera.position.x += (this.pointer.x * 0.6 - this.camera.position.x) * 0.04;
    this.camera.lookAt(0, 0, 0);

    // glow emas berdenyut + ikuti model
    if (this.beanLight) {
      const pulse = 0.85 + Math.sin(t * 1.4) * 0.15;
      this.beanLight.intensity = 2.0 * pulse;
      this.beanLight.position.copy(this.model.position);
    }

    // drift partikel + rotasi halus
    if (this.particles) {
      const arr = this.particles.geometry.attributes.position.array;
      for (let i = 0; i < this.particleSpeeds.length; i++) {
        arr[i * 3 + 1] += this.particleSpeeds[i] * 0.004;
        if (arr[i * 3 + 1] > 13) arr[i * 3 + 1] = -13;
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
      this.particles.rotation.y = t * 0.02;
    }
  }

  /* ---------- RENDER ---------- */
  render() {
    this.renderer.render(this.scene, this.camera);
  }

  /* ---------- CLEANUP ---------- */
  dispose() {
    window.removeEventListener('resize', this._onResize);
    this.renderer.dispose();
  }
}
