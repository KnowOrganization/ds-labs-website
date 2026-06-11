/* DS Labs — three interactive hero scenes.
   Each factory returns { start, stop, resize, dispose } and mounts into a given canvas.
   Pointer is tracked globally and normalised per-canvas. */
(function () {
  const SCENES = {};

  /* ---------- shared pointer ---------- */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  function trackPointer() {
    window.addEventListener('pointermove', (e) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (!e.touches[0]) return;
      pointer.tx = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
      pointer.ty = -((e.touches[0].clientY / window.innerHeight) * 2 - 1);
    }, { passive: true });
  }
  trackPointer();
  function easePointer() {
    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;
  }

  function sizeRenderer(renderer, camera, canvas) {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  /* =====================================================================
     01 — TERMINAL : wireframe icosahedron + orbiting nodes, mouse steers
     ===================================================================== */
  SCENES.terminal = function (canvas) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 6);

    const GREEN = 0x1f8a4c;
    const group = new THREE.Group();
    scene.add(group);

    // core wireframe solid
    const geo = new THREE.IcosahedronGeometry(2, 1);
    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: GREEN, transparent: true, opacity: 0.9 })
    );
    group.add(wire);

    // vertex node points
    const ptsMat = new THREE.PointsMaterial({ color: GREEN, size: 0.09 });
    const pts = new THREE.Points(geo, ptsMat);
    group.add(pts);

    // outer rotating ring of dots
    const ringGeo = new THREE.BufferGeometry();
    const N = 120, arr = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      arr[i * 3] = Math.cos(a) * 3.1;
      arr[i * 3 + 1] = Math.sin(a) * 3.1;
      arr[i * 3 + 2] = (Math.sin(a * 6) * 0.3);
    }
    ringGeo.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const ring = new THREE.Points(ringGeo, new THREE.PointsMaterial({ color: 0xd98a2b, size: 0.06 }));
    ring.rotation.x = 0.6;
    scene.add(ring);

    let raf = null;
    function loop() {
      easePointer();
      group.rotation.y += 0.004;
      group.rotation.x += 0.0016;
      group.rotation.y += (pointer.x * 0.6 - group.rotation.y % (Math.PI * 2)) * 0.0;
      group.rotation.x += pointer.y * 0.01;
      group.rotation.y += pointer.x * 0.01;
      ring.rotation.z += 0.002;
      camera.position.x += (pointer.x * 0.8 - camera.position.x) * 0.05;
      camera.position.y += (pointer.y * 0.6 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    }
    return {
      start() { if (!raf) loop(); },
      stop() { if (raf) cancelAnimationFrame(raf); raf = null; },
      resize() { sizeRenderer(renderer, camera, canvas); },
      dispose() { renderer.dispose(); }
    };
  };

  /* =====================================================================
     02 — MEME : cloud of bright shapes that scatter from the cursor
     ===================================================================== */
  SCENES.meme = function (canvas) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 9);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const d1 = new THREE.DirectionalLight(0xffffff, 1.2); d1.position.set(3, 4, 5); scene.add(d1);
    const d2 = new THREE.DirectionalLight(0xff4fa3, 0.6); d2.position.set(-4, -2, 3); scene.add(d2);

    const COLORS = [0x3b5bff, 0xff4fa3, 0xffd23f, 0x2bd968, 0xff6b3d, 0x9b5bff];
    const geos = [
      new THREE.IcosahedronGeometry(0.55, 0),
      new THREE.TorusGeometry(0.4, 0.18, 16, 32),
      new THREE.BoxGeometry(0.7, 0.7, 0.7),
      new THREE.ConeGeometry(0.45, 0.8, 6),
      new THREE.SphereGeometry(0.5, 24, 24),
      new THREE.DodecahedronGeometry(0.5, 0)
    ];
    const items = [];
    const COUNT = 26;
    for (let i = 0; i < COUNT; i++) {
      const mat = new THREE.MeshStandardMaterial({
        color: COLORS[i % COLORS.length], roughness: 0.35, metalness: 0.1
      });
      const m = new THREE.Mesh(geos[i % geos.length], mat);
      const base = new THREE.Vector3(
        (Math.random() - 0.5) * 11,
        (Math.random() - 0.5) * 7,
        (Math.random() - 0.5) * 4
      );
      m.position.copy(base);
      m.rotation.set(Math.random() * 3, Math.random() * 3, 0);
      const scl = 0.6 + Math.random() * 0.9;
      m.scale.setScalar(scl);
      scene.add(m);
      items.push({
        m, base, scl,
        rs: (Math.random() - 0.5) * 0.03,
        ph: Math.random() * Math.PI * 2,
        vel: new THREE.Vector3()
      });
    }

    const mouse3 = new THREE.Vector3();
    let raf = null, t = 0;
    function loop() {
      easePointer();
      t += 0.016;
      mouse3.set(pointer.x * 6, pointer.y * 4, 0);
      for (const it of items) {
        const { m, base } = it;
        // float
        const fy = Math.sin(t + it.ph) * 0.25;
        const target = new THREE.Vector3(base.x, base.y + fy, base.z);
        // repel from cursor
        const dx = m.position.x - mouse3.x;
        const dy = m.position.y - mouse3.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 2.6) {
          const f = (2.6 - dist) * 0.06;
          it.vel.x += (dx / (dist || 1)) * f;
          it.vel.y += (dy / (dist || 1)) * f;
        }
        it.vel.multiplyScalar(0.88);
        m.position.x += (target.x - m.position.x) * 0.04 + it.vel.x;
        m.position.y += (target.y - m.position.y) * 0.04 + it.vel.y;
        m.position.z += (target.z - m.position.z) * 0.04;
        m.rotation.x += it.rs;
        m.rotation.y += it.rs * 0.7;
      }
      camera.position.x += (pointer.x * 1.2 - camera.position.x) * 0.04;
      camera.position.y += (pointer.y * 0.8 - camera.position.y) * 0.04;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    }
    return {
      start() { if (!raf) loop(); },
      stop() { if (raf) cancelAnimationFrame(raf); raf = null; },
      resize() { sizeRenderer(renderer, camera, canvas); },
      dispose() { renderer.dispose(); }
    };
  };

  /* =====================================================================
     03 — MINIMAL : glossy noise-displaced orb, light follows cursor
     ===================================================================== */
  SCENES.minimal = function (canvas) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 5);

    const vert = `
      varying vec3 vNormal; varying vec3 vPos; uniform float uTime; uniform float uAmp;
      // classic 3d simplex noise (Ashima)
      vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);}
      vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
      float snoise(vec3 v){
        const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
        vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
        vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
        vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
        i=mod(i,289.0);
        vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
        float n_=1.0/7.0; vec3 ns=n_*D.wyz-D.xzx;
        vec4 j=p-49.0*floor(p*ns.z*ns.z);
        vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
        vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
        vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
        vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
        vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
        vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
        vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
        p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
        vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
        return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
      }
      void main(){
        vNormal=normal;
        float n=snoise(normal*1.4+vec3(0.0,0.0,uTime*0.25));
        float n2=snoise(normal*3.0+vec3(uTime*0.15));
        vec3 displaced=position+normal*(n*uAmp+n2*uAmp*0.4);
        vPos=displaced;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(displaced,1.0);
      }`;
    const frag = `
      varying vec3 vNormal; varying vec3 vPos; uniform vec3 uLight; uniform vec3 uColA; uniform vec3 uColB;
      void main(){
        vec3 N=normalize(vNormal);
        vec3 L=normalize(uLight);
        float diff=clamp(dot(N,L)*0.5+0.5,0.0,1.0);
        float fres=pow(1.0-max(dot(N,vec3(0.0,0.0,1.0)),0.0),2.5);
        vec3 col=mix(uColA,uColB,diff);
        col+=fres*0.6;
        gl_FragColor=vec4(col,1.0);
      }`;

    const uniforms = {
      uTime: { value: 0 },
      uAmp: { value: 0.22 },
      uLight: { value: new THREE.Vector3(1, 1, 1) },
      uColA: { value: new THREE.Color(0xdfe4ee) },
      uColB: { value: new THREE.Color(0x2440ff) }
    };
    const orb = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.5, 48),
      new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms })
    );
    scene.add(orb);

    let raf = null, t = 0;
    function loop() {
      easePointer();
      t += 0.016;
      uniforms.uTime.value = t;
      uniforms.uLight.value.set(pointer.x * 2, pointer.y * 2, 1.2);
      uniforms.uAmp.value = 0.22 + Math.hypot(pointer.tx - pointer.x, pointer.ty - pointer.y) * 0.5;
      orb.rotation.y += 0.0015;
      orb.position.x += (pointer.x * 0.4 - orb.position.x) * 0.05;
      orb.position.y += (pointer.y * 0.3 - orb.position.y) * 0.05;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    }
    return {
      start() { if (!raf) loop(); },
      stop() { if (raf) cancelAnimationFrame(raf); raf = null; },
      resize() { sizeRenderer(renderer, camera, canvas); },
      dispose() { renderer.dispose(); }
    };
  };

  window.DSScenes = SCENES;
})();
