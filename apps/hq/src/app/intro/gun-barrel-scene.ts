import * as THREE from 'three';

// This module is loaded only via dynamic import() from GunBarrel, so three.js
// lives in its own lazy chunk and never touches the initial bundle.

const TRAVEL_MS = 2200;
const FADE_MS = 320;
const FOV = 70;
const BORE_RADIUS = 3;
const BARREL_LENGTH = 160;
const START_Z = 12;
const EXIT_Z = -140;

/**
 * WebGL gun-barrel fly-through: the camera rides the rifling grooves down
 * the bore and eases to a stop where the paper muzzle disc at the barrel
 * exit projects to exactly the DOM iris diameter; the walls then fade to
 * noir so the last frame is the circle stage's first frame and the handoff
 * is seamless. Palette comes from the design tokens at runtime — no raw
 * values here.
 */
export class GunBarrelScene {
  private renderer: THREE.WebGLRenderer | undefined;
  private disposables: { dispose(): void }[] = [];
  private onDone: (() => void) | undefined;
  private onResize: (() => void) | undefined;
  private finished = false;

  start(canvas: HTMLCanvasElement, onDone: () => void): void {
    this.onDone = onDone;

    const gold = cssColor('--gold', '#c9a227');
    const noir = cssColor('--noir-black', '#0d0d0f');
    const paper = cssColor('--dossier-paper', '#efe6d0');

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(noir);
    scene.fog = new THREE.Fog(new THREE.Color(noir), 8, 70);

    const camera = new THREE.PerspectiveCamera(
      FOV,
      window.innerWidth / window.innerHeight,
      0.1,
      200,
    );
    camera.position.z = START_Z;

    const texture = riflingTexture(gold, noir);
    const geometry = new THREE.CylinderGeometry(
      BORE_RADIUS,
      BORE_RADIUS,
      BARREL_LENGTH,
      48,
      1,
      true,
    );
    geometry.rotateX(Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
      transparent: true,
    });
    const barrel = new THREE.Mesh(geometry, material);
    barrel.position.z = EXIT_Z + BARREL_LENGTH / 2;
    scene.add(barrel);

    // The light at the end of the tunnel: the muzzle disc, unfogged so it
    // reads as a bright pinpoint from the start and becomes the iris.
    const discGeometry = new THREE.CircleGeometry(BORE_RADIUS, 48);
    const discMaterial = new THREE.MeshBasicMaterial({ color: paper, fog: false });
    const disc = new THREE.Mesh(discGeometry, discMaterial);
    disc.position.z = EXIT_Z;
    scene.add(disc);

    this.disposables = [geometry, material, texture, discGeometry, discMaterial];

    const resize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight, false);
    };
    window.addEventListener('resize', resize);
    this.onResize = resize;

    let startTime: number | undefined;
    renderer.setAnimationLoop((time) => {
      startTime ??= time;
      const t = time - startTime;

      // Ease in and out: the ride accelerates down the bore, then brakes so
      // the muzzle disc arrives at exactly the DOM iris size.
      const travel = easeInOutCubic(Math.min(1, t / TRAVEL_MS));
      camera.position.z = START_Z + (stopZ() - START_Z) * travel;
      camera.rotation.z = travel * Math.PI * 1.5;

      if (t > TRAVEL_MS) {
        const fadeT = Math.min(1, (t - TRAVEL_MS) / FADE_MS);
        material.opacity = 1 - fadeT;
        if (fadeT >= 1) {
          this.finish();
        }
      }

      renderer.render(scene, camera);
    });
  }

  skip(): void {
    this.finish();
  }

  dispose(): void {
    this.renderer?.setAnimationLoop(null);
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
    this.renderer?.dispose();
    this.renderer = undefined;
    if (this.onResize) {
      window.removeEventListener('resize', this.onResize);
      this.onResize = undefined;
    }
  }

  private finish(): void {
    if (!this.finished) {
      this.finished = true;
      this.renderer?.setAnimationLoop(null);
      this.onDone?.();
    }
  }
}

/**
 * Camera stop so the disc's projected radius equals the DOM iris radius
 * (`.stage-circle` is min(46vmin, 400px) across). Recomputed per frame so a
 * mid-ride resize still lands the handoff.
 */
function stopZ(): number {
  const irisRadiusPx =
    0.5 * Math.min(0.46 * Math.min(window.innerWidth, window.innerHeight), 400);
  const halfFov = Math.tan((FOV * Math.PI) / 360);
  const distance = (BORE_RADIUS * (window.innerHeight / 2)) / (halfFov * irisRadiusPx);
  return EXIT_Z + distance;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Diagonal gold grooves on noir, tiled around and along the barrel. */
function riflingTexture(gold: string, noir: string): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('2d canvas context unavailable');
  }
  context.fillStyle = noir;
  context.fillRect(0, 0, size, size);
  context.strokeStyle = gold;
  context.globalAlpha = 0.55;
  context.lineWidth = 3;
  for (let i = -4; i < 12; i++) {
    context.beginPath();
    context.moveTo(i * 32, 0);
    context.lineTo(i * 32 + 96, size);
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 24);
  return texture;
}

function cssColor(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}
