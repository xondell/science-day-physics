/* 3D-модели и материалы. Всё процедурное: работает без внешних файлов и fetch. */
(function () {
  'use strict';
  window.SP = window.SP || {};

  const C = {
    ink: 0x14231e,
    ink2: 0x34463e,
    paper: 0xfff8ea,
    paper2: 0xefe7d5,
    cream: 0xfff3dd,
    green: 0x2f7d4e,
    greenDeep: 0x14563a,
    greenLight: 0x6aa96a,
    orange: 0xf26b2a,
    orangeLight: 0xffa46e,
    blue: 0x2e9cc4,
    blueDeep: 0x1a6f8e,
    blueLight: 0x9ed8e7,
    red: 0xb6422c,
    yellow: 0xf2c94c,
    gold: 0xd9a441,
    goldLight: 0xffd98a,
    skin: 0xd7a074,
    skinDark: 0xb87a50,
    wood: 0x8a5a37,
    woodLight: 0xb07a4d,
    white: 0xffffff,
    grey: 0x8a9690,
    dark: 0x1c2b26
  };

  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const v3 = (a) => (Array.isArray(a) ? V(a[0], a[1], a[2]) : a);

  function mat(color, opts) {
    return new THREE.MeshStandardMaterial(Object.assign({
      color: color,
      roughness: 0.72,
      metalness: 0.0,
      flatShading: true
    }, opts || {}));
  }

  function basic(color, opts) {
    return new THREE.MeshBasicMaterial(Object.assign({ color: color }, opts || {}));
  }

  function cleanMat(opts) {
    const c = Object.assign({}, opts || {});
    ['pos', 'rot', 'scale', 'castShadow', 'receiveShadow', 'seg'].forEach((k) => delete c[k]);
    return c;
  }

  function mesh(geo, material, opts) {
    const m = new THREE.Mesh(geo, material);
    opts = opts || {};
    if (opts.pos) m.position.set(opts.pos[0], opts.pos[1], opts.pos[2]);
    if (opts.rot) m.rotation.set(opts.rot[0], opts.rot[1], opts.rot[2]);
    if (opts.scale) m.scale.set(opts.scale[0], opts.scale[1], opts.scale[2]);
    m.castShadow = opts.castShadow !== false;
    m.receiveShadow = opts.receiveShadow !== false;
    return m;
  }

  function box(w, h, d, color, opts) {
    return mesh(new THREE.BoxGeometry(w, h, d), mat(color, cleanMat(opts)), opts || {});
  }

  function rounded(w, h, d, r, color, opts) {
    return mesh(new THREE.RoundedBoxGeometry(w, h, d, 3, r), mat(color, cleanMat(opts)), opts || {});
  }

  function sphere(r, color, opts) {
    return mesh(new THREE.SphereGeometry(r, 28, 20), mat(color, Object.assign({ flatShading: false }, cleanMat(opts))), opts || {});
  }

  function lowSphere(r, color, opts) {
    return mesh(new THREE.IcosahedronGeometry(r, 1), mat(color, cleanMat(opts)), opts || {});
  }

  function cylinder(rTop, rBottom, h, color, opts) {
    return mesh(new THREE.CylinderGeometry(rTop, rBottom, h, opts && opts.seg || 16, 1), mat(color, cleanMat(opts)), opts || {});
  }

  function capsule(r, len, color, opts) {
    return mesh(new THREE.CapsuleGeometry(r, len, 5, 10), mat(color, cleanMat(opts)), opts || {});
  }

  function torus(r, tube, color, opts) {
    return mesh(new THREE.TorusGeometry(r, tube, 10, 40), mat(color, cleanMat(opts)), opts || {});
  }

  function cone(r, h, color, opts) {
    return mesh(new THREE.ConeGeometry(r, h, 20), mat(color, cleanMat(opts)), opts || {});
  }

  function tubeBetween(a, b, r, color, opts) {
    a = v3(a); b = v3(b);
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const m = mesh(new THREE.CylinderGeometry(r, r, len, 8, 1), mat(color, cleanMat(opts)), {});
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return m;
  }

  function line(points, color, opacity, dashed) {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const material = dashed
      ? new THREE.LineDashedMaterial({ color: color, transparent: true, opacity: opacity == null ? 0.6 : opacity, dashSize: 0.28, gapSize: 0.2 })
      : new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: opacity == null ? 0.8 : opacity });
    const l = new THREE.Line(geo, material);
    if (dashed) l.computeLineDistances();
    return l;
  }

  function canvasTexture(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    draw(ctx, w, h);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function pentagon(ctx, cx, cy, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = (rot || 0) + i * Math.PI * 2 / 5 - Math.PI / 2;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  function ballTexture(type) {
    return canvasTexture(1024, 512, (ctx, w, h) => {
      if (type === 'tennis') {
        ctx.fillStyle = '#d8ef55'; ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = 'rgba(255,255,255,.94)'; ctx.lineWidth = 12;
        for (let k = 0; k < 2; k++) {
          ctx.beginPath();
          ctx.arc(w * 0.5, h * 0.5, w * 0.48, k ? -0.55 : Math.PI - 0.55, k ? 0.55 : Math.PI + 0.55);
          ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(115,140,20,.18)'; ctx.lineWidth = 3;
        for (let i = 0; i < 8; i++) {
          ctx.beginPath(); ctx.moveTo(i * w / 8, 0); ctx.lineTo(i * w / 8 + 60, h); ctx.stroke();
        }
        return;
      }
      if (type === 'basketball') {
        ctx.fillStyle = '#d9772e'; ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#2a160d'; ctx.lineWidth = 10;
        ctx.beginPath(); ctx.moveTo(0, h * 0.5); ctx.lineTo(w, h * 0.5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(w * 0.5, 0); ctx.lineTo(w * 0.5, h); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.5, w * 0.18, h * 0.54, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.5, w * 0.42, h * 0.22, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(40,20,10,.16)';
        for (let i = 0; i < 40; i++) {
          const x = (i * 97) % w, y = (i * 53) % h;
          ctx.beginPath(); ctx.arc(x, y, 2.4, 0, Math.PI * 2); ctx.fill();
        }
        return;
      }
      if (type === 'old') {
        ctx.fillStyle = '#7b4a2c'; ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = 'rgba(50,25,12,.55)'; ctx.lineWidth = 7;
        for (let i = 0; i < 8; i++) {
          ctx.beginPath(); ctx.moveTo(i * w / 8, 0); ctx.quadraticCurveTo(i * w / 8 + 30, h * 0.5, i * w / 8, h); ctx.stroke();
        }
        ctx.strokeStyle = '#e7d3b0'; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.moveTo(w * 0.5, h * 0.15); ctx.lineTo(w * 0.5, h * 0.85); ctx.stroke();
        for (let i = 0; i < 8; i++) {
          const y = h * 0.2 + i * h * 0.08;
          ctx.beginPath(); ctx.moveTo(w * 0.47, y); ctx.lineTo(w * 0.53, y); ctx.stroke();
        }
        ctx.fillStyle = 'rgba(255,235,200,.08)';
        ctx.beginPath(); ctx.arc(w * 0.35, h * 0.36, 100, 0, Math.PI * 2); ctx.fill();
        return;
      }
      // football
      ctx.fillStyle = '#f8f5e9'; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#202b26';
      const pts = [
        [0.08, 0.28, 54, 0.2], [0.27, 0.12, 44, 0.8], [0.5, 0.3, 58, 0.1],
        [0.73, 0.12, 44, 0.6], [0.92, 0.28, 54, 0.4], [0.18, 0.66, 48, 0.6],
        [0.42, 0.82, 50, 0.2], [0.66, 0.82, 50, 0.8], [0.84, 0.62, 46, 0.3],
        [0.5, 0.55, 40, 0.5], [0.04, 0.9, 38, 0.1], [0.96, 0.9, 38, 0.1]
      ];
      pts.forEach((p) => {
        ctx.save(); ctx.translate(p[0] * w, p[1] * h); pentagon(ctx, 0, 0, p[2], p[3]); ctx.restore();
      });
      ctx.strokeStyle = 'rgba(40,50,45,.18)'; ctx.lineWidth = 3;
      for (let i = 0; i < 18; i++) {
        ctx.beginPath();
        ctx.moveTo((i * 79) % w, 0);
        ctx.quadraticCurveTo((i * 131) % w, h * 0.5, (i * 79 + 30) % w, h);
        ctx.stroke();
      }
    });
  }

  function makeBall(type, radius) {
    radius = radius || 0.45;
    const geo = new THREE.SphereGeometry(radius, 32, 24);
    const material = new THREE.MeshStandardMaterial({
      map: ballTexture(type || 'football'),
      roughness: 0.52,
      metalness: 0.02
    });
    const b = new THREE.Mesh(geo, material);
    b.castShadow = true; b.receiveShadow = true;
    b.userData.type = type || 'football';
    return b;
  }

  function pitchTexture(kind) {
    return canvasTexture(1024, 1024, (ctx, w, h) => {
      if (kind === 'track') {
        ctx.fillStyle = '#bc553d'; ctx.fillRect(0, 0, w, h);
        // Мелкая крошка покрытия вместо шахматных плиток.
        for (let i = 0; i < 5200; i++) {
          const x = Math.random() * w, y = Math.random() * h;
          const a = 0.025 + Math.random() * 0.05;
          ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,238,214,' + a + ')' : 'rgba(76,26,16,' + a + ')';
          ctx.fillRect(x, y, 2 + Math.random() * 3, 1 + Math.random() * 2);
        }
        // Дорожки идут вдоль бегового коридора (ось X сцены).
        ctx.strokeStyle = 'rgba(255,246,228,.62)'; ctx.lineWidth = 3;
        for (let i = 1; i < 16; i++) {
          ctx.beginPath(); ctx.moveTo(0, i * h / 16); ctx.lineTo(w, i * h / 16); ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(255,246,228,.2)'; ctx.lineWidth = 1;
        for (let i = 0; i < 16; i++) {
          ctx.beginPath(); ctx.moveTo(0, (i + 0.5) * h / 16); ctx.lineTo(w, (i + 0.5) * h / 16); ctx.stroke();
        }
        return;
      }
      if (kind === 'museum') {
        ctx.fillStyle = '#efe5d0'; ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = 'rgba(20,35,30,.08)'; ctx.lineWidth = 2;
        for (let i = 0; i < 20; i++) { ctx.beginPath(); ctx.moveTo(0, i * h / 20); ctx.lineTo(w, i * h / 20); ctx.stroke(); }
        ctx.fillStyle = 'rgba(242,107,42,.08)';
        ctx.beginPath(); ctx.arc(w * 0.5, h * 0.5, w * 0.38, 0, Math.PI * 2); ctx.fill();
        return;
      }
      if (kind === 'cycle') {
        ctx.fillStyle = '#4a7663'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(255,248,234,.12)';
        for (let i = 0; i < 12; i++) ctx.fillRect(i * w / 12, 0, w / 24, h);
        ctx.strokeStyle = 'rgba(255,248,234,.35)'; ctx.lineWidth = 4;
        for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(w * 0.5, h * 0.5, w * (0.2 + i * 0.13), 0, Math.PI * 2); ctx.stroke(); }
        return;
      }
      // football pitch
      ctx.fillStyle = '#3b8a56'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 12; i++) {
        if (i % 2 === 0) { ctx.fillStyle = 'rgba(255,255,255,.055)'; ctx.fillRect(0, i * h / 12, w, h / 12); }
      }
      ctx.strokeStyle = 'rgba(255,255,255,.82)'; ctx.lineWidth = 7;
      ctx.strokeRect(w * 0.06, h * 0.08, w * 0.88, h * 0.84);
      ctx.beginPath(); ctx.moveTo(w * 0.06, h * 0.5); ctx.lineTo(w * 0.94, h * 0.5); ctx.stroke();
      ctx.beginPath(); ctx.arc(w * 0.5, h * 0.5, w * 0.13, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.82)';
      ctx.beginPath(); ctx.arc(w * 0.5, h * 0.5, 7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeRect(w * 0.26, h * 0.08, w * 0.48, h * 0.18);
      ctx.strokeRect(w * 0.38, h * 0.08, w * 0.24, h * 0.08);
      ctx.strokeRect(w * 0.26, h * 0.74, w * 0.48, h * 0.18);
      ctx.strokeRect(w * 0.38, h * 0.84, w * 0.24, h * 0.08);
      ctx.beginPath(); ctx.arc(w * 0.5, h * 0.2, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(w * 0.5, h * 0.8, 6, 0, Math.PI * 2); ctx.fill();
    });
  }

  function textTexture(text, opts) {
    opts = opts || {};
    const w = opts.w || 512, h = opts.h || 128;
    return canvasTexture(w, h, (ctx) => {
      ctx.clearRect(0, 0, w, h);
      if (opts.bg !== false) {
        ctx.fillStyle = opts.bg || '#14563a';
        roundRect(ctx, 4, 4, w - 8, h - 8, opts.radius || 26);
        ctx.fill();
      }
      ctx.fillStyle = opts.fg || '#fff8ea';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = (opts.weight || 800) + ' ' + (opts.size || 44) + 'px ' + (opts.font || 'Manrope, DejaVu Sans, sans-serif');
      const lines = String(text).split('\n');
      const lh = (opts.size || 44) * 1.12;
      lines.forEach((ln, i) => ctx.fillText(ln, w / 2, h / 2 + (i - (lines.length - 1) / 2) * lh));
    });
  }

  function makePlatform(opts) {
    opts = opts || {};
    const radius = opts.radius || 7;
    const height = opts.height || 0.6;
    const group = new THREE.Group();
    const sideMat = mat(opts.rimColor || C.woodLight, { roughness: 0.82 });
    const topMat = opts.topTexture
      ? new THREE.MeshStandardMaterial({ map: opts.topTexture, roughness: 0.88, metalness: 0.0 })
      : mat(opts.topColor || C.green, { roughness: 0.88 });
    const bottomMat = mat(C.paper2, { roughness: 0.9 });
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.015, height, 72, 1), [sideMat, topMat, bottomMat]);
    cyl.position.y = -height / 2;
    cyl.castShadow = true; cyl.receiveShadow = true;
    group.add(cyl);
    const rim = mesh(new THREE.TorusGeometry(radius, 0.065, 8, 72), mat(C.cream, { roughness: 0.55 }));
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.012;
    rim.receiveShadow = true;
    group.add(rim);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(radius * 4.5, radius * 4.5), new THREE.ShadowMaterial({ opacity: 0.15 }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -height - 0.012;
    shadow.receiveShadow = true;
    group.add(shadow);
    if (opts.label) {
      const plaque = new THREE.Mesh(
        new THREE.PlaneGeometry(Math.min(radius * 0.72, 4.8), 0.46),
        new THREE.MeshBasicMaterial({ map: textTexture(opts.label, { w: 640, h: 96, size: 34 }), transparent: true })
      );
      plaque.position.set(0, 0.08, radius * 0.83);
      plaque.rotation.x = -0.18;
      group.add(plaque);
    }
    return group;
  }

  function netPlane(w, h, cols, rows) {
    const pos = [];
    for (let i = 0; i <= cols; i++) {
      const x = -w / 2 + (w * i) / cols;
      pos.push(x, -h / 2, 0, x, h / 2, 0);
    }
    for (let j = 0; j <= rows; j++) {
      const y = -h / 2 + (h * j) / rows;
      pos.push(-w / 2, y, 0, w / 2, y, 0);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: C.white, transparent: true, opacity: 0.3 }));
  }

  function makeGoal(opts) {
    opts = opts || {};
    const w = opts.width || 7.32;
    const h = opts.height || 2.44;
    const d = opts.depth || 1.8;
    const r = opts.post || 0.075;
    const group = new THREE.Group();
    const white = mat(C.paper, { roughness: 0.48, metalness: 0.05 });
    const pL = mesh(new THREE.CylinderGeometry(r, r, h, 12), white, { pos: [-w / 2, h / 2, 0] });
    const pR = mesh(new THREE.CylinderGeometry(r, r, h, 12), white, { pos: [w / 2, h / 2, 0] });
    const bar = mesh(new THREE.CylinderGeometry(r, r, w + r * 2, 12), white, { pos: [0, h, 0], rot: [0, 0, Math.PI / 2] });
    group.add(pL, pR, bar);
    // back frame
    const bL = mesh(new THREE.CylinderGeometry(r * 0.65, r * 0.65, h, 10), white, { pos: [-w / 2, h / 2, -d] });
    const bR = mesh(new THREE.CylinderGeometry(r * 0.65, r * 0.65, h, 10), white, { pos: [w / 2, h / 2, -d] });
    const bT = mesh(new THREE.CylinderGeometry(r * 0.65, r * 0.65, w, 10), white, { pos: [0, h, -d], rot: [0, 0, Math.PI / 2] });
    group.add(bL, bR, bT);
    const back = netPlane(w, h, 22, 15); back.position.set(0, h / 2, -d); group.add(back);
    const left = netPlane(d, h, 10, 15); left.rotation.y = -Math.PI / 2; left.position.set(-w / 2, h / 2, -d / 2); group.add(left);
    const right = netPlane(d, h, 10, 15); right.rotation.y = Math.PI / 2; right.position.set(w / 2, h / 2, -d / 2); group.add(right);
    const top = netPlane(w, d, 22, 10); top.rotation.x = Math.PI / 2; top.position.set(0, h, -d / 2); group.add(top);
    group.userData.net = { back, left, right, top };
    group.userData.size = { w, h, d };
    return group;
  }

  function makeStands(width, rows) {
    width = width || 12; rows = rows || 3;
    const group = new THREE.Group();
    for (let row = 0; row < rows; row++) {
      const y = 0.22 + row * 0.42;
      const z = -0.6 - row * 0.62;
      const tier = rounded(width, 0.36, 0.72, 0.08, row % 2 ? C.greenDeep : C.green, { pos: [0, y, z] });
      group.add(tier);
      const count = 18;
      for (let i = 0; i < count; i++) {
        const x = -width / 2 + 0.34 + i * (width - 0.68) / (count - 1);
        const seat = box(0.26, 0.16, 0.26, (i + row) % 4 === 0 ? C.orange : (i % 3 === 0 ? C.cream : C.paper2), { pos: [x, y + 0.25, z + 0.1], castShadow: false });
        group.add(seat);
      }
    }
    const wall = rounded(width + 0.4, 1.5, 0.2, 0.06, C.paper2, { pos: [0, 0.9, -rows * 0.62 - 0.55], castShadow: false });
    group.add(wall);
    return group;
  }

  function makeFloodlight() {
    const group = new THREE.Group();
    const pole = cylinder(0.06, 0.09, 4.4, C.grey, { pos: [0, 2.2, 0], seg: 10 });
    const head = rounded(0.9, 0.34, 0.22, 0.05, C.dark, { pos: [0, 4.45, 0] });
    group.add(pole, head);
    for (let i = 0; i < 4; i++) {
      const panel = box(0.34, 0.2, 0.03, 0xfff3c4, { pos: [-0.3 + (i % 2) * 0.6, 4.38 + Math.floor(i / 2) * 0.14, 0.12], castShadow: false });
      panel.material = new THREE.MeshStandardMaterial({ color: 0xfff3c4, emissive: 0xffe7a0, emissiveIntensity: 1.4, roughness: 0.4 });
      group.add(panel);
    }
    return group;
  }

  function makeMannequin(opts) {
    opts = opts || {};
    const jersey = opts.jersey == null ? C.orange : opts.jersey;
    const shorts = opts.shorts == null ? C.ink : opts.shorts;
    const skin = opts.skin == null ? C.skin : opts.skin;
    const shoe = opts.shoe == null ? C.paper : opts.shoe;
    const scale = opts.scale || 1;
    const root = new THREE.Group();
    root.scale.setScalar(scale);
    const hips = new THREE.Group();
    hips.position.y = 0.92;
    root.add(hips);

    const torso = mesh(new THREE.RoundedBoxGeometry(0.36, 0.62, 0.22, 0.08), mat(jersey), { pos: [0, 0.35, 0] });
    hips.add(torso);
    const shortsMesh = mesh(new THREE.RoundedBoxGeometry(0.38, 0.24, 0.26, 0.06), mat(shorts), { pos: [0, 0.06, 0] });
    hips.add(shortsMesh);
    const neck = cylinder(0.07, 0.08, 0.1, skin, { pos: [0, 0.7, 0], seg: 10 });
    hips.add(neck);
    const head = new THREE.Group();
    head.position.y = 0.84;
    hips.add(head);
    const skull = sphere(0.165, skin, { pos: [0, 0, 0] });
    head.add(skull);
    const hair = lowSphere(0.17, opts.hair == null ? C.ink : opts.hair, { pos: [0, 0.045, -0.02], scale: [1.02, 0.72, 1.02] });
    head.add(hair);
    if (opts.cap) {
      const cap = cylinder(0.17, 0.17, 0.06, opts.cap, { pos: [0, 0.12, 0], seg: 16 });
      head.add(cap);
    }
    // face hints
    const eyeMat = basic(0x1a1712);
    for (const x of [-0.06, 0.06]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), eyeMat);
      eye.position.set(x, 0.02, 0.15);
      head.add(eye);
    }

    function makeArm(side) {
      const shoulder = new THREE.Group();
      shoulder.position.set(side * 0.23, 0.58, 0);
      hips.add(shoulder);
      const upper = capsule(0.072, 0.26, jersey, { pos: [0, -0.16, 0] });
      shoulder.add(upper);
      const elbow = new THREE.Group();
      elbow.position.y = -0.32;
      shoulder.add(elbow);
      const fore = capsule(0.06, 0.24, skin, { pos: [0, -0.14, 0] });
      elbow.add(fore);
      const hand = sphere(0.078, opts.glove ? opts.gloveColor || C.orange : skin, { pos: [0, -0.3, 0] });
      elbow.add(hand);
      if (opts.glove) {
        hand.scale.set(1.25, 1.05, 1.4);
      }
      return { shoulder, elbow, hand };
    }
    function makeLeg(side) {
      const hip = new THREE.Group();
      hip.position.set(side * 0.11, 0.02, 0);
      hips.add(hip);
      const thigh = capsule(0.088, 0.3, shorts, { pos: [0, -0.19, 0] });
      hip.add(thigh);
      const knee = new THREE.Group();
      knee.position.y = -0.4;
      hip.add(knee);
      const shin = capsule(0.07, 0.3, skin, { pos: [0, -0.18, 0] });
      knee.add(shin);
      const foot = mesh(new THREE.RoundedBoxGeometry(0.14, 0.1, 0.3, 0.04), mat(shoe), { pos: [0, -0.4, 0.07] });
      knee.add(foot);
      return { hip, knee, foot };
    }

    const armL = makeArm(-1), armR = makeArm(1);
    const legL = makeLeg(-1), legR = makeLeg(1);
    const joints = { hips, torso, head, armL, armR, legL, legR };

    function setPose(p) {
      p = p || {};
      if (p.hips) hips.rotation.set(p.hips[0] || 0, p.hips[1] || 0, p.hips[2] || 0);
      if (p.armL) armL.shoulder.rotation.set(p.armL[0] || 0, p.armL[1] || 0, p.armL[2] || 0);
      if (p.armR) armR.shoulder.rotation.set(p.armR[0] || 0, p.armR[1] || 0, p.armR[2] || 0);
      if (p.elbowL != null) armL.elbow.rotation.x = p.elbowL;
      if (p.elbowR != null) armR.elbow.rotation.x = p.elbowR;
      if (p.legL) legL.hip.rotation.set(p.legL[0] || 0, p.legL[1] || 0, p.legL[2] || 0);
      if (p.legR) legR.hip.rotation.set(p.legR[0] || 0, p.legR[1] || 0, p.legR[2] || 0);
      if (p.kneeL != null) legL.knee.rotation.x = p.kneeL;
      if (p.kneeR != null) legR.knee.rotation.x = p.kneeR;
      if (p.head) head.rotation.set(p.head[0] || 0, p.head[1] || 0, p.head[2] || 0);
    }
    setPose(opts.pose || {});
    return { group: root, joints, setPose, height: 1.82 * scale };
  }

  function makeKeeper(opts) {
    opts = opts || {};
    const m = makeMannequin({
      jersey: opts.jersey == null ? C.yellow : opts.jersey,
      shorts: C.ink,
      skin: C.skin,
      shoe: C.paper,
      glove: true,
      gloveColor: opts.gloveColor == null ? C.orange : opts.gloveColor,
      scale: opts.scale || 0.78,
      pose: { armL: [0, 0, -1.2], armR: [0, 0, 1.2], elbowL: -0.2, elbowR: -0.2 }
    });
    const root = new THREE.Group();
    root.add(m.group);
    let diving = 0;
    return {
      group: root,
      model: m,
      dive(dir, progress) {
        diving = progress;
        const e = 1 - Math.pow(1 - Math.min(1, Math.max(0, progress)), 3);
        root.position.x = dir * 1.45 * e;
        root.position.y = Math.sin(Math.min(1, progress) * Math.PI) * 0.35;
        root.rotation.z = -dir * 1.15 * e;
        m.setPose({
          armL: [0, 0, -1.2 - 1.1 * e],
          armR: [0, 0, 1.2 + 1.1 * e],
          elbowL: -0.1,
          elbowR: -0.1,
          legL: [0.2 * e, 0, -0.4 * e],
          legR: [-0.15 * e, 0, 0.35 * e]
        });
      },
      reset() {
        root.position.set(0, 0, 0); root.rotation.z = 0;
        m.setPose({ armL: [0, 0, -1.2], armR: [0, 0, 1.2], elbowL: -0.2, elbowR: -0.2 });
        diving = 0;
      }
    };
  }

  function makeWall(count, scale) {
    count = count || 3; scale = scale || 0.68;
    const group = new THREE.Group();
    const models = [];
    for (let i = 0; i < count; i++) {
      const m = makeMannequin({
        jersey: i % 2 ? C.orange : C.orangeLight,
        shorts: C.ink,
        scale: scale,
        pose: { armL: [0, 0, -1.05], armR: [0, 0, 1.05], elbowL: -1.1, elbowR: -1.1, legL: [0, 0, -0.06], legR: [0, 0, 0.06] }
      });
      m.group.position.x = (i - (count - 1) / 2) * 0.58;
      m.group.rotation.y = 0;
      group.add(m.group);
      models.push(m);
    }
    return { group, models };
  }

  function makeStartingBlocks() {
    const group = new THREE.Group();
    const metal = mat(C.grey, { metalness: 0.45, roughness: 0.4 });
    const railL = box(1.5, 0.08, 0.1, C.grey, { pos: [-0.18, 0.08, -0.06] });
    const railR = box(1.5, 0.08, 0.1, C.grey, { pos: [0.18, 0.08, -0.06] });
    group.add(railL, railR);
    for (let i = 0; i < 2; i++) {
      const pad = rounded(0.34, 0.08, 0.24, 0.03, C.orange, { pos: [i ? 0.21 : -0.21, 0.25, i ? 0.18 : 0.03], rot: [-0.55, 0, 0] });
      const leg = box(0.06, 0.28, 0.06, C.grey, { pos: [i ? 0.21 : -0.21, 0.14, i ? 0.18 : 0.03] });
      group.add(pad, leg);
    }
    return group;
  }

  function makeStartLight() {
    const group = new THREE.Group();
    const pole = cylinder(0.035, 0.05, 2.2, C.dark, { pos: [0, 1.1, 0], seg: 8 });
    const boxBody = rounded(0.42, 0.9, 0.22, 0.06, C.dark, { pos: [0, 2.35, 0] });
    group.add(pole, boxBody);
    const lamps = [];
    const colors = [0xff3b20, 0xffc400, 0x35d46a];
    for (let i = 0; i < 3; i++) {
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.1, 14, 10), new THREE.MeshStandardMaterial({ color: colors[i], emissive: colors[i], emissiveIntensity: 0.06, roughness: 0.32 }));
      lamp.position.set(0, 2.65 - i * 0.25, 0.13);
      group.add(lamp);
      lamps.push(lamp);
    }
    return {
      group,
      set(state) {
        lamps.forEach((l, i) => {
          const active = state === 'red' ? i === 0 : state === 'yellow' ? i === 1 : state === 'green' ? i === 2 : false;
          l.material.emissiveIntensity = active ? 2.2 : 0.045;
          l.material.color.setHex(active ? colors[i] : 0x3a4540);
        });
      }
    };
  }

  function makeBike() {
    const group = new THREE.Group();
    const frameMat = mat(C.ink, { metalness: 0.55, roughness: 0.32 });
    const tyre = mat(0x2a2d2a, { roughness: 0.85 });
    const rimMat = mat(C.grey, { metalness: 0.7, roughness: 0.25 });
    const points = {
      rear: V(-0.78, 0.38, 0), bb: V(-0.02, 0.4, 0), seat: V(-0.22, 1.0, 0),
      head: V(0.48, 0.96, 0), front: V(0.78, 0.38, 0)
    };
    const wheels = [];
    for (const key of ['rear', 'front']) {
      const p = points[key];
      const wheel = new THREE.Group();
      const tire = mesh(new THREE.TorusGeometry(0.33, 0.035, 8, 28), tyre, { pos: [0, 0, 0] });
      const rim = mesh(new THREE.TorusGeometry(0.27, 0.012, 6, 28), rimMat, { pos: [0, 0, 0] });
      wheel.add(tire, rim);
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4;
        const spoke = tubeBetween(V(0, 0, 0), V(Math.cos(a) * 0.27, Math.sin(a) * 0.27, 0), 0.006, C.grey, { metalness: 0.7, roughness: 0.3 });
        wheel.add(spoke);
      }
      wheel.position.copy(p);
      group.add(wheel);
      wheels.push(wheel);
    }
    const tubes = [
      [points.rear, points.bb, 0.045], [points.bb, points.seat, 0.05],
      [points.seat, points.head, 0.045], [points.head, points.bb, 0.05],
      [points.head, points.front, 0.04], [points.seat, points.rear, 0.035],
      [points.rear, points.bb, 0.03]
    ];
    tubes.forEach((t) => group.add(tubeBetween(t[0], t[1], t[2], C.ink, { metalness: 0.55, roughness: 0.32 })));
    const seat = rounded(0.28, 0.06, 0.16, 0.03, C.dark, { pos: [points.seat.x, points.seat.y + 0.04, 0] });
    group.add(seat);
    const bar = tubeBetween(V(0.48, 0.98, -0.22), V(0.48, 0.98, 0.22), 0.025, C.ink, { metalness: 0.5 });
    group.add(bar);
    const stem = tubeBetween(points.head, V(0.48, 1.0, 0), 0.022, C.ink);
    group.add(stem);
    const chain = mesh(new THREE.TorusGeometry(0.09, 0.012, 6, 20), rimMat, { pos: [points.bb.x, points.bb.y, 0.06] });
    group.add(chain);
    const crank = new THREE.Group();
    crank.position.copy(points.bb);
    const crankArm = box(0.04, 0.18, 0.04, C.grey, { pos: [0, 0.09, 0.07] });
    const pedal = box(0.8, 0.035, 0.12, C.dark, { pos: [0, 0.18, 0.1] });
    crank.add(crankArm, pedal);
    group.add(crank);

    const rider = makeMannequin({
      jersey: C.orange, shorts: C.ink, skin: C.skin, shoe: C.paper, scale: 0.72,
      pose: {
        armL: [-1.1, 0, -0.15], armR: [-1.1, 0, 0.15],
        elbowL: -0.3, elbowR: -0.3,
        legL: [-0.9, 0, -0.08], legR: [-0.2, 0, 0.08],
        kneeL: 1.5, kneeR: 1.1
      }
    });
    // Сажаем райдера на седло: корень манекена — ступни, бёдра на высоте 0.92 * 0.72.
    rider.group.position.set(-0.04, 0.34, 0);
    rider.group.rotation.y = Math.PI / 2;
    rider.group.rotation.z = 0;
    group.add(rider.group);

    return {
      group, wheels, rider, crank,
      setAero(v) {
        const t = Math.min(1, Math.max(0, v / 100));
        rider.joints.hips.rotation.x = 0.28 + t * 0.62;
        rider.joints.head.rotation.x = -0.2 - t * 0.35;
        rider.setPose({
          armL: [-0.92 - t * 0.12, 0, -0.15], armR: [-0.92 - t * 0.12, 0, 0.15],
          elbowL: -0.22, elbowR: -0.22,
          legL: [-0.9 - t * 0.18, 0, -0.08], legR: [-0.2 - t * 0.1, 0, 0.08],
          kneeL: 1.5, kneeR: 1.1
        });
      },
      update(dt) {
        const speed = 1.2;
        wheels.forEach((w) => { w.rotation.z -= dt * speed * 4; });
        crank.rotation.z += dt * speed * 2;
      }
    };
  }

  function makePool() {
    const group = new THREE.Group();
    const deck = rounded(8.4, 0.26, 5.2, 0.12, C.paper2, { pos: [0, -0.05, 0] });
    const basin = rounded(7.6, 0.5, 4.4, 0.1, C.blueDeep, { pos: [0, 0.18, 0] });
    group.add(deck, basin);
    const waterTex = canvasTexture(512, 512, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#7fd3e6'); g.addColorStop(1, '#2694b8');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 3;
      for (let i = 0; i < 18; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * h / 18);
        for (let x = 0; x <= w; x += 24) ctx.lineTo(x, i * h / 18 + Math.sin(x * 0.05 + i) * 5);
        ctx.stroke();
      }
    });
    waterTex.wrapS = waterTex.wrapT = THREE.RepeatWrapping;
    waterTex.repeat.set(2, 1);
    const water = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 4.2), new THREE.MeshPhysicalMaterial({
      map: waterTex, color: 0xa9e5ef, transparent: true, opacity: 0.72,
      roughness: 0.18, metalness: 0.05, clearcoat: 0.5, clearcoatRoughness: 0.2
    }));
    water.rotation.x = -Math.PI / 2;
    water.position.y = 0.5;
    group.add(water);
    const ropes = [];
    for (let z = -1.5; z <= 1.5; z += 1) {
      const rope = new THREE.Group();
      for (let i = 0; i < 9; i++) {
        const seg = cylinder(0.03, 0.03, 0.78, i % 2 ? C.red : C.paper, { pos: [i * 0.82 - 3.28, 0, 0], rot: [0, 0, Math.PI / 2], seg: 8 });
        rope.add(seg);
      }
      rope.position.set(0, 0.55, z);
      group.add(rope);
      ropes.push(rope);
    }
    const block = rounded(0.5, 0.35, 0.55, 0.06, C.orange, { pos: [-3.45, 0.55, 0] });
    group.add(block);
    const swimmer = makeMannequin({
      jersey: C.blue, shorts: C.blueDeep, skin: C.skin, shoe: C.blue, scale: 0.78,
      cap: C.orange,
      pose: {
        armL: [-2.7, 0, -0.2], armR: [0.2, 0, 0.2],
        elbowL: -0.15, elbowR: -0.15,
        legL: [0.15, 0, -0.05], legR: [-0.15, 0, 0.05],
        kneeL: 0.2, kneeR: 0.2
      }
    });
    swimmer.group.rotation.z = -Math.PI / 2;
    swimmer.group.position.set(0, 0.62, 0);
    group.add(swimmer.group);
    return {
      group, water, swimmer, ropes,
      setAero(v) {
        const t = Math.min(1, Math.max(0, v / 100));
        swimmer.setPose({
          armL: [-2.7 - t * 0.15, 0, -0.2 + t * 0.1], armR: [0.2 - t * 0.15, 0, 0.2 - t * 0.1],
          elbowL: -0.15, elbowR: -0.15,
          legL: [0.15 - t * 0.2, 0, -0.05], legR: [-0.15 + t * 0.2, 0, 0.05],
          kneeL: 0.2, kneeR: 0.2
        });
        swimmer.group.rotation.z = -Math.PI / 2 + (1 - t) * 0.08;
      },
      update(dt, t) {
        water.material.map.offset.x += dt * 0.035;
        swimmer.group.position.y = 0.62 + Math.sin(t * 4) * 0.025;
        swimmer.joints.armL.shoulder.rotation.x = -2.7 + Math.sin(t * 5) * 0.45 * (1 - 0);
        swimmer.joints.armR.shoulder.rotation.x = 0.2 + Math.cos(t * 5) * 0.45;
      }
    };
  }

  function makeStopwatch() {
    const group = new THREE.Group();
    const body = cylinder(0.32, 0.32, 0.12, C.gold, { pos: [0, 0.5, 0], rot: [Math.PI / 2, 0, 0], seg: 28, metalness: 0.55, roughness: 0.32 });
    group.add(body);
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.27, 28), new THREE.MeshBasicMaterial({ map: canvasTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#fff8ea'; ctx.beginPath(); ctx.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#14231e'; ctx.lineWidth = 3;
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6; const r1 = w * 0.38, r2 = w * 0.44;
        ctx.beginPath(); ctx.moveTo(w / 2 + Math.cos(a) * r1, h / 2 + Math.sin(a) * r1); ctx.lineTo(w / 2 + Math.cos(a) * r2, h / 2 + Math.sin(a) * r2); ctx.stroke();
      }
      ctx.fillStyle = '#f26b2a'; ctx.font = '800 42px Manrope, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('0.00', w / 2, h / 2 + 14);
    }) }));
    face.position.set(0, 0.5, 0.065);
    group.add(face);
    const btn = cylinder(0.05, 0.05, 0.12, C.ink, { pos: [0, 0.82, 0], seg: 10 });
    group.add(btn);
    const ring = mesh(new THREE.TorusGeometry(0.23, 0.025, 6, 24), mat(C.ink, { metalness: 0.4 }), { pos: [0, 0.5, 0.07] });
    group.add(ring);
    return group;
  }

  function makeCamera() {
    const group = new THREE.Group();
    const body = rounded(0.66, 0.36, 0.3, 0.06, C.dark, { pos: [0, 0.55, 0] });
    const lens = cylinder(0.14, 0.16, 0.22, C.ink, { pos: [0, 0.55, 0.25], rot: [Math.PI / 2, 0, 0], seg: 20 });
    const glass = cylinder(0.11, 0.11, 0.02, C.blue, { pos: [0, 0.55, 0.37], rot: [Math.PI / 2, 0, 0], seg: 20 });
    glass.material = new THREE.MeshStandardMaterial({ color: C.blue, emissive: C.blue, emissiveIntensity: 0.35, roughness: 0.2 });
    group.add(body, lens, glass);
    const leg = cylinder(0.03, 0.04, 0.5, C.grey, { pos: [0, 0.25, 0], seg: 8 });
    group.add(leg);
    return group;
  }

  function makeShoe() {
    const group = new THREE.Group();
    const sole = rounded(0.66, 0.09, 0.24, 0.04, C.orange, { pos: [0, 0.07, 0] });
    const upper = rounded(0.56, 0.2, 0.22, 0.08, C.paper, { pos: [0.02, 0.19, 0] });
    const heel = rounded(0.2, 0.18, 0.22, 0.06, C.orange, { pos: [-0.23, 0.18, 0] });
    group.add(sole, upper, heel);
    for (let i = 0; i < 4; i++) {
      const lace = box(0.02, 0.015, 0.16, C.ink, { pos: [-0.08 + i * 0.07, 0.3, 0] });
      group.add(lace);
    }
    return group;
  }

  function makePoleSection() {
    const group = new THREE.Group();
    const curve = new THREE.CatmullRomCurve3([V(-0.7, 0, 0), V(-0.2, 0.8, 0.1), V(0.4, 1.1, 0.2), V(0.8, 1.7, 0.2)]);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 30, 0.06, 8, false), mat(C.orange, { roughness: 0.35, metalness: 0.1 }));
    tube.castShadow = true;
    group.add(tube);
    return group;
  }

  function makeTrophy() {
    const group = new THREE.Group();
    const goldMat = new THREE.MeshStandardMaterial({ color: C.gold, metalness: 0.72, roughness: 0.24, side: THREE.DoubleSide });
    const goldLightMat = new THREE.MeshStandardMaterial({ color: C.goldLight, metalness: 0.55, roughness: 0.3 });

    const base = cylinder(0.62, 0.72, 0.12, C.ink, { pos: [0, 0.06, 0], seg: 32 });
    const foot = cylinder(0.46, 0.54, 0.09, C.gold, { pos: [0, 0.165, 0], seg: 32 });
    const stem = cylinder(0.1, 0.14, 0.4, C.gold, { pos: [0, 0.41, 0], seg: 20 });
    const knob = sphere(0.15, C.gold, { pos: [0, 0.62, 0], scale: [1, 0.82, 1] });
    group.add(base, foot, stem, knob);

    // Чаша с полой внутренней стенкой — читается как кубок, а не как табурет.
    const profile = [
      [0.2, 0.66], [0.28, 0.7], [0.4, 0.82], [0.52, 1.02], [0.59, 1.26],
      [0.61, 1.44], [0.57, 1.49], [0.53, 1.46], [0.5, 1.24], [0.43, 1.02],
      [0.31, 0.82], [0.18, 0.72], [0.1, 0.68]
    ].map((p) => new THREE.Vector2(p[0], p[1]));
    const cup = new THREE.Mesh(new THREE.LatheGeometry(profile, 48), goldMat);
    cup.castShadow = true; cup.receiveShadow = true;
    group.add(cup);

    for (const side of [-1, 1]) {
      const handle = mesh(new THREE.TorusGeometry(0.2, 0.042, 8, 24), goldMat, {
        pos: [side * 0.58, 1.1, 0], scale: [1, 1.28, 1]
      });
      handle.castShadow = true;
      group.add(handle);
    }

    const medallion = mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.035, 24), goldLightMat, {
      pos: [0, 1.13, 0.54], rot: [Math.PI / 2, 0, 0]
    });
    group.add(medallion);
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.075, 0), goldLightMat);
    star.position.set(0, 1.13, 0.575);
    star.scale.z = 0.4;
    group.add(star);

    const segments = [];
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI * 0.9 + i * Math.PI * 0.36;
      const seg = box(0.15, 0.055, 0.1, C.ink, { pos: [Math.cos(a) * 0.5, 0.14, Math.sin(a) * 0.5], castShadow: false });
      seg.rotation.y = -a;
      group.add(seg);
      segments.push(seg);
    }
    return {
      group, cup, segments,
      setProgress(n) {
        segments.forEach((s, i) => {
          s.material = new THREE.MeshStandardMaterial({
            color: i < n ? C.orange : C.ink,
            emissive: i < n ? C.orange : 0x000000,
            emissiveIntensity: i < n ? 0.8 : 0,
            roughness: 0.4
          });
        });
      },
      reset() { this.setProgress(0); }
    };
  }

  function makeConfetti(count) {
    count = count || 140;
    const geo = new THREE.PlaneGeometry(0.09, 0.15);
    const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, transparent: true, opacity: 0.96 });
    const inst = new THREE.InstancedMesh(geo, material, count);
    inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    inst.visible = false;
    const parts = [];
    const dummy = new THREE.Object3D();
    const colors = [C.orange, C.yellow, C.blue, C.greenLight, C.paper, C.red];
    for (let i = 0; i < count; i++) {
      parts.push({ p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), rv: new THREE.Vector3(), life: 0 });
      inst.setColorAt(i, new THREE.Color(colors[i % colors.length]));
    }
    inst.instanceColor.needsUpdate = true;
    let active = false;
    function burst(origin, spread) {
      origin = origin || new THREE.Vector3(0, 3, 0);
      spread = spread || 1;
      active = true; inst.visible = true; material.opacity = 0.96;
      parts.forEach((q, i) => {
        q.p.set(origin.x + (Math.random() - 0.5) * 1.2 * spread, origin.y + Math.random() * 0.5, origin.z + (Math.random() - 0.5) * 1.2 * spread);
        q.v.set((Math.random() - 0.5) * 5 * spread, 4 + Math.random() * 4.5, (Math.random() - 0.5) * 5 * spread);
        q.r.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
        q.rv.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
        q.life = 2.8 + Math.random() * 1.6;
      });
    }
    function update(dt) {
      if (!active) return;
      let alive = false;
      parts.forEach((q, i) => {
        if (q.life <= 0) { dummy.scale.setScalar(0); dummy.updateMatrix(); inst.setMatrixAt(i, dummy.matrix); return; }
        alive = true;
        q.life -= dt;
        q.v.y -= 9.2 * dt;
        q.v.multiplyScalar(0.995);
        q.p.addScaledVector(q.v, dt);
        if (q.p.y < 0.05) { q.p.y = 0.05; q.v.y *= -0.35; q.v.x *= 0.7; q.v.z *= 0.7; }
        q.r.x += q.rv.x * dt; q.r.y += q.rv.y * dt; q.r.z += q.rv.z * dt;
        dummy.position.copy(q.p); dummy.rotation.copy(q.r); dummy.scale.setScalar(Math.min(1, q.life * 1.5)); dummy.updateMatrix();
        inst.setMatrixAt(i, dummy.matrix);
      });
      inst.instanceMatrix.needsUpdate = true;
      if (!alive) { active = false; inst.visible = false; }
    }
    function reset() { active = false; inst.visible = false; }
    return { mesh: inst, burst, update, reset };
  }

  function makeFlowParticles(color, count) {
    count = count || 55;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const data = [];
    for (let i = 0; i < count; i++) {
      const p = { x: (Math.random() - 0.5) * 7, y: 0.3 + Math.random() * 1.8, z: (Math.random() - 0.5) * 2.4, s: 0.3 + Math.random() * 0.8 };
      data.push(p);
      pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const material = new THREE.PointsMaterial({ color: color, size: 0.06, transparent: true, opacity: 0.55, depthWrite: false, sizeAttenuation: true });
    const points = new THREE.Points(geo, material);
    return {
      points,
      update(dt, speed) {
        const arr = geo.attributes.position.array;
        for (let i = 0; i < count; i++) {
          data[i].x += dt * (1.4 + speed * 0.06) * data[i].s;
          if (data[i].x > 3.6) { data[i].x = -3.6; data[i].y = 0.3 + Math.random() * 1.8; data[i].z = (Math.random() - 0.5) * 2.4; }
          arr[i * 3] = data[i].x; arr[i * 3 + 1] = data[i].y; arr[i * 3 + 2] = data[i].z;
        }
        geo.attributes.position.needsUpdate = true;
      },
      setIntensity(v) { material.opacity = 0.18 + v * 0.006; }
    };
  }

  function makeArrow(color, len) {
    color = color || C.orange; len = len || 1.2;
    const group = new THREE.Group();
    const shaft = cylinder(0.045, 0.045, len, color, { pos: [0, len / 2, 0], seg: 10 });
    const head = cone(0.14, 0.3, color, { pos: [0, len + 0.1, 0] });
    group.add(shaft, head);
    return group;
  }

  function makeSpiral(radius, height, color) {
    const pts = [];
    const turns = 3.2;
    for (let i = 0; i <= 90; i++) {
      const t = i / 90;
      const a = t * Math.PI * 2 * turns;
      pts.push(V(Math.cos(a) * radius, -height / 2 + t * height, Math.sin(a) * radius));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 120, 0.025, 6, false), new THREE.MeshStandardMaterial({ color: color, emissive: color, emissiveIntensity: 0.18, roughness: 0.4 }));
    return tube;
  }

  function makeTarget() {
    const group = new THREE.Group();
    const stand = cylinder(0.04, 0.06, 1.1, C.ink, { pos: [0, 0.55, 0], seg: 8 });
    group.add(stand);
    const ringColors = [C.paper, C.orange, C.paper, C.orange];
    for (let i = 0; i < 4; i++) {
      const ring = mesh(new THREE.TorusGeometry(0.55 - i * 0.12, 0.035, 8, 36), mat(i % 2 ? C.orange : C.paper, { roughness: 0.45 }), { pos: [0, 1.45, 0] });
      group.add(ring);
    }
    const crossH = box(0.7, 0.015, 0.015, C.ink, { pos: [0, 1.45, 0.02], castShadow: false });
    const crossV = box(0.015, 0.7, 0.015, C.ink, { pos: [0, 1.45, 0.02], castShadow: false });
    group.add(crossH, crossV);
    return group;
  }

  SP.models = {
    C, V, mat, basic, mesh, box, rounded, sphere, lowSphere, cylinder, capsule, torus, cone,
    tubeBetween, line, canvasTexture, textTexture, roundRect, ballTexture, makeBall,
    pitchTexture, makePlatform, netPlane, makeGoal, makeStands, makeFloodlight,
    makeMannequin, makeKeeper, makeWall, makeStartingBlocks, makeStartLight,
    makeBike, makePool, makeStopwatch, makeCamera, makeShoe, makePoleSection,
    makeTrophy, makeConfetti, makeFlowParticles, makeArrow, makeSpiral, makeTarget
  };
})();
