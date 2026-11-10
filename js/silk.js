/* Noori Paradise — WebGL atelier
   Silk hero shader · gold-dust trail · single-context card ripple
   Requires three.js r128 (loaded as a classic script before this file). */
(function () {
  'use strict';

  var hasThree = typeof window.THREE !== 'undefined';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function webglOK() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }

  // Software/headless WebGL (SwiftShader, llvmpipe) cannot hold 60fps with this
  // shader. In that case draw one still frame and leave the rest to CSS.
  function softwareGL() {
    try {
      var c = document.createElement('canvas');
      var gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (!gl) return true;
      var ext = gl.getExtension('WEBGL_debug_renderer_info');
      var name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
      return /swiftshader|software|llvmpipe|basic render|microsoft basic/i.test(String(name));
    } catch (e) { return false; }
  }

  /* ── silk hero ─────────────────────────────────────────────────────── */
  function createSilk(canvas) {
    if (!hasThree || !webglOK()) return { ok: false };
    // Detect software renderers before constructing a Three renderer: the shader
    // compile alone can cost ~300ms on SwiftShader. The hero has a CSS silk
    // fallback for exactly this case.
    if (reduce || softwareGL()) return { ok: false, still: true };

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
    } catch (e) { return { ok: false }; }

    var lowPower = window.innerWidth < 760;
    renderer.setPixelRatio(lowPower ? 0.85 : Math.min(window.devicePixelRatio || 1, 1.25));

    var scene = new THREE.Scene();
    var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    var uniforms = {
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) }
    };

    var vert = [
      'varying vec2 vUv;',
      'void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }'
    ].join('\n');

    var frag = [
      'precision highp float;',
      'varying vec2 vUv;',
      'uniform float uTime;',
      'uniform float uScroll;',
      'uniform vec2 uRes;',
      'uniform vec2 uMouse;',
      'float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }',
      'float noise(vec2 p){',
      '  vec2 i = floor(p); vec2 f = fract(p);',
      '  vec2 u = f * f * (3.0 - 2.0 * f);',
      '  float a = hash(i); float b = hash(i + vec2(1.0, 0.0));',
      '  float c = hash(i + vec2(0.0, 1.0)); float d = hash(i + vec2(1.0, 1.0));',
      '  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);',
      '}',
      'float fbm(vec2 p){',
      '  float v = 0.0; float a = 0.5;',
      '  for(int i = 0; i < 3; i++){ v += a * noise(p); p = p * 2.03 + vec2(13.7, 7.1); a *= 0.5; }',
      '  return v;',
      '}',
      'void main(){',
      '  vec2 uv = vUv;',
      '  float aspect = uRes.x / max(uRes.y, 1.0);',
      '  vec2 p = vec2(uv.x * aspect, uv.y);',
      '  float t = uTime * 0.045;',
      '  vec2 q = vec2(fbm(p * 1.55 + vec2(t, 0.0)), fbm(p * 1.55 + vec2(4.7, -t)));',
      '  vec2 r = vec2(fbm(p * 2.2 + q * 1.25 + vec2(2.1, 7.3) + t * 1.1), fbm(p * 2.2 + q * 1.25 + vec2(9.2, 1.8) - t * 0.8));',
      '  float f = fbm(p * 1.25 + r * 1.5 + vec2(uScroll * 0.22, uScroll * 0.06));',
      '  float fold = sin((uv.x * 5.4 + f * 3.6 + uv.y * 1.35 + uTime * 0.07) * 6.28318);',
      '  float sheen = smoothstep(0.42, 1.0, fold * 0.5 + 0.5);',
      '  vec3 ivory = vec3(0.976, 0.945, 0.918);',
      '  vec3 blush = vec3(0.929, 0.835, 0.800);',
      '  vec3 rose = vec3(0.706, 0.435, 0.502);',
      '  vec3 champagne = vec3(0.863, 0.776, 0.584);',
      '  vec3 plum = vec3(0.212, 0.071, 0.125);',
      '  vec3 col = mix(ivory, blush, smoothstep(0.12, 0.92, f));',
      '  col = mix(col, rose, smoothstep(0.34, 0.95, r.x) * 0.46);',
      '  col = mix(col, champagne, sheen * 0.25);',
      '  float edge = length((uv - vec2(0.72, 0.24)) * vec2(0.92, 1.08));',
      '  col = mix(col, plum, smoothstep(0.52, 1.02, edge) * 0.34);',
      '  float m = exp(-pow(length((uv - uMouse) * vec2(aspect, 1.0)) * 3.15, 2.0));',
      '  col += champagne * m * 0.20 + vec3(m * 0.05);',
      '  float vig = smoothstep(0.42, 1.02, length(uv - 0.5));',
      '  col *= 1.0 - vig * 0.13;',
      '  gl_FragColor = vec4(col, 1.0);',
      '}'
    ].join('\n');

    var material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vert,
      fragmentShader: frag,
      depthTest: false,
      depthWrite: false
    });
    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    var visible = true;
    var mouse = { x: 0.5, y: 0.5 };
    var target = { x: 0.5, y: 0.5 };
    var scroll = 0;
    var targetScroll = 0;
    var running = true;
    var start = performance.now();

    function resize() {
      var w = canvas.clientWidth || window.innerWidth;
      var h = canvas.clientHeight || window.innerHeight;
      lowPower = window.innerWidth < 760;
      renderer.setPixelRatio(lowPower ? 0.85 : Math.min(window.devicePixelRatio || 1, 1.25));
      renderer.setSize(w, h, false);
      uniforms.uRes.value.set(w, h);
    }

    var minFrame = 1000 / (window.innerWidth < 760 ? 30 : 45);
    var lastDraw = 0;

    function render(now) {
      if (!running) return;
      requestAnimationFrame(render);
      if (!visible || document.hidden) return;
      if (now - lastDraw < minFrame) return;
      lastDraw = now;
      mouse.x += (target.x - mouse.x) * 0.055;
      mouse.y += (target.y - mouse.y) * 0.055;
      scroll += (targetScroll - scroll) * 0.06;
      uniforms.uTime.value = (now - start) / 1000;
      uniforms.uMouse.value.set(mouse.x, 1.0 - mouse.y);
      uniforms.uScroll.value = scroll;
      renderer.render(scene, camera);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });
    if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);

    requestAnimationFrame(render);

    return {
      ok: true,
      setPointer: function (nx, ny) { target.x = nx; target.y = ny; },
      setScroll: function (v) { targetScroll = v; },
      setVisible: function (v) { visible = v; },
      destroy: function () { running = false; renderer.dispose(); }
    };
  }

  /* ── gold dust trail ──────────────────────────────────────────────── */
  function createDust(canvas) {
    var ctx = canvas.getContext('2d');
    if (!ctx || reduce) return { ok: false };
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0, visible = true;
    var parts = [];
    var ambient = [];
    var last = { x: 0, y: 0 };
    var pointer = { x: 0, y: 0, active: false };

    function size() {
      w = canvas.clientWidth || window.innerWidth;
      h = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!ambient.length) seedAmbient();
    }

    function seedAmbient() {
      ambient = [];
      var n = window.innerWidth < 760 ? 14 : 24;
      for (var i = 0; i < n; i++) {
        ambient.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.6 + Math.random() * 1.5,
          vy: -0.08 - Math.random() * 0.22,
          vx: (Math.random() - 0.5) * 0.08,
          a: 0.12 + Math.random() * 0.4,
          ph: Math.random() * Math.PI * 2
        });
      }
    }

    function spawn(x, y, force) {
      var n = force ? 3 : 1;
      for (var i = 0; i < n; i++) {
        if (parts.length > 110) parts.shift();
        var a = Math.random() * Math.PI * 2;
        var sp = 0.2 + Math.random() * 1.3;
        parts.push({
          x: x, y: y,
          vx: Math.cos(a) * sp * 0.6,
          vy: Math.sin(a) * sp * 0.6 - 0.35,
          r: 0.7 + Math.random() * 2.2,
          life: 1,
          decay: 0.008 + Math.random() * 0.012
        });
      }
    }

    function draw(now) {
      requestAnimationFrame(draw);
      if (!visible || document.hidden) return;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';

      for (var i = ambient.length - 1; i >= 0; i--) {
        var a = ambient[i];
        a.x += a.vx + Math.sin(now * 0.0004 + a.ph) * 0.06;
        a.y += a.vy;
        if (a.y < -10) { a.y = h + 10; a.x = Math.random() * w; }
        if (a.x < -10) a.x = w + 10;
        if (a.x > w + 10) a.x = -10;
        var tw = 0.55 + Math.sin(now * 0.0016 + a.ph) * 0.45;
        ctx.fillStyle = 'rgba(214,178,112,' + (a.a * tw).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, 6.2832);
        ctx.fill();
      }

      for (var j = parts.length - 1; j >= 0; j--) {
        var p = parts[j];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.004;
        p.vx *= 0.992;
        p.life -= p.decay;
        if (p.life <= 0) { parts.splice(j, 1); continue; }
        ctx.fillStyle = 'rgba(224,188,120,' + (p.life * 0.85).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * (0.4 + p.life), 0, 6.2832);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    size();
    window.addEventListener('resize', size, { passive: true });
    requestAnimationFrame(draw);

    return {
      ok: true,
      move: function (x, y) {
        var d = Math.hypot(x - last.x, y - last.y);
        if (d > 7) {
          spawn(x, y, false);
          last.x = x; last.y = y;
        }
      },
      burst: function (x, y) { spawn(x, y, true); },
      setVisible: function (v) { visible = v; }
    };
  }

  /* ── hover ripple on collection cards ─────────────────────────────── */
  function createRipple() {
    if (!hasThree || !webglOK() || reduce) return null;

    var renderer, scene, camera, mesh, material;
    var textures = {};
    var canvas;
    var active = false;
    var hover = 0;
    var targetHover = 0;
    var time = 0;
    var raf = 0;
    var visible = true;
    var mouse = { x: 0.5, y: 0.5 };
    var targetMouse = { x: 0.5, y: 0.5 };

    function boot() {
      if (renderer) return;
      canvas = document.createElement('canvas');
      canvas.className = 'ripple-canvas';
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false, alpha: true, premultipliedAlpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setClearColor(0x000000, 0);
      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      material = new THREE.ShaderMaterial({
        transparent: true,
        depthTest: false,
        depthWrite: false,
        uniforms: {
          uTex: { value: null },
          uMouse: { value: new THREE.Vector2(0.5, 0.5) },
          uHover: { value: 0 },
          uTime: { value: 0 },
          uCover: { value: new THREE.Vector2(1, 1) }
        },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
        fragmentShader: [
          'precision highp float;',
          'varying vec2 vUv;',
          'uniform sampler2D uTex;',
          'uniform vec2 uMouse;',
          'uniform vec2 uCover;',
          'uniform float uHover;',
          'uniform float uTime;',
          'void main(){',
          '  vec2 uv = (vUv - 0.5) * uCover + 0.5;',
          '  vec2 m = (uMouse - 0.5) * uCover + 0.5;',
          '  float d = distance(uv, m);',
          '  float ring = sin(d * 44.0 - uTime * 3.6) * 0.011 * uHover * exp(-d * 4.2);',
          '  uv += normalize(uv - m + 0.00001) * ring;',
          '  uv = (uv - 0.5) * (1.0 - 0.045 * uHover) + 0.5;',
          '  vec3 col = texture2D(uTex, uv).rgb;',
          '  float sh = smoothstep(0.0, 1.0, 1.0 - abs(uv.x - m.x) * 2.6) * 0.11 * uHover;',
          '  col += vec3(0.96, 0.86, 0.68) * sh;',
          '  gl_FragColor = vec4(col, 1.0);',
          '}'
        ].join('\n')
      });
      mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
      scene.add(mesh);
    }

    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      time += 0.016;
      hover += (targetHover - hover) * 0.09;
      mouse.x += (targetMouse.x - mouse.x) * 0.12;
      mouse.y += (targetMouse.y - mouse.y) * 0.12;
      if (!material) return;
      material.uniforms.uHover.value = hover;
      material.uniforms.uTime.value = time;
      material.uniforms.uMouse.value.set(mouse.x, mouse.y);
      if (canvas && canvas.parentNode) {
        canvas.style.opacity = hover > 0.01 ? String(Math.min(1, hover * 1.6)) : '0';
      }
      renderer.render(scene, camera);
      if (!active && hover < 0.004 && canvas && canvas.parentNode) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }

    function getTexture(src) {
      if (textures[src]) return textures[src];
      var tex = new THREE.Texture();
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        tex.image = img;
        tex.needsUpdate = true;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = false;
        textures[src] = tex;
      };
      img.src = src;
      textures[src] = tex;
      return tex;
    }

    function place(card, media) {
      boot();
      if (!renderer) return;
      if (canvas.parentNode !== media) media.appendChild(canvas);
      var r = media.getBoundingClientRect();
      var w = Math.max(1, Math.round(r.width));
      var h = Math.max(1, Math.round(r.height));
      renderer.setSize(w, h, false);
      var img = media.querySelector('img');
      var src = img ? img.currentSrc || img.src : '';
      if (src) {
        var tex = getTexture(src);
        material.uniforms.uTex.value = tex;
        var ia = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : w / h;
        var pa = w / h;
        if (ia > pa) material.uniforms.uCover.value.set(pa / ia, 1);
        else material.uniforms.uCover.value.set(1, ia / pa);
      }
      if (!raf) {
        raf = requestAnimationFrame(loop);
      }
    }

    return {
      enter: function (card, media) {
        active = true;
        targetHover = 1;
        place(card, media);
      },
      setMouse: function (nx, ny) { targetMouse.x = nx; targetMouse.y = ny; },
      leave: function () { active = false; targetHover = 0; },
      setVisible: function (v) { visible = v; }
    };
  }

  window.NoorSilk = {
    available: hasThree && webglOK(),
    createSilk: createSilk,
    createDust: createDust,
    createRipple: createRipple
  };
})();
