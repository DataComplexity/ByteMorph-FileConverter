import './ThreeBackground.css';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeBackground() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const hero = containerRef.current;
    if (!canvas || !hero) return;

    const rect = hero.getBoundingClientRect();
    const W = rect.width || window.innerWidth;
    const H = rect.height || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    camera.position.z = 30;

    // Cyan particles
    const N = 90;
    const pos = new Float32Array(N * 3);
    const vel = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 64;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 42;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 22;
      vel[i * 3] = (Math.random() - 0.5) * 0.014;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.012;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.004;
    }
    const ptGeo = new THREE.BufferGeometry();
    ptGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(ptGeo, new THREE.PointsMaterial({
      color: 0x22D3EE, size: 0.22, transparent: true, opacity: 0.85, sizeAttenuation: true
    })));

    // Violet accent particles
    const vp = new Float32Array(35 * 3);
    for (let i = 0; i < 35; i++) {
      vp[i * 3] = (Math.random() - 0.5) * 58;
      vp[i * 3 + 1] = (Math.random() - 0.5) * 38;
      vp[i * 3 + 2] = (Math.random() - 0.5) * 18;
    }
    const vGeo = new THREE.BufferGeometry();
    vGeo.setAttribute('position', new THREE.BufferAttribute(vp, 3));
    scene.add(new THREE.Points(vGeo, new THREE.PointsMaterial({
      color: 0xA78BFA, size: 0.38, transparent: true, opacity: 0.5, sizeAttenuation: true
    })));

    // Connection lines
    const MAX_L = 160;
    const lpos = new Float32Array(MAX_L * 6);
    const lGeo = new THREE.BufferGeometry();
    lGeo.setAttribute('position', new THREE.BufferAttribute(lpos, 3));
    lGeo.setDrawRange(0, 0);
    const lines = new THREE.LineSegments(lGeo,
      new THREE.LineBasicMaterial({ color: 0x7C3AED, transparent: true, opacity: 0.18 })
    );
    scene.add(lines);

    let t = 0;
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      t += 0.001;
      for (let i = 0; i < N; i++) {
        pos[i * 3] += vel[i * 3];
        pos[i * 3 + 1] += vel[i * 3 + 1];
        pos[i * 3 + 2] += vel[i * 3 + 2];
        if (Math.abs(pos[i * 3]) > 32) vel[i * 3] *= -1;
        if (Math.abs(pos[i * 3 + 1]) > 21) vel[i * 3 + 1] *= -1;
        if (Math.abs(pos[i * 3 + 2]) > 11) vel[i * 3 + 2] *= -1;
      }
      ptGeo.attributes.position.needsUpdate = true;

      let lc = 0;
      const D2 = 13 * 13;
      for (let i = 0; i < N && lc < MAX_L; i++) {
        for (let j = i + 1; j < N && lc < MAX_L; j++) {
          const dx = pos[i * 3] - pos[j * 3];
          const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
          const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
          if (dx * dx + dy * dy + dz * dz < D2) {
            lpos[lc * 6] = pos[i * 3]; lpos[lc * 6 + 1] = pos[i * 3 + 1]; lpos[lc * 6 + 2] = pos[i * 3 + 2];
            lpos[lc * 6 + 3] = pos[j * 3]; lpos[lc * 6 + 4] = pos[j * 3 + 1]; lpos[lc * 6 + 5] = pos[j * 3 + 2];
            lc++;
          }
        }
      }
      lGeo.setDrawRange(0, lc * 2);
      lGeo.attributes.position.needsUpdate = true;

      camera.position.x = Math.sin(t * 0.38) * 3.5;
      camera.position.y = Math.cos(t * 0.27) * 2;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      const W2 = r.width || window.innerWidth;
      const H2 = r.height || window.innerHeight;
      camera.aspect = W2 / H2;
      camera.updateProjectionMatrix();
      renderer.setSize(W2, H2);
    };
    window.addEventListener('resize', onResize);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      ptGeo.dispose(); vGeo.dispose(); lGeo.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="bm-three-container">
      <canvas ref={canvasRef} className="bm-three-canvas" />
    </div>
  );
}
