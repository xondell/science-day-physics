/* Девять 3D-сцен. Каждая — самостоятельная сцена Three.js с API для панели. */
(function () {
  'use strict';
  window.SP = window.SP || {};
  const M = window.SP.models;
  const C = M.C;
  const V = M.V;
  const scenes = {};

  const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  function addLights(scene, opts) {
    opts = opts || {};
    const hemi = new THREE.HemisphereLight(0xfff5e2, 0x355445, 1.2);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffefd2, 2.35);
    key.position.set(-7, 12, 9);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -14;
    key.shadow.camera.right = 14;
    key.shadow.camera.top = 14;
    key.shadow.camera.bottom = -14;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 45;
    key.shadow.bias = -0.0007;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xcfeeff, 0.55);
    fill.position.set(9, 6, 5);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffd2a0, 0.4);
    rim.position.set(0, 7, -12);
    scene.add(rim);
    return { hemi, key, fill, rim };
  }

  function base(ctx, opts) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(opts.fov || 38, window.innerWidth / window.innerHeight, 0.1, 160);
    camera.position.fromArray(opts.cam);
    const controls = new THREE.OrbitControls(camera, ctx.canvas);
    controls.target.fromArray(opts.target);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = opts.min || 7;
    controls.maxDistance = opts.max || 32;
    controls.minPolarAngle = opts.minPolar || 0.22;
    controls.maxPolarAngle = opts.maxPolar || 1.42;
    controls.autoRotate = !ctx.reducedMotion;
    controls.autoRotateSpeed = opts.autoSpeed == null ? 0.35 : opts.autoSpeed;
    controls.enabled = false;
    addLights(scene, opts);
    return { scene, camera, controls };
  }

  function makeTween(camera, controls) {
    let tw = null;
    return {
      to(pos, target, dur) {
        tw = {
          fp: camera.position.clone(), tp: pos.clone(),
          ft: controls.target.clone(), tt: target.clone(),
          t: 0, dur: dur || 0.7
        };
      },
      update(dt) {
        if (!tw) return;
        tw.t += dt;
        const k = ease(clamp(tw.t / tw.dur, 0, 1));
        camera.position.lerpVectors(tw.fp, tw.tp, k);
        controls.target.lerpVectors(tw.ft, tw.tt, k);
        if (tw.t >= tw.dur) tw = null;
      },
      cancel() { tw = null; }
    };
  }

  function label(text, x, y, z, accent) {
    return { text: text, position: V(x, y, z), accent: !!accent, hidden: false };
  }

  /* =========================================================
     1. Титул
     ========================================================= */
  scenes.title = function (ctx) {
    const b = base(ctx, { cam: [11.2, 7.7, 16.0], target: [0, 2.0, -0.9], min: 10, max: 28, autoSpeed: 0.22 });
    const { scene, camera, controls } = b;
    const stage = new THREE.Group();
    scene.add(stage);
    stage.add(M.makePlatform({ radius: 7.6, topTexture: M.pitchTexture('football'), label: 'SCIENCE DAY · ФУТБОЛ' }));

    const goal = M.makeGoal({ width: 7.32, height: 2.44, depth: 1.5, post: 0.065 });
    goal.position.set(0, 0, -3.15);
    stage.add(goal);
    const back = goal.userData.net.back, leftNet = goal.userData.net.left, rightNet = goal.userData.net.right, topNet = goal.userData.net.top;
    const netBase = {
      back: back.position.clone(), left: leftNet.position.clone(), right: rightNet.position.clone(), top: topNet.position.clone()
    };

    const stands = M.makeStands(10.5, 2);
    stands.position.set(0, 0, -5.5);
    stage.add(stands);

    [[-5.7, -4.7], [5.7, -4.7], [-6.2, 1.8], [6.2, 1.8]].forEach((p) => {
      const f = M.makeFloodlight();
      f.position.set(p[0], 0, p[1]);
      f.scale.setScalar(0.82);
      stage.add(f);
    });

    const start = V(0, 0.26, 2.7);
    const ball = M.makeBall('football', 0.25);
    ball.position.copy(start);
    stage.add(ball);

    const target = V(2.55, 2.02, -3.05);
    const control = V(1.7, 3.7, -0.1);
    let kicking = false, kickT = 0, netImpulse = 0;

    const confetti = M.makeConfetti(120);
    scene.add(confetti.mesh);

    const api = {
      kick() {
        if (kicking) return;
        if (ball.position.distanceTo(start) > 1.1) api.reset();
        kicking = true;
        kickT = 0;
        ctx.emit('title-status', { text: 'Мяч летит в верхний угол…', kind: 'good' });
      },
      reset() {
        kicking = false;
        kickT = 0;
        netImpulse = 0;
        ball.position.copy(start);
        ball.rotation.set(0, 0, 0);
        back.position.copy(netBase.back);
        leftNet.position.copy(netBase.left);
        rightNet.position.copy(netBase.right);
        topNet.position.copy(netBase.top);
        confetti.reset();
        ctx.emit('title-status', { text: 'Покрутите макет мышью. Нажмите «Ударить».', kind: 'neutral' });
      }
    };
    ball.userData.pick = api.kick;

    const labels = [
      label('мяч · нажмите', start.x, start.y + 0.9, start.z, true),
      label('ворота 7,32 × 2,44 м', 0, 2.8, -3.15, false)
    ];

    function update(dt, t) {
      if (kicking) {
        kickT = Math.min(1, kickT + dt / 1.15);
        const k = kickT;
        const p = new THREE.Vector3()
          .copy(start).multiplyScalar((1 - k) * (1 - k))
          .addScaledVector(control, 2 * (1 - k) * k)
          .addScaledVector(target, k * k);
        ball.position.copy(p);
        ball.rotation.y += dt * 8;
        ball.rotation.x += dt * 3;
        if (kickT >= 1) {
          kicking = false;
          netImpulse = 1;
          confetti.burst(target, 0.62);
          ctx.emit('title-status', { text: 'Гол! Мячом управляли сила, вращение и точность.', kind: 'good' });
        }
      } else if (ball.position.distanceTo(start) < 0.1) {
        ball.rotation.y += dt * 0.6;
      }
      if (netImpulse > 0) {
        netImpulse = Math.max(0, netImpulse - dt * 0.9);
        const k = Math.sin(t * 24) * netImpulse;
        back.position.z = netBase.back.z - netImpulse * 0.34 + k * 0.04;
        leftNet.position.x = netBase.left.x - netImpulse * 0.06;
        rightNet.position.x = netBase.right.x + netImpulse * 0.06;
        topNet.position.z = netBase.top.z - netImpulse * 0.08;
      }
      labels[0].position.copy(ball.position).add(V(0, 0.75, 0));
      labels[0].hidden = kicking;
      confetti.update(dt);
    }

    return {
      scene, camera, controls, labels, api, update, autoRotateSpeed: 0.22
    };
  };

  /* =========================================================
     2. Три секрета
     ========================================================= */
  scenes.secrets = function (ctx) {
    const b = base(ctx, { cam: [0, 5.6, 13.2], target: [0, 1.85, 0], min: 8, max: 22, autoSpeed: 0.24 });
    const { scene, camera, controls } = b;
    const tween = makeTween(camera, controls);
    controls.addEventListener('start', () => tween.cancel());

    const stage = new THREE.Group();
    scene.add(stage);
    stage.add(M.makePlatform({ radius: 8, topTexture: M.pitchTexture('museum'), label: 'ТРИ СЕКРЕТА' }));

    const xs = [-2.9, 0, 2.9];
    const groups = [];
    const rings = [];
    const labels = [];
    const baseY = 1.2;

    function pedestal(x) {
      const p = M.cylinder(0.82, 0.92, 0.78, C.paper2, { pos: [x, 0.39, 0], seg: 32 });
      const top = M.cylinder(0.86, 0.86, 0.07, C.cream, { pos: [x, 0.8, 0], seg: 32 });
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.72, 0.028, 8, 40),
        new THREE.MeshStandardMaterial({ color: C.orange, emissive: C.orange, emissiveIntensity: 0.8, roughness: 0.4 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, 0.85, 0);
      ring.visible = false;
      stage.add(p, top, ring);
      rings.push(ring);
    }
    xs.forEach(pedestal);

    // 1. Сила
    const forceGroup = new THREE.Group();
    forceGroup.position.set(xs[0], baseY, 0);
    const forceBall = M.makeBall('football', 0.46);
    forceGroup.add(forceBall);
    const arrow = M.makeArrow(C.orange, 1.15);
    arrow.position.set(0.12, 0.2, 0);
    arrow.rotation.z = -0.22;
    forceGroup.add(arrow);
    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.66 + i * 0.15, 0.018, 6, 36), new THREE.MeshBasicMaterial({ color: C.orange, transparent: true, opacity: 0.24 - i * 0.05 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -0.45 + i * 0.04;
      forceGroup.add(ring);
    }
    stage.add(forceGroup);
    groups.push(forceGroup);

    // 2. Вращение
    const spinGroup = new THREE.Group();
    spinGroup.position.set(xs[1], baseY, 0);
    const spinBall = M.makeBall('football', 0.46);
    spinGroup.add(spinBall);
    const spiral = M.makeSpiral(0.64, 1.35, C.orange);
    spinGroup.add(spiral);
    const spinArrow = M.makeArrow(C.orange, 0.8);
    spinArrow.position.set(0.9, -0.4, 0.2);
    spinArrow.rotation.z = -1.2;
    spinGroup.add(spinArrow);
    stage.add(spinGroup);
    groups.push(spinGroup);

    // 3. Точность
    const precisionGroup = new THREE.Group();
    precisionGroup.position.set(xs[2], 0.25, 0);
    const targetObj = M.makeTarget();
    targetObj.scale.setScalar(0.9);
    precisionGroup.add(targetObj);
    const precisionBall = M.makeBall('football', 0.2);
    precisionBall.position.set(0.36, 1.15, 0.16);
    precisionGroup.add(precisionBall);
    stage.add(precisionGroup);
    groups.push(precisionGroup);

    const baseScale = [1, 1, 1];
    let selected = -1;
    let memory = false;

    const labelsData = [
      label('СИЛА', xs[0], 2.55, 0, false),
      label('ВРАЩЕНИЕ', xs[1], 2.55, 0, false),
      label('ТОЧНОСТЬ', xs[2], 2.55, 0, false)
    ];

    function applySelection() {
      groups.forEach((g, i) => {
        rings[i].visible = selected === i;
        labelsData[i].accent = selected === i;
        labelsData[i].hidden = memory;
      });
    }

    const api = {
      select(i) {
        selected = i;
        applySelection();
        if (i >= 0) {
          tween.to(V(xs[i] * 0.35 + 4.6, 5.3, 12.2), V(xs[i] * 0.55, 1.9, 0), 0.65);
        } else {
          tween.to(V(0, 5.6, 13.2), V(0, 1.85, 0), 0.65);
        }
      },
      memory(on) {
        memory = !!on;
        applySelection();
      },
      reset() {
        selected = -1;
        memory = false;
        applySelection();
        tween.to(V(0, 5.6, 13.2), V(0, 1.85, 0), 0.65);
      }
    };

    [forceBall, spinBall, precisionBall].forEach((m, i) => {
      m.userData.pick = () => ctx.emit('secret-select', { index: i });
    });
    targetObj.children.forEach((o) => { o.userData.pick = () => ctx.emit('secret-select', { index: 2 }); });

    function update(dt, t) {
      tween.update(dt);
      forceGroup.position.y = baseY + Math.sin(t * 1.5) * 0.06;
      spinGroup.position.y = baseY + Math.sin(t * 1.5 + 1) * 0.06;
      precisionGroup.position.y = 0.25 + Math.sin(t * 1.5 + 2) * 0.035;
      spinBall.rotation.y += dt * (selected === 1 ? 3.8 : 0.7);
      forceBall.rotation.y += dt * 0.35;
      forceGroup.scale.lerp(V(selected === 0 ? 1.16 : 1, selected === 0 ? 1.16 : 1, selected === 0 ? 1.16 : 1), 0.12);
      spinGroup.scale.lerp(V(selected === 1 ? 1.16 : 1, selected === 1 ? 1.16 : 1, selected === 1 ? 1.16 : 1), 0.12);
      precisionGroup.scale.lerp(V(selected === 2 ? 1.16 : 1, selected === 2 ? 1.16 : 1, selected === 2 ? 1.16 : 1), 0.12);
      spiral.rotation.y -= dt * 0.9;
    }

    applySelection();
    return { scene, camera, controls, labels: labelsData, api, update, autoRotateSpeed: 0.24 };
  };

  /* =========================================================
     3. Футбол
     ========================================================= */
  scenes.football = function (ctx) {
    const b = base(ctx, { cam: [8.2, 6.1, 16.0], target: [-0.9, 1.0, -2.0], min: 11, max: 30, autoSpeed: 0.12 });
    const { scene, camera, controls } = b;
    const stage = new THREE.Group();
    scene.add(stage);
    stage.add(M.makePlatform({ radius: 14.2, topTexture: M.pitchTexture('football'), label: 'СВОБОДНЫЙ УДАР · 35 М' }));

    const goal = M.makeGoal({ width: 4.25, height: 1.42, depth: 1.05, post: 0.05 });
    goal.position.set(0, 0, -8.5);
    stage.add(goal);
    const net = goal.userData.net;
    const netBase = { back: net.back.position.clone(), left: net.left.position.clone(), right: net.right.position.clone(), top: net.top.position.clone() };

    const stands = M.makeStands(9.5, 2);
    stands.position.set(0, 0, -11.4);
    stage.add(stands);

    const wall = M.makeWall(3, 0.7);
    wall.group.position.set(0, 0, 2.6);
    stage.add(wall.group);

    const keeper = M.makeKeeper({ scale: 0.72 });
    keeper.group.position.set(0, 0, -8.25);
    stage.add(keeper.group);

    const ballStart = V(0, 0.24, 6.5);
    const ball = M.makeBall('football', 0.24);
    ball.position.copy(ballStart);
    stage.add(ball);

    const confetti = M.makeConfetti(130);
    scene.add(confetti.mesh);

    const MAP_X = 0.58, MAP_Y = 0.58;
    const GOAL_Z = -8.5, START_Z = 6.5;
    const targetReal = { left: V(-3.15, 2.02, 0), right: V(3.15, 2.02, 0), center: V(0, 1.15, 0) };
    let targetKey = 'right';
    let target = targetReal[targetKey];
    let force = 105;
    let spin = 70;
    let slow = false;
    let flying = false;
    let flightT = 0;
    let path = [];
    let flightDur = 1;
    let result = null;
    let netImpulse = 0;
    let keeperDir = 1;

    const aimRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.19, 0.026, 8, 28),
      new THREE.MeshBasicMaterial({ color: C.orange })
    );
    aimRing.position.set(target.x * MAP_X, 0.24 + target.y * MAP_Y, GOAL_Z + 0.06);
    stage.add(aimRing);

    let aimLine = M.line([ballStart.clone(), aimRing.position.clone()], C.paper, 0.48, true);
    stage.add(aimLine);

    const trailGeo = new THREE.BufferGeometry();
    const trailPos = new Float32Array(320 * 3);
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
    trailGeo.setDrawRange(0, 0);
    const trail = new THREE.Line(trailGeo, new THREE.LineBasicMaterial({ color: C.orange, transparent: true, opacity: 0.92 }));
    scene.add(trail);

    const labels = [
      label('стенка', 0, 2.15, 2.6, false),
      label('вратарь', 0.7, 1.95, -8.2, false),
      label('ворота', -0.8, 2.45, -8.5, false)
    ];

    function world(p) {
      const z = START_Z - (35 - p.z) * ((START_Z - GOAL_Z) / 35);
      return V(p.x * MAP_X, 0.24 + p.y * MAP_Y, z);
    }

    function simulate(forceVal, spinVal, tgt, useSpin) {
      const v0 = forceVal / 3.6;
      const g = 9.81, kd = 0.0092, km = 20;
      const T0 = 35 / Math.max(8, v0 * 0.92);
      let vx = tgt.x / T0;
      let vy = (tgt.y - 0.11 + 0.5 * g * T0 * T0) / T0;
      let vz = -35 / T0;
      let out = [];
      for (let iter = 0; iter < 6; iter++) {
        out = [];
        let x = 0, y = 0.11, z = 35, t = 0;
        let px = vx, py = vy, pz = vz;
        const dt = 1 / 160;
        for (let step = 0; step < 1400 && z > 0; step++) {
          const sp = Math.hypot(px, py, pz);
          const ax = -kd * sp * px + (useSpin ? (spinVal / 100) * km * (-pz / 35) : 0);
          const ay = -kd * sp * py - g;
          const az = -kd * sp * pz;
          px += ax * dt; py += ay * dt; pz += az * dt;
          x += px * dt; y += py * dt; z += pz * dt; t += dt;
          out.push({ x, y, z, t, vx: px, vy: py, vz: pz });
        }
        const end = out[out.length - 1];
        const tt = Math.max(0.02, end.t);
        const ex = tgt.x - end.x, ey = tgt.y - end.y;
        if (Math.abs(ex) < 0.02 && Math.abs(ey) < 0.02) break;
        vx += ex / tt * 0.86;
        vy += ey / tt * 0.86;
      }
      return out;
    }

    function updateAim() {
      aimRing.position.set(target.x * MAP_X, 0.24 + target.y * MAP_Y, GOAL_Z + 0.06);
      const pts = [ballStart.clone(), new THREE.Vector3(target.x * MAP_X, 0.24 + target.y * MAP_Y, GOAL_Z + 0.06)];
      aimLine.geometry.dispose();
      aimLine.geometry = new THREE.BufferGeometry().setFromPoints(pts);
      aimLine.computeLineDistances();
    }

    function reset() {
      flying = false;
      flightT = 0;
      path = [];
      result = null;
      netImpulse = 0;
      ball.position.copy(ballStart);
      ball.rotation.set(0, 0, 0);
      keeper.reset();
      trailGeo.setDrawRange(0, 0);
      aimLine.visible = true;
      aimRing.visible = true;
      confetti.reset();
      net.back.position.copy(netBase.back);
      net.left.position.copy(netBase.left);
      net.right.position.copy(netBase.right);
      net.top.position.copy(netBase.top);
      updateAim();
      ctx.emit('fb-status', { text: 'готов', curve: '—', kind: 'neutral' });
    }

    function finishResult() {
      const end = path[path.length - 1];
      const wallPoint = path.find((p) => p.z <= 25.85);
      const hitWall = !!(wallPoint && Math.abs(wallPoint.x) < 0.95 && wallPoint.y < 1.35);
      const onTarget = Math.abs(end.x) < 3.55 && end.y < 2.35 && end.y > 0.02;
      const endWorldX = end.x * MAP_X;
      const endWorldY = 0.24 + end.y * MAP_Y;
      // Вратарь читает направление удара, но сильная закрутка уводит мяч в сторону.
      const keeperHand = keeperDir * 1.45;
      const saved = onTarget && !hitWall && (endWorldY < 1.18 || force < 82) && Math.abs(endWorldX - keeperHand) < 0.55;
      const curveMax = path.reduce((m, p) => {
        const lineX = target.x * (1 - p.z / 35);
        return Math.max(m, Math.abs(p.x - lineX));
      }, 0);
      const curveText = (curveMax < 0.05 ? '0' : curveMax.toFixed(1).replace('.', ',')) + ' м';
      if (hitWall) {
        result = 'wall';
        ctx.emit('fb-status', { text: 'в стенку', curve: curveText, kind: 'neutral' });
      } else if (saved) {
        result = 'save';
        ctx.emit('fb-status', { text: 'сейв!', curve: curveText, kind: 'bad' });
      } else if (onTarget) {
        result = 'goal';
        netImpulse = 1;
        confetti.burst(V(end.x * MAP_X, 0.24 + end.y * MAP_Y, GOAL_Z + 0.2), 0.6);
        ctx.emit('fb-status', { text: 'гол!', curve: curveText, kind: 'good' });
      } else {
        result = 'miss';
        ctx.emit('fb-status', { text: 'мимо', curve: curveText, kind: 'neutral' });
      }
    }

    function kick() {
      if (flying) return;
      if (ball.position.distanceTo(ballStart) > 0.8) reset();
      path = simulate(force, spin, target, true);
      if (!path.length) return;
      flightDur = path[path.length - 1].t;
      flightT = 0;
      flying = true;
      result = null;
      keeper.reset();
      const guessX = target.x * MAP_X - (spin / 100) * 1.15;
      keeperDir = guessX > 0.3 ? 1 : guessX < -0.3 ? -1 : 0;
      aimLine.visible = false;
      aimRing.visible = false;
      trailGeo.setDrawRange(0, 0);
      ctx.emit('fb-status', { text: 'мяч в игре…', curve: '—', kind: 'neutral' });
    }

    const api = {
      setForce(v) { force = clamp(Number(v) || 105, 60, 120); if (!flying) updateAim(); },
      setSpin(v) { spin = clamp(Number(v) || 0, -100, 100); if (!flying) updateAim(); },
      setTarget(k) { if (!targetReal[k]) return; targetKey = k; target = targetReal[k]; if (!flying) { updateAim(); reset(); } },
      kick,
      setSlow(v) { slow = !!v; },
      reset
    };
    ball.userData.pick = kick;

    function update(dt, t) {
      if (flying) {
        flightT += dt * (slow ? 0.34 : 1);
        let n = 0;
        for (let i = 0; i < path.length; i++) {
          if (path[i].t <= flightT) n = i + 1; else break;
        }
        if (n > 0) {
          const p = path[Math.min(n - 1, path.length - 1)];
          const wp = world(p);
          ball.position.copy(wp);
          ball.rotation.y += dt * (slow ? 3 : 9);
          ball.rotation.x += dt * (slow ? 1 : 4);
          const count = Math.min(n, 320);
          for (let i = 0; i < count; i++) {
            const q = world(path[Math.floor(i * (n - 1) / Math.max(1, count - 1))]);
            trailPos[i * 3] = q.x; trailPos[i * 3 + 1] = q.y; trailPos[i * 3 + 2] = q.z;
          }
          trailGeo.setDrawRange(0, count);
          trailGeo.attributes.position.needsUpdate = true;
          const kp = clamp((flightT / Math.max(0.01, flightDur) - 0.18) / 0.55, 0, 1);
          keeper.dive(keeperDir, kp);
        }
        if (flightT >= flightDur) {
          flying = false;
          finishResult();
        }
      } else if (result == null) {
        ball.rotation.y += dt * 0.35;
      }
      if (netImpulse > 0) {
        netImpulse = Math.max(0, netImpulse - dt * 0.85);
        const k = Math.sin(t * 26) * netImpulse;
        net.back.position.z = netBase.back.z - netImpulse * 0.24 + k * 0.03;
        net.left.position.x = netBase.left.x - netImpulse * 0.05;
        net.right.position.x = netBase.right.x + netImpulse * 0.05;
        net.top.position.z = netBase.top.z - netImpulse * 0.05;
      }
      confetti.update(dt);
    }

    updateAim();
    return { scene, camera, controls, labels, api, update, autoRotateSpeed: 0.12 };
  };

  /* =========================================================
     4. Спринт
     ========================================================= */
  scenes.sprint = function (ctx) {
    const b = base(ctx, { cam: [6.4, 4.8, 11.8], target: [0, 1.05, 0], min: 8, max: 24, autoSpeed: 0.12 });
    const { scene, camera, controls } = b;
    const stage = new THREE.Group();
    scene.add(stage);
    stage.add(M.makePlatform({ radius: 7.2, topTexture: M.pitchTexture('track') }));

    const startLine = M.box(0.08, 0.02, 4.2, C.paper, { pos: [-3.0, 0.02, 0], castShadow: false });
    const finishLine = M.box(0.12, 0.02, 4.2, C.paper, { pos: [3.6, 0.02, 0], castShadow: false });
    stage.add(startLine, finishLine);

    const blocks = M.makeStartingBlocks();
    blocks.position.set(-3.2, 0, 0);
    blocks.rotation.y = -Math.PI / 2;
    stage.add(blocks);

    const light = M.makeStartLight();
    light.group.position.set(-2.7, 0, 1.2);
    light.group.rotation.y = -0.4;
    stage.add(light.group);

    const athlete = M.makeMannequin({
      jersey: C.orange, shorts: C.ink, skin: C.skin, shoe: C.paper, scale: 0.95,
      pose: { armL: [-0.9, 0, -0.1], armR: [0.9, 0, 0.1], legL: [0.55, 0, -0.04], legR: [-0.55, 0, 0.04], kneeL: 0.65, kneeR: 0.7 }
    });
    athlete.group.rotation.y = -Math.PI / 2;
    athlete.group.position.set(-2.55, 0, 0);
    stage.add(athlete.group);

    let running = false, runT = 0, done = false;
    const labels = [
      label('колодки', -3.2, 1.0, -0.5, false),
      label('стартовый свет', -2.7, 2.9, 1.2, false),
      label('финиш', 3.6, 1.1, 0, false)
    ];

    function poseRun(u) {
      const s = Math.sin(u * Math.PI * 2 * 4.2);
      const c = Math.cos(u * Math.PI * 2 * 4.2);
      athlete.joints.hips.rotation.x = 0.2;
      athlete.setPose({
        armL: [-s * 0.9, 0, -0.12], armR: [s * 0.9, 0, 0.12],
        elbowL: -0.55, elbowR: -0.55,
        legL: [s * 0.95, 0, -0.04], legR: [-s * 0.95, 0, 0.04],
        kneeL: 0.55 + Math.max(0, c) * 0.8, kneeR: 0.55 + Math.max(0, -c) * 0.8
      });
    }

    const api = {
      setLight(state) { light.set(state); },
      run() {
        running = true; done = false; runT = 0;
        athlete.group.position.set(-2.55, 0, 0);
        athlete.group.rotation.y = -Math.PI / 2;
      },
      resetRunner() {
        running = false; done = false; runT = 0;
        athlete.group.position.set(-2.55, 0, 0);
        athlete.group.rotation.y = -Math.PI / 2;
        athlete.joints.hips.rotation.x = 0;
        athlete.setPose({ armL: [-0.9, 0, -0.1], armR: [0.9, 0, 0.1], legL: [0.55, 0, -0.04], legR: [-0.55, 0, 0.04], kneeL: 0.65, kneeR: 0.7 });
      },
      falseStart() { api.resetRunner(); },
      finish() {},
      reset() { api.resetRunner(); light.set('off'); }
    };

    function update(dt, t) {
      if (running) {
        runT += dt;
        const u = clamp(runT / 1.55, 0, 1);
        athlete.group.position.x = -2.55 + u * 6.15;
        athlete.group.position.y = Math.abs(Math.sin(u * Math.PI * 8.4)) * 0.05;
        poseRun(u);
        if (u >= 1) { running = false; done = true; }
      } else if (!done) {
        athlete.group.position.y = Math.sin(t * 1.5) * 0.015;
      }
      labels[0].position.set(-3.2, 1.0, -0.5);
    }

    return { scene, camera, controls, labels, api, update, autoRotateSpeed: 0.12 };
  };

  /* =========================================================
     5. Прыжок с шестом
     ========================================================= */
  scenes.pole = function (ctx) {
    const b = base(ctx, { cam: [12.5, 7.5, 17.6], target: [-1.5, 3.0, 0], min: 12, max: 36, autoSpeed: 0.1 });
    const { scene, camera, controls } = b;
    const stage = new THREE.Group();
    scene.add(stage);
    stage.add(M.makePlatform({ radius: 11.5, topColor: C.green }));

    const runway = M.rounded(11.6, 0.1, 1.45, 0.05, C.red, { pos: [-3.1, 0.06, 0] });
    stage.add(runway);
    const mat = M.rounded(4.3, 0.5, 3.3, 0.14, C.blue, { pos: [4.7, 0.25, 0] });
    stage.add(mat);

    const uprights = [];
    for (const z of [-1.35, 1.35]) {
      const up = M.box(0.13, 6.6, 0.13, C.paper, { pos: [1.65, 3.3, z] });
      stage.add(up);
      uprights.push(up);
    }
    const barGroup = new THREE.Group();
    const bar = M.cylinder(0.045, 0.045, 2.9, C.paper, { rot: [Math.PI / 2, 0, 0], seg: 10 });
    const capL = M.cylinder(0.06, 0.06, 0.18, C.orange, { pos: [0, 0, -1.35], rot: [Math.PI / 2, 0, 0], seg: 10 });
    const capR = M.cylinder(0.06, 0.06, 0.18, C.orange, { pos: [0, 0, 1.35], rot: [Math.PI / 2, 0, 0], seg: 10 });
    barGroup.add(bar, capL, capR);
    barGroup.position.set(1.65, 6.31, 0);
    stage.add(barGroup);

    const athlete = M.makeMannequin({
      jersey: C.orange, shorts: C.ink, skin: C.skin, shoe: C.paper, scale: 0.92,
      pose: { armL: [0, 0, -2.7], armR: [0, 0, 2.7], elbowL: -0.25, elbowR: -0.25 }
    });
    athlete.group.rotation.y = -Math.PI / 2;
    athlete.group.position.set(-8, 0, 0);
    stage.add(athlete.group);

    const poleGeo = new THREE.BufferGeometry();
    let poleMesh = null;
    let poleMat = new THREE.MeshStandardMaterial({ color: C.orange, roughness: 0.36, metalness: 0.08 });

    let speed = 9;
    let peak = 6.08;
    let jumping = false;
    let jumpT = 0;
    let success = false;
    let lastEnergy = 0;
    let knocked = false;

    function setPole(points) {
      const curve = new THREE.CatmullRomCurve3(points);
      const geo = new THREE.TubeGeometry(curve, 26, 0.045, 6, false);
      if (poleMesh) { poleMesh.geometry.dispose(); poleMesh.geometry = geo; }
      else {
        poleMesh = new THREE.Mesh(geo, poleMat);
        poleMesh.castShadow = true;
        scene.add(poleMesh);
      }
    }
    poleMesh = new THREE.Mesh(poleGeo, poleMat);
    poleMesh.visible = false;
    scene.add(poleMesh);

    function setBarHeight() {
      barGroup.position.y = 6.31;
      barGroup.rotation.x = 0;
    }

    function emitEnergy(k, e, p, status, kind) {
      ctx.emit('pole-energy', {
        kinetic: k, elastic: e, potential: p,
        height: '6,31',
        status: status,
        kind: kind
      });
    }

    const api = {
      setSpeed(v) {
        speed = clamp(Number(v) || 9, 6, 9.8);
        peak = 3.0 + ((speed - 6) / 3.8) * 3.31;
        if (!jumping) emitEnergy(0, 0, 0, 'готов', 'neutral');
      },
      jump() {
        if (jumping) return;
        jumping = true; jumpT = 0; success = false; knocked = false;
        setBarHeight();
        poleMesh.visible = true;
        ctx.emit('pole-energy', { kinetic: 100, elastic: 0, potential: 0, height: '6,31', status: 'разбег…', kind: 'neutral' });
      },
      reset() {
        jumping = false; jumpT = 0; knocked = false;
        athlete.group.position.set(-8, 0, 0);
        athlete.group.rotation.z = 0;
        athlete.joints.hips.rotation.x = 0;
        athlete.setPose({ armL: [0, 0, -2.7], armR: [0, 0, 2.7], elbowL: -0.25, elbowR: -0.25 });
        poleMesh.visible = false;
        setBarHeight();
        emitEnergy(0, 0, 0, 'готов', 'neutral');
      }
    };

    function update(dt, t) {
      if (jumping) {
        jumpT += dt / 3.0;
        const p = clamp(jumpT, 0, 1);
        let x = -8, y = 0, rot = 0;
        if (p < 0.32) {
          const u = p / 0.32;
          x = -8 + u * 7.6;
          y = Math.abs(Math.sin(u * Math.PI * 5)) * 0.04;
          athlete.joints.hips.rotation.x = 0.18;
          athlete.setPose({
            armL: [Math.sin(u * 28) * 0.6, 0, -0.12], armR: [-Math.sin(u * 28) * 0.6, 0, 0.12],
            elbowL: -0.5, elbowR: -0.5,
            legL: [Math.sin(u * 26) * 0.9, 0, -0.04], legR: [-Math.sin(u * 26) * 0.9, 0, 0.04],
            kneeL: 0.6, kneeR: 0.6
          });
        } else if (p < 0.62) {
          const u = (p - 0.32) / 0.30;
          x = -0.4 + u * 1.65;
          y = peak * Math.pow(u, 1.15) * 0.55;
          rot = -1.0 * u;
          athlete.setPose({
            armL: [0, 0, -2.9], armR: [0, 0, 2.9], elbowL: -0.1, elbowR: -0.1,
            legL: [0.7 * u, 0, -0.1], legR: [-0.2 * u, 0, 0.1], kneeL: 0.9, kneeR: 0.5
          });
        } else if (p < 0.82) {
          const u = (p - 0.62) / 0.20;
          x = 1.25 + u * 0.35;
          y = peak * 0.55 + u * (peak * 0.45 + 0.16);
          rot = -1.0 - 1.1 * u;
          athlete.setPose({
            armL: [0, 0, -2.9], armR: [0, 0, 2.9], elbowL: 0, elbowR: 0,
            legL: [1.1, 0, -0.1], legR: [0.7, 0, 0.1], kneeL: 0.9, kneeR: 0.7
          });
        } else {
          const u = (p - 0.82) / 0.18;
          x = 1.6 + u * 2.9;
          y = (peak + 0.16) * (1 - u) * (1 - u);
          rot = -2.1 * (1 - u);
          athlete.setPose({
            armL: [0.8 * u, 0, -1.4], armR: [-0.8 * u, 0, 1.4], elbowL: -0.2, elbowR: -0.2,
            legL: [1.2 * (1 - u), 0, -0.1], legR: [0.8 * (1 - u), 0, 0.1], kneeL: 1.0, kneeR: 0.7
          });
        }
        athlete.group.position.set(x, y, 0);
        athlete.group.rotation.z = rot;

        if (p > 0.34 && p < 0.9) {
          const hand = new THREE.Vector3(x, y + 1.35, 0);
          const base = new THREE.Vector3(0.15, 0, 0);
          const mid = base.clone().lerp(hand, 0.5);
          mid.x -= 0.65 + Math.sin(p * Math.PI) * 0.75;
          mid.y += 0.25;
          setPole([base, mid, hand]);
        } else {
          poleMesh.visible = false;
        }

        if (!success && p > 0.72 && peak < 6.25) {
          knocked = true;
          const u = clamp((p - 0.72) / 0.24, 0, 1);
          barGroup.rotation.x = 1.15 * u;
          barGroup.position.y = 6.31 - u * 1.1;
          barGroup.position.x = 1.65 + u * 0.3;
        }
        if (p >= 1) {
          jumping = false;
          success = peak >= 6.25;
          poleMesh.visible = false;
          athlete.group.position.set(4.7, 0.5, 0);
          athlete.group.rotation.z = 0;
          athlete.setPose({ armL: [0.4, 0, -0.7], armR: [-0.4, 0, 0.7], legL: [0.4, 0, -0.1], legR: [-0.3, 0, 0.1], kneeL: 0.9, kneeR: 0.7 });
          ctx.emit('pole-energy', {
            kinetic: 0, elastic: 0, potential: 100,
            height: '6,31',
            status: success ? 'чисто!' : 'планка упала',
            kind: success ? 'good' : 'bad'
          });
        } else if (t - lastEnergy > 0.08) {
          lastEnergy = t;
          const k = 100 * (1 - clamp(p / 0.4, 0, 1));
          const e = p < 0.32 ? 0 : p < 0.62 ? Math.sin(((p - 0.32) / 0.30) * Math.PI) * 100 : Math.max(0, 100 - (p - 0.62) * 300);
          const po = p < 0.42 ? 0 : clamp((p - 0.42) / 0.4, 0, 1) * 100;
          emitEnergy(k, Math.max(0, e), po, success ? 'чисто!' : 'прыжок…', 'neutral');
        }
      } else {
        athlete.group.position.y = Math.sin(t * 1.4) * 0.01;
      }
    }

    const labels = [
      label('планка 6,31 м', 1.65, 6.9, 0, true),
      label('шест', 0.2, 2.8, 0, false),
      label('мат', 4.7, 1.2, 0, false)
    ];

    return { scene, camera, controls, labels, api, update, autoRotateSpeed: 0.1 };
  };

  /* =========================================================
     6. Велосипед и плавание
     ========================================================= */
  scenes.cycle = function (ctx) {
    const b = base(ctx, { cam: [7.8, 5.6, 12.8], target: [0, 1.2, 0], min: 8, max: 24, autoSpeed: 0.16 });
    const { scene, camera, controls } = b;
    const tween = makeTween(camera, controls);
    controls.addEventListener('start', () => tween.cancel());
    const stage = new THREE.Group();
    scene.add(stage);
    stage.add(M.makePlatform({ radius: 10.2, topTexture: M.pitchTexture('cycle') }));

    const bike = M.makeBike();
    bike.group.scale.setScalar(1.32);
    bike.group.position.set(-0.1, 0.1, 0);
    stage.add(bike.group);

    const bikeFlow = M.makeFlowParticles(0xffffff, 70);
    bikeFlow.points.position.set(0, 0.7, 0);
    stage.add(bikeFlow.points);

    const pool = M.makePool();
    pool.group.scale.setScalar(1.04);
    pool.group.position.set(0, 0.02, 0);
    pool.group.visible = false;
    stage.add(pool.group);

    const swimFlow = M.makeFlowParticles(0xbdf1ff, 45);
    swimFlow.points.position.set(0, 0.55, 0);
    swimFlow.points.visible = false;
    stage.add(swimFlow.points);

    let mode = 'bike';
    let aero = 70;
    const labels = [
      label('сопротивление воздуха', 0, 2.9, 0, true),
      label('обтекаемая поза', 2.5, 1.35, 0, false)
    ];
    labels[1].hidden = true;

    const api = {
      setMode(next) {
        mode = next === 'swim' ? 'swim' : 'bike';
        bike.group.visible = mode === 'bike';
        bikeFlow.points.visible = mode === 'bike';
        pool.group.visible = mode === 'swim';
        swimFlow.points.visible = mode === 'swim';
        labels[0].text = mode === 'bike' ? 'сопротивление воздуха' : 'сопротивление воды';
        labels[0].position.set(0, mode === 'bike' ? 2.9 : 2.25, 0);
        labels[1].hidden = mode === 'bike';
        if (mode === 'bike') tween.to(V(7.8, 5.6, 12.8), V(0, 1.2, 0), 0.6);
        else tween.to(V(7.2, 5.2, 12.2), V(0, 0.8, 0), 0.6);
        ctx.emit('cycle-status', {
          text: mode === 'bike' ? 'Чем ниже поза — тем меньше воздуха сопротивляется.' : 'Чем сильнее вытянут пловец — тем меньше сопротивляется вода.',
          kind: 'neutral'
        });
      },
      setAero(v) {
        aero = clamp(Number(v) || 0, 0, 100);
        bike.setAero(aero);
        pool.setAero(aero);
        bikeFlow.setIntensity(aero);
        swimFlow.setIntensity(aero);
      },
      reset() {
        api.setMode('bike');
        api.setAero(70);
      }
    };

    function update(dt, t) {
      tween.update(dt);
      bike.update(dt, t);
      pool.update(dt, t);
      if (mode === 'bike') bikeFlow.update(dt, aero);
      else swimFlow.update(dt, aero);
    }

    return { scene, camera, controls, labels, api, update, autoRotateSpeed: 0.16 };
  };

  /* =========================================================
     7. Вращение везде
     ========================================================= */
  scenes.spin = function (ctx) {
    const b = base(ctx, { cam: [0, 5.4, 12.6], target: [0, 2.1, 0.8], min: 8, max: 22, autoSpeed: 0.2 });
    const { scene, camera, controls } = b;
    const tween = makeTween(camera, controls);
    controls.addEventListener('start', () => tween.cancel());
    const stage = new THREE.Group();
    scene.add(stage);
    stage.add(M.makePlatform({ radius: 8.5, topTexture: M.pitchTexture('museum'), label: 'ВРАЩЕНИЕ В СПОРТЕ' }));

    const types = ['football', 'tennis', 'basketball'];
    const names = ['ФУТБОЛ', 'ТЕННИС', 'БАСКЕТБОЛ'];
    const xs = [-2.9, 0, 2.9];
    const balls = [];
    const rings = [];
    const labels = [];

    xs.forEach((x, i) => {
      const ped = M.cylinder(0.75, 0.85, 0.65, C.paper2, { pos: [x, 0.325, 0], seg: 28 });
      const top = M.cylinder(0.79, 0.79, 0.06, C.cream, { pos: [x, 0.67, 0], seg: 28 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.026, 8, 36), new THREE.MeshStandardMaterial({ color: C.orange, emissive: C.orange, emissiveIntensity: 0.7, roughness: 0.4 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, 0.72, 0);
      ring.visible = i === 0;
      stage.add(ped, top, ring);
      rings.push(ring);
      const ball = M.makeBall(types[i], 0.48);
      ball.position.set(x, 1.25, 0);
      stage.add(ball);
      balls.push(ball);
      labels.push(label(names[i], x, 2.15, 0, i === 0));
      ball.userData.pick = () => api.select(types[i]);
    });

    const targetRing = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.035, 8, 40), new THREE.MeshStandardMaterial({ color: C.orange, emissive: C.orange, emissiveIntensity: 0.5 }));
    targetRing.position.set(0, 4.15, 2.7);
    stage.add(targetRing);
    const ghost = M.makeBall('football', 0.13);
    ghost.visible = false;
    stage.add(ghost);

    let selected = 'football';
    let spin = 60;
    let arcCurve = null;
    const arcPts = new Float32Array(120 * 3);
    const arcGeo = new THREE.BufferGeometry();
    arcGeo.setAttribute('position', new THREE.BufferAttribute(arcPts, 3));
    const arc = new THREE.Line(arcGeo, new THREE.LineBasicMaterial({ color: C.orange, transparent: true, opacity: 0.9 }));
    scene.add(arc);

    function currentIndex() { return types.indexOf(selected); }

    function rebuildArc() {
      const i = currentIndex();
      const origin = balls[i].position.clone().add(V(0, 0.1, 0));
      let end = V(0, 4.15, 2.7);
      const mid = origin.clone().lerp(end, 0.5);
      if (selected === 'football') { mid.x += (spin / 100) * 1.9; mid.y += 1.15; }
      else if (selected === 'tennis') { mid.y += 2.0; end.y = 2.45; mid.x += (spin / 100) * 0.35; }
      else { mid.y += 2.25; end.y = 2.9; mid.x += (spin / 100) * 0.25; }
      arcCurve = new THREE.QuadraticBezierCurve3(origin, mid, end);
      const n = 60;
      for (let k = 0; k < n; k++) {
        const p = arcCurve.getPoint(k / (n - 1));
        arcPts[k * 3] = p.x; arcPts[k * 3 + 1] = p.y; arcPts[k * 3 + 2] = p.z;
      }
      arcGeo.setDrawRange(0, n);
      arcGeo.attributes.position.needsUpdate = true;
    }

    function applySelection() {
      const i = currentIndex();
      rings.forEach((r, k) => { r.visible = k === i; labels[k].accent = k === i; });
      rebuildArc();
      ghost.material.map = null;
      ghost.material.color.set(selected === 'tennis' ? 0xd8ef55 : selected === 'basketball' ? 0xd9772e : 0xffffff);
      ghost.visible = true;
    }

    const api = {
      select(type) {
        if (types.indexOf(type) < 0) return;
        selected = type;
        applySelection();
      },
      setSpin(v) {
        spin = clamp(Number(v) || 0, -100, 100);
        rebuildArc();
      },
      reset() {
        selected = 'football';
        spin = 60;
        applySelection();
        tween.to(V(0, 5.4, 12.6), V(0, 2.1, 0.8), 0.6);
      }
    };

    let ghostT = 0;
    function update(dt, t) {
      tween.update(dt);
      const i = currentIndex();
      balls.forEach((ball, k) => {
        ball.position.y = 1.25 + Math.sin(t * 1.4 + k) * 0.04;
        ball.rotation.y += dt * (k === i ? 3.4 : 0.8) * (spin >= 0 ? 1 : -1);
        ball.rotation.x += dt * (k === i ? 0.9 : 0.2);
        ball.scale.lerp(V(k === i ? 1.16 : 0.94, k === i ? 1.16 : 0.94, k === i ? 1.16 : 0.94), 0.12);
      });
      if (arcCurve) {
        ghostT = (ghostT + dt * (0.18 + Math.abs(spin) / 100 * 0.16)) % 1;
        ghost.position.copy(arcCurve.getPoint(ghostT));
        ghost.rotation.y += dt * 3;
      }
      targetRing.rotation.z = Math.sin(t * 0.7) * 0.08;
    }

    applySelection();
    return { scene, camera, controls, labels, api, update, autoRotateSpeed: 0.2 };
  };

  /* =========================================================
     8. Музей рекордов
     ========================================================= */
  scenes.museum = function (ctx) {
    const b = base(ctx, { cam: [8.6, 6.2, 14.4], target: [0, 1.7, 0], min: 9, max: 30, autoSpeed: 0.14 });
    const { scene, camera, controls } = b;
    const tween = makeTween(camera, controls);
    controls.addEventListener('start', () => tween.cancel());
    const stage = new THREE.Group();
    scene.add(stage);
    stage.add(M.makePlatform({ radius: 10.8, topTexture: M.pitchTexture('museum'), label: 'МУЗЕЙ РЕКОРДОВ' }));

    const backWall = M.rounded(15, 0.22, 1.4, 0.06, C.paper2, { pos: [0, 0.11, -3.4] });
    stage.add(backWall);

    const xs = [-4.1, -2.05, 0, 2.05, 4.1];
    const objects = [];
    const rings = [];
    const labels = [];

    function ped(x) {
      const p = M.cylinder(0.62, 0.72, 0.52, C.paper2, { pos: [x, 0.26, 0], seg: 24 });
      const top = M.cylinder(0.66, 0.66, 0.055, C.cream, { pos: [x, 0.54, 0], seg: 24 });
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.022, 8, 32), new THREE.MeshStandardMaterial({ color: C.orange, emissive: C.orange, emissiveIntensity: 0.65 }));
      ring.rotation.x = Math.PI / 2;
      ring.position.set(x, 0.58, 0);
      ring.visible = false;
      stage.add(p, top, ring);
      rings.push(ring);
    }
    xs.forEach(ped);

    const ball = M.makeBall('old', 0.42);
    ball.position.set(xs[0], 0.97, 0);
    stage.add(ball);
    objects.push({ group: ball, baseY: 0.97, spin: 0.3 });

    const watch = M.makeStopwatch();
    watch.scale.setScalar(0.88);
    watch.position.set(xs[1], 0.56, 0);
    stage.add(watch);
    objects.push({ group: watch, baseY: 0.56, spin: 0.2 });

    const cam = M.makeCamera();
    cam.scale.setScalar(0.94);
    cam.position.set(xs[2], 0.56, 0);
    stage.add(cam);
    objects.push({ group: cam, baseY: 0.56, spin: 0.25 });

    const bike = M.makeBike();
    bike.group.scale.setScalar(0.44);
    bike.group.position.set(xs[3], 0.22, 0);
    stage.add(bike.group);
    objects.push({ group: bike.group, baseY: 0.22, spin: 0.12 });

    const pole = M.makePoleSection();
    pole.scale.setScalar(0.62);
    pole.position.set(xs[4], 0.54, 0);
    stage.add(pole);
    objects.push({ group: pole, baseY: 0.54, spin: 0.18 });

    const spot = new THREE.SpotLight(0xfff0c4, 55, 22, 0.55, 0.45, 1.4);
    spot.position.set(xs[0], 8.5, 4.2);
    spot.target.position.set(xs[0], 1, 0);
    scene.add(spot, spot.target);

    const years = ['1997', '2009', '2014', '2022', '2026'];
    years.forEach((year, i) => {
      labels.push(label(year, xs[i], 2.25, 0, i === 0));
    });

    let selected = 0;
    function select(i) {
      if (i < 0 || i >= objects.length) return;
      selected = i;
      rings.forEach((r, k) => { r.visible = k === i; labels[k].accent = k === i; });
      spot.position.set(xs[i], 8.5, 4.2);
      spot.target.position.set(xs[i], 1.1, 0);
      tween.to(V(xs[i] * 0.28 + 5.2, 5.2, 10.5), V(xs[i] * 0.5, 1.3, 0), 0.65);
    }

    const api = {
      select,
      reset() {
        select(0);
        tween.to(V(8.6, 6.2, 14.4), V(0, 1.7, 0), 0.65);
      }
    };
    objects.forEach((o, i) => {
      o.group.traverse((child) => { if (child.isMesh) child.userData.pick = () => ctx.emit('museum-select', { year: Number(years[i]) }); });
    });

    function update(dt, t) {
      tween.update(dt);
      objects.forEach((o, i) => {
        o.group.rotation.y += dt * (i === selected ? o.spin * 2.4 : o.spin);
        const bob = Math.sin(t * 1.3 + i) * (i === selected ? 0.035 : 0.018);
        o.group.position.y = o.baseY + bob;
      });
      bike.update(dt, t);
      spot.target.updateMatrixWorld();
    }

    return { scene, camera, controls, labels, api, update, autoRotateSpeed: 0.14 };
  };

  /* =========================================================
     9. Викторина и финал
     ========================================================= */
  scenes.quiz = function (ctx) {
    const b = base(ctx, { cam: [5.0, 5.0, 11.8], target: [0, 1.6, 0], min: 7, max: 24, autoSpeed: 0.26 });
    const { scene, camera, controls } = b;
    const stage = new THREE.Group();
    scene.add(stage);
    stage.add(M.makePlatform({ radius: 7.4, topTexture: M.pitchTexture('museum') }));

    const trophy = M.makeTrophy();
    trophy.group.scale.setScalar(1.45);
    trophy.group.position.set(0, 0.1, 0);
    stage.add(trophy.group);

    const confetti = M.makeConfetti(180);
    scene.add(confetti.mesh);

    const spot = new THREE.SpotLight(0xfff0c4, 45, 18, 0.55, 0.5, 1.4);
    spot.position.set(0, 9, 4);
    spot.target.position.set(0, 1.2, 0);
    scene.add(spot, spot.target);

    let pulse = 0;
    let wobble = 0;
    let progress = 0;

    const api = {
      setProgress(n) {
        progress = clamp(Number(n) || 0, 0, 6);
        trophy.setProgress(progress);
      },
      correct(score) {
        api.setProgress(score);
        pulse = 1;
        confetti.burst(V(0, 2.2, 0), 0.6);
      },
      wrong() {
        wobble = 1;
      },
      celebrate() {
        api.setProgress(6);
        pulse = 1.4;
        confetti.burst(V(0, 2.6, 0), 1.05);
      },
      setQuestion() {},
      reset() {
        api.setProgress(0);
        pulse = 0;
        wobble = 0;
        confetti.reset();
      }
    };

    const labels = [label('кубок знаний', 0, 3.0, 0, true)];

    function update(dt, t) {
      trophy.group.position.y = 0.1 + Math.sin(t * 1.2) * 0.035;
      trophy.group.rotation.y += dt * 0.28;
      if (pulse > 0) {
        pulse = Math.max(0, pulse - dt * 2.2);
        const s = 1.45 + Math.sin((1.4 - pulse) * 9) * 0.055 * pulse;
        trophy.group.scale.setScalar(s);
      } else {
        trophy.group.scale.lerp(V(1.45, 1.45, 1.45), 0.1);
      }
      if (wobble > 0) {
        wobble = Math.max(0, wobble - dt * 2.0);
        trophy.group.rotation.z = Math.sin(t * 34) * 0.12 * wobble;
      } else {
        trophy.group.rotation.z *= 0.9;
      }
      confetti.update(dt);
    }

    return { scene, camera, controls, labels, api, update, autoRotateSpeed: 0.26 };
  };

  window.SP.scenes = scenes;
})();
