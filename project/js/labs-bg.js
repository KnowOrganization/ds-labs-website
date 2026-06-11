/* DS Labs — spatial background: subtle parallax dot-field + the "home star"
   (noise-displaced glossy orb) that tracks the world's brand-centre and zoom.
   Reads window.DSWorldState = { x, y, scale } each frame. Orthographic so the
   orb can be pixel-positioned to sit exactly behind the brand node. */
(function () {
  function init(canvas) {
    if (!window.THREE) return null;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    const isMobile = matchMedia('(max-width: 760px)').matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));

    let W = window.innerWidth, H = window.innerHeight;
    const cam = new THREE.OrthographicCamera(-W / 2, W / 2, H / 2, -H / 2, -2000, 2000);
    cam.position.z = 10;
    const scene = new THREE.Scene();

    /* ---------- soft round dot sprite ---------- */
    const dotCanvas = document.createElement('canvas');
    dotCanvas.width = dotCanvas.height = 64;
    const dctx = dotCanvas.getContext('2d');
    const grd = dctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(20,22,30,0.9)');
    grd.addColorStop(0.5, 'rgba(20,22,30,0.5)');
    grd.addColorStop(1, 'rgba(20,22,30,0)');
    dctx.fillStyle = grd; dctx.fillRect(0, 0, 64, 64);
    const dotTex = new THREE.CanvasTexture(dotCanvas);

    /* ---------- 2 parallax dot layers ---------- */
    const layers = [];
    function makeLayer(count, spread, size, opacity, depth) {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        pos[i * 3] = (Math.random() - 0.5) * spread;
        pos[i * 3 + 1] = (Math.random() - 0.5) * spread;
        pos[i * 3 + 2] = -depth;
      }
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({
        size, map: dotTex, transparent: true, opacity,
        depthWrite: false, sizeAttenuation: false
      });
      const pts = new THREE.Points(geo, mat);
      pts.userData = { depth, spread };
      scene.add(pts);
      layers.push(pts);
    }
    const cnt = isMobile ? 0.6 : 1;
    makeLayer(Math.round(120 * cnt), Math.max(W, H) * 3, 3, 0.5, 1);
    makeLayer(Math.round(90 * cnt), Math.max(W, H) * 3, 5, 0.32, 0.55);
    makeLayer(Math.round(40 * cnt), Math.max(W, H) * 3, 8, 0.18, 0.3);

    /* ---------- the home-star orb (noise-displaced shader) ---------- */
    const vert = `
      varying vec3 vN; uniform float uTime; uniform float uAmp;
      vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);}
      vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
      float snoise(vec3 v){
        const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
        vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
        vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
        vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy; i=mod(i,289.0);
        vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
        float n_=1.0/7.0; vec3 ns=n_*D.wyz-D.xzx; vec4 j=p-49.0*floor(p*ns.z*ns.z);
        vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_); vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy;
        vec4 h=1.0-abs(x)-abs(y); vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
        vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
        vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
        vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
        vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
        p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
        vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
        return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
      }
      void main(){
        vN=normal;
        float n=snoise(normal*1.3+vec3(0.0,0.0,uTime*0.22));
        float n2=snoise(normal*2.6+vec3(uTime*0.13));
        vec3 d=position+normal*(n*uAmp+n2*uAmp*0.4);
        gl_Position=projectionMatrix*modelViewMatrix*vec4(d,1.0);
      }`;
    const frag = `
      varying vec3 vN; uniform vec3 uLight; uniform vec3 uColA; uniform vec3 uColB;
      void main(){
        vec3 N=normalize(vN); vec3 L=normalize(uLight);
        float diff=clamp(dot(N,L)*0.5+0.5,0.0,1.0);
        float fres=pow(1.0-max(dot(N,vec3(0.0,0.0,1.0)),0.0),2.4);
        vec3 col=mix(uColA,uColB,diff); col+=fres*0.55;
        gl_FragColor=vec4(col,1.0);
      }`;
    const uniforms = {
      uTime: { value: 0 }, uAmp: { value: 0.2 },
      uLight: { value: new THREE.Vector3(0.4, 0.7, 1) },
      uColA: { value: new THREE.Color(0xdfe5f2) },
      uColB: { value: new THREE.Color(0x2c46e6) }
    };
    const orb = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1, isMobile ? 24 : 40),
      new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms })
    );
    scene.add(orb);
    window.__DSrender = null; // set after frame() is defined

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    window.addEventListener('pointermove', (e) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    }, { passive: true });

    const brandEl = document.querySelector('.brand-node');

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      cam.left = -W / 2; cam.right = W / 2; cam.top = H / 2; cam.bottom = -H / 2;
      cam.updateProjectionMatrix();
      renderer.setSize(W, H, false);
    }
    resize();

    let raf = null, t = 0;
    function frame(advance) {
      if (W !== window.innerWidth || H !== window.innerHeight) resize();
      if (advance) t += 0.016;
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;

      const st = window.DSWorldState || { x: 0, y: 0, scale: 1 };
      // Anchor the orb to the brand node's real on-screen rect — robust to any
      // pan / zoom / resize, no coordinate math needed.
      if (brandEl) {
        const r = brandEl.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        orb.position.x = cx - W / 2;
        orb.position.y = H / 2 - cy;
        orb.scale.setScalar(Math.max(40, r.width * 0.62));
      }
      orb.rotation.y += 0.0012;
      uniforms.uTime.value = t;
      uniforms.uAmp.value = 0.2 + Math.hypot(pointer.tx - pointer.x, pointer.ty - pointer.y) * 0.45;
      uniforms.uLight.value.set(pointer.x * 2, pointer.y * 2 + 0.5, 1.1);

      // dot-field parallax: shift opposite to pan, scaled by depth + slow drift
      for (const lyr of layers) {
        const d = lyr.userData.depth;
        lyr.position.x = (st.x * 0.05 * d) + Math.sin(t * 0.05 + d) * 12;
        lyr.position.y = (-st.y * 0.05 * d) + Math.cos(t * 0.04 + d) * 12;
      }
      renderer.render(scene, cam);
    }
    function loop() { frame(true); raf = requestAnimationFrame(loop); }
    window.__DSrender = function () { frame(false); };
    return {
      start() { if (!raf) loop(); },
      stop() { if (raf) cancelAnimationFrame(raf); raf = null; },
      resize
    };
  }
  window.DSBackground = { init };
})();
