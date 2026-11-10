/* Noori Paradise — experience layer
   Loader · smooth scroll · hero WebGL · cursor · pinned rail · lookbook. */
(function () {
  'use strict';
  const N = window.Noor;
  if (!N) return;
  const { $, $$, clamp, state } = N;
  const gsap = window.gsap;
  const reduce = N.reduce;
  const touch = N.touch;
  let heroRevealed = false;
  let silky = null;
  let dust = null;

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ── section index: scrollspy + gold thread ────────────────────────── */
  function initSectionIndex() {
    const nav = $('#sectionIndex');
    if (!nav) return;
    const links = $$('[data-index-link]', nav);
    if (!links.length) return;
    const thread = $('#indexThread');
    const sections = links.map(function (link) {
      return document.getElementById(link.dataset.indexLink);
    }).filter(Boolean);
    if (!sections.length) return;
    let current = '';
    let ticking = false;

    function mark(id) {
      if (id === current) return;
      current = id;
      links.forEach(function (link) {
        const on = link.dataset.indexLink === id;
        link.classList.toggle('is-active', on);
        if (on) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    }

    function spy() {
      ticking = false;
      const probe = window.scrollY + window.innerHeight * 0.38;
      let found = sections[0].id;
      sections.forEach(function (section) {
        if (section.offsetTop <= probe) found = section.id;
      });
      mark(found);
      if (thread) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        thread.style.transform = 'scaleY(' + clamp(max > 0 ? window.scrollY / max : 0, 0, 1).toFixed(4) + ')';
      }
    }

    function queue() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(spy);
    }

    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    spy();
    N.onLang(queue);
    /* after the pinned rail has inserted its spacer, re-measure */
    setTimeout(spy, 400);
    setTimeout(spy, 1400);
  }

  /* ── collections rail: keyboard + pointer drag on narrow layouts ───── */
  function initRailInput() {
    const track = $('#collectionsTrack');
    if (!track) return;
    const compact = function () { return window.matchMedia('(max-width: 980px)').matches; };

    track.addEventListener('keydown', function (e) {
      if (!compact()) return;
      const step = Math.min(track.clientWidth * 0.82, 460);
      if (e.key === 'ArrowRight') { e.preventDefault(); track.scrollBy({ left: step, behavior: reduce ? 'auto' : 'smooth' }); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); track.scrollBy({ left: -step, behavior: reduce ? 'auto' : 'smooth' }); }
      else if (e.key === 'Home') { e.preventDefault(); track.scrollTo({ left: 0, behavior: reduce ? 'auto' : 'smooth' }); }
      else if (e.key === 'End') { e.preventDefault(); track.scrollTo({ left: track.scrollWidth, behavior: reduce ? 'auto' : 'smooth' }); }
    });

    let down = false;
    let dragged = false;
    let startX = 0;
    let startLeft = 0;
    let pointerId = 0;

    track.addEventListener('pointerdown', function (e) {
      if (!compact() || e.pointerType === 'touch' || e.button !== 0) return;
      down = true;
      dragged = false;
      startX = e.clientX;
      startLeft = track.scrollLeft;
      pointerId = e.pointerId;
      track.setPointerCapture(pointerId);
    });
    track.addEventListener('pointermove', function (e) {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 5) {
        dragged = true;
        track.classList.add('is-dragging');
      }
      if (dragged) track.scrollLeft = startLeft - dx;
    });
    function endDrag() {
      if (!down) return;
      down = false;
      track.classList.remove('is-dragging');
      if (pointerId && track.hasPointerCapture && track.hasPointerCapture(pointerId)) {
        track.releasePointerCapture(pointerId);
      }
      pointerId = 0;
    }
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('pointerleave', endDrag);
    track.addEventListener('click', function (e) {
      if (!dragged) return;
      e.preventDefault();
      e.stopPropagation();
      dragged = false;
    }, true);
  }


  /* ── hero title splitting ─────────────────────────────────────────── */
  function prepareHero() {
    const words = $$('.hero__word');
    words.forEach(function (word) {
      const text = word.textContent.trim();
      word.textContent = '';
      if (state.lang === 'en') {
        Array.from(text).forEach(function (ch) {
          const span = document.createElement('span');
          span.className = 'char';
          span.textContent = ch === ' ' ? '\u00A0' : ch;
          word.appendChild(span);
        });
      } else {
        const span = document.createElement('span');
        span.className = 'char char--word';
        span.textContent = text;
        word.appendChild(span);
      }
    });
    const title = $('#heroTitle');
    if (title) title.setAttribute('aria-label', N.t('hero.brand1') + ' ' + N.t('hero.brand2'));
    if (gsap && !reduce && !heroRevealed) {
      gsap.set('.hero__word .char', { yPercent: 118, rotate: 3 });
    }
    if (gsap && !reduce && heroRevealed) {
      gsap.fromTo('.hero__word .char',
        { yPercent: 110, rotate: 2, opacity: 0 },
        { yPercent: 0, rotate: 0, opacity: 1, duration: 0.9, ease: 'power4.out', stagger: 0.022, overwrite: true });
    }
  }

  /* ── cinematic loader ─────────────────────────────────────────────── */
  function initLoader() {
    const loader = $('#loader');
    if (!loader) return;
    if (!gsap || reduce) {
      loader.style.display = 'none';
      document.body.classList.remove('is-loading');
      state.loading = false;
      heroRevealed = true;
      heroIntro();
      return;
    }

    const counter = { v: 0 };
    const pct = $('#loadPct');
    const tl = gsap.timeline();
    tl.to('.loader__thread--1', { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }, 0)
      .to('.loader__thread--2', { strokeDashoffset: 0, duration: 0.7, ease: 'power2.inOut' }, 0.5)
      .to('.loader__dot', { opacity: 1, duration: 0.3 }, 0.8)
      .to('.loader__word span, .loader__word em', { opacity: 1, y: 0, duration: 0.75, stagger: 0.08, ease: 'power3.out' }, 0.35)
      .to('#loadBar', { scaleX: 1, duration: 1.5, ease: 'power1.inOut' }, 0)
      .to(counter, {
        v: 100, duration: 1.5, ease: 'power1.inOut',
        onUpdate: function () {
          if (pct) pct.textContent = String(Math.round(counter.v)).padStart(2, '0');
        }
      }, 0);

    let loaded = document.readyState === 'complete';
    const loadPromise = new Promise(function (resolve) {
      if (loaded) { resolve(); return; }
      window.addEventListener('load', resolve, { once: true });
      setTimeout(resolve, 2600);
    });
    const minWait = new Promise(function (resolve) { setTimeout(resolve, 900); });

    Promise.all([loadPromise, minWait]).then(function () {
      gsap.timeline({
        onComplete: function () {
          loader.style.display = 'none';
          loader.setAttribute('aria-hidden', 'true');
          document.body.classList.remove('is-loading');
          state.loading = false;
          if (state.lenis) state.lenis.start();
          N.refresh();
        }
      })
        .to('.loader__inner', { opacity: 0, y: -14, duration: 0.26, ease: 'power2.in' })
        .to('.loader__panel--l', { xPercent: -101.5, duration: 0.8, ease: 'power4.inOut' }, 0.12)
        .to('.loader__panel--r', { xPercent: 101.5, duration: 0.8, ease: 'power4.inOut' }, 0.12)
        .add(function () { heroIntro(); }, 0.5);
    });
  }

  function heroIntro() {
    if (heroRevealed) return;
    heroRevealed = true;
    if (!gsap || reduce) {
      document.body.classList.add('ready');
      return;
    }
    const tl = gsap.timeline();
    tl.fromTo('.hero__meta', { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }, 0)
      .fromTo('.hero__word .char', { yPercent: 118, rotate: 3 }, { yPercent: 0, rotate: 0, duration: 1.35, ease: 'power4.out', stagger: 0.045 }, 0.08)
      .fromTo('.hero__tagline', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out' }, 0.7)
      .fromTo('.hero__bottom', { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out' }, 0.85)
      .fromTo('.hero__card', { opacity: 0, y: 34, rotate: 6 }, { opacity: 1, y: 0, rotate: 2.4, duration: 1.3, ease: 'power3.out' }, 0.95);
    document.body.classList.add('ready');
  }

  /* ── smooth scroll + global scroll feedback ───────────────────────── */
  function initScroll() {
    const topbar = $('#topbar');
    const bar = $('#progressBar');
    const marquee = $('#marqueeSkew');
    let lastY = window.scrollY;
    let skewTo = null;
    if (gsap) skewTo = gsap.quickTo(marquee, 'skewX', { duration: 0.7, ease: 'power3' });

    function onScroll(y, velocity) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? clamp(y / max, 0, 1) : 0;
      if (topbar) topbar.classList.toggle('is-scrolled', y > 40);
      if (bar) bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      if (silky && silky.setScroll) silky.setScroll(clamp(y / window.innerHeight, 0, 1));
      if (skewTo) {
        const v = typeof velocity === 'number' ? velocity : (y - lastY);
        skewTo(clamp(v * 0.055, -7, 7));
      }
      lastY = y;
    }
    N.onScroll = onScroll;

    if (window.Lenis && gsap && !reduce) {
      const lenis = new Lenis({
        duration: 1.1,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
        syncTouch: false
      });
      state.lenis = lenis;
      N.state.lenis = lenis;
      lenis.on('scroll', function (e) {
        onScroll(e.scroll, e.velocity);
        if (window.ScrollTrigger) ScrollTrigger.update();
      });
      gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
      if (state.loading) lenis.stop();
    } else {
      window.addEventListener('scroll', function () { onScroll(window.scrollY, 0); }, { passive: true });
      onScroll(window.scrollY, 0);
    }

    if (gsap && window.ScrollTrigger) {
      gsap.to('.hero__inner', {
        yPercent: 9,
        opacity: 0.62,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      });
    }
  }

  /* ── hero silk + gold dust ────────────────────────────────────────── */
  function initHeroMedia() {
    const hero = $('.hero');
    const silkCanvas = $('#silkCanvas');
    const dustCanvas = $('#dustCanvas');
    if (!hero || !window.NoorSilk) return;

    if (silkCanvas) {
      silky = NoorSilk.createSilk(silkCanvas);
      if (!silky.ok) silkCanvas.style.display = 'none';
    }
    if (dustCanvas && !reduce) {
      dust = NoorSilk.createDust(dustCanvas);
      if (!dust.ok) dustCanvas.style.display = 'none';
    }

    hero.addEventListener('pointermove', function (e) {
      const r = hero.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      if (silky && silky.setPointer) silky.setPointer(x / r.width, y / r.height);
      if (dust && dust.move) dust.move(x, y);
    }, { passive: true });

    hero.addEventListener('pointerleave', function () {
      if (silky && silky.setPointer) silky.setPointer(0.52, 0.48);
    });

    hero.addEventListener('click', function (e) {
      if (dust && dust.burst && e.target === hero) {
        const r = hero.getBoundingClientRect();
        dust.burst(e.clientX - r.left, e.clientY - r.top);
      }
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        const vis = entries[0].isIntersecting;
        if (silky && silky.setVisible) silky.setVisible(vis);
        if (dust && dust.setVisible) dust.setVisible(vis);
      }, { threshold: 0 }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () {
      const vis = !document.hidden;
      if (silky && silky.setVisible) silky.setVisible(vis);
      if (dust && dust.setVisible) dust.setVisible(vis);
    });
  }

  /* ── cursor + magnetic + scramble ─────────────────────────────────── */
  function initCursor() {
    if (touch || reduce) return;
    const cursor = $('#cursor');
    const label = $('#cursorLabel');
    if (!cursor) return;
    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let cx = tx;
    let cy = ty;
    let visible = false;
    let current = '';
    let stateName = 'base';

    window.addEventListener('pointermove', function (e) {
      tx = e.clientX;
      ty = e.clientY;
      if (!visible) {
        visible = true;
        cursor.classList.add('is-on');
        cx = tx; cy = ty;
      }
    }, { passive: true });
    document.addEventListener('pointerleave', function () {
      visible = false;
      cursor.classList.remove('is-on');
    });

    function applyState(name, text) {
      stateName = name;
      cursor.classList.remove('is-link', 'is-view', 'is-open', 'is-scroll');
      if (name !== 'base') cursor.classList.add('is-' + name);
      if (label) {
        label.textContent = text || '';
        label.style.opacity = name === 'view' || name === 'open' || name === 'scroll' ? '' : '';
      }
    }

    document.addEventListener('pointerover', function (e) {
      const target = e.target.closest('[data-cursor], a, button, input, label');
      if (!target) { applyState('base'); return; }
      const kind = target.getAttribute('data-cursor');
      if (kind === 'view') applyState('view', N.t('cursor.view'));
      else if (kind === 'open') applyState('open', N.t('cursor.open'));
      else if (kind === 'scroll') applyState('scroll', N.t('cursor.scroll'));
      else applyState('link');
    });

    function loop() {
      cx += (tx - cx) * 0.34;
      cy += (ty - cy) * 0.34;
      cursor.style.transform = 'translate3d(' + cx.toFixed(2) + 'px,' + cy.toFixed(2) + 'px,0)';
      requestAnimationFrame(loop);
    }
    loop();

    N.onLang(function () {
      if (stateName === 'view') applyState('view', N.t('cursor.view'));
      else if (stateName === 'open') applyState('open', N.t('cursor.open'));
      else if (stateName === 'scroll') applyState('scroll', N.t('cursor.scroll'));
    });
  }

  function initMagnetic() {
    if (touch || reduce || !gsap) return;
    $$('.magnetic').forEach(function (el) {
      if (el.dataset.magneticBound) return;
      el.dataset.magneticBound = '1';
      const xTo = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3' });
      el.addEventListener('pointermove', function (e) {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * 0.22);
        yTo((e.clientY - r.top - r.height / 2) * 0.3);
      });
      el.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
    });
  }

  function initScramble() {
    if (reduce || touch) return;
    $$('.nav__link').forEach(function (link) {
      const span = link.querySelector('span[data-i18n]');
      if (!span) return;
      let raf = 0;
      let frame = 0;
      const glyphs = 'NOORIPARADISE·';
      link.addEventListener('mouseenter', function () {
        if (state.lang !== 'en') return;
        cancelAnimationFrame(raf);
        frame = 0;
        const original = span.textContent;
        const tick = function () {
          frame += 1;
          span.textContent = original.split('').map(function (ch, i) {
            if (ch === ' ') return ' ';
            if (frame > 16 + i * 0.9) return ch;
            return glyphs[Math.floor(Math.random() * glyphs.length)];
          }).join('');
          if (frame < 34) raf = requestAnimationFrame(tick);
          else span.textContent = original;
        };
        raf = requestAnimationFrame(tick);
      });
      link.addEventListener('mouseleave', function () {
        cancelAnimationFrame(raf);
        span.textContent = N.t(span.dataset.i18n);
      });
    });
  }

  /* ── reveal choreography ──────────────────────────────────────────── */
  function initReveals() {
    if (!gsap || !window.ScrollTrigger) return;
    const masks = $$('[data-reveal="mask"]');
    const fades = $$('[data-reveal="fade"]').filter(function (el) { return !el.closest('.hero'); });

    if (reduce) {
      gsap.set(masks, { yPercent: 0, opacity: 1 });
      gsap.set(fades, { opacity: 1, y: 0 });
      return;
    }

    masks.forEach(function (el) {
      /* the CSS fallback sets a percentage transform; GSAP would read that
         as pixels, so clear it before handing the element to yPercent */
      gsap.set(el, { clearProps: 'transform' });
      el.style.transform = 'none';
      gsap.set(el, { yPercent: 112 });
      ScrollTrigger.create({
        trigger: el.closest('section') || el,
        start: 'top 82%',
        once: true,
        onEnter: function () {
          gsap.to(el, { yPercent: 0, duration: 1.35, ease: 'power4.out' });
        }
      });
    });
    fades.forEach(function (el) {
      gsap.set(el, { clearProps: 'transform' });
      el.style.transform = 'none';
      gsap.set(el, { opacity: 0, y: 18 });
      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        once: true,
        onEnter: function () {
          gsap.to(el, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' });
        }
      });
    });
  }

  /* ── statement word lighting ──────────────────────────────────────── */
  let statementTrigger = null;
  function splitStatement() {
    const p = $('#statementText');
    if (!p) return;
    const text = p.textContent.trim();
    p.textContent = '';
    text.split(/\s+/).forEach(function (word, i) {
      if (i) p.appendChild(document.createTextNode(' '));
      const span = document.createElement('span');
      span.textContent = word;
      p.appendChild(span);
    });
    if (statementTrigger) { statementTrigger.kill(); statementTrigger = null; }
    if (!gsap || reduce) {
      $$('#statementText span').forEach(function (s) { s.style.opacity = 1; });
      return;
    }
    statementTrigger = gsap.to('#statementText span', {
      opacity: 1,
      stagger: 0.55,
      ease: 'none',
      scrollTrigger: {
        trigger: '#statement',
        start: 'top 68%',
        end: 'bottom 62%',
        scrub: 0.6
      }
    });
  }

  /* ── pinned collection rail ───────────────────────────────────────── */
  function initCollections() {
    const track = $('#collectionsTrack');
    const railBar = $('#railBar');
    const railIndex = $('#railIndex');
    if (!track) return;

    function updateRail(p) {
      if (railBar) railBar.style.transform = 'scaleX(' + clamp(p, 0, 1) + ')';
      if (railIndex) railIndex.textContent = String(1 + Math.round(clamp(p, 0, 1) * 5)).padStart(2, '0');
    }

    if (gsap && window.ScrollTrigger && !reduce) {
      const mm = gsap.matchMedia();
      mm.add('(min-width: 981px)', function () {
        const distance = function () { return Math.max(0, track.scrollWidth - window.innerWidth + 4); };
        const tween = gsap.to(track, {
          x: function () { return -distance(); },
          ease: 'none',
          scrollTrigger: {
            trigger: '#collections',
            start: 'top top',
            end: function () { return '+=' + (distance() + window.innerHeight * 0.55); },
            pin: true,
            scrub: 0.7,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: function (self) { updateRail(self.progress); }
          }
        });
        return function () {
          if (tween.scrollTrigger) tween.scrollTrigger.kill();
          tween.kill();
          gsap.set(track, { clearProps: 'transform' });
          updateRail(0);
        };
      });
    }

    track.addEventListener('scroll', function () {
      if (window.innerWidth >= 981) return;
      const max = track.scrollWidth - track.clientWidth;
      updateRail(max > 0 ? track.scrollLeft / max : 0);
    }, { passive: true });

    /* enquiry buttons */
    $$('.enquire').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const key = btn.dataset.enquire;
        N.openWhatsApp(N.t('wa.card', { item: N.t(key + '.name') }));
      });
    });
  }

  /* ── card tilt + WebGL ripple ─────────────────────────────────────── */
  function initCards() {
    if (touch || reduce || !gsap) return;
    const ripple = window.NoorSilk ? NoorSilk.createRipple() : null;

    $$('.card').forEach(function (card) {
      const media = card.querySelector('.card__media');
      const img = card.querySelector('img');
      if (!media) return;
      gsap.set(card, { transformPerspective: 1100, transformOrigin: '50% 50%' });
      const rx = gsap.quickTo(card, 'rotationX', { duration: 0.6, ease: 'power3' });
      const ry = gsap.quickTo(card, 'rotationY', { duration: 0.6, ease: 'power3' });

      media.addEventListener('pointerenter', function () {
        if (ripple) ripple.enter(card, media);
      });
      media.addEventListener('pointermove', function (e) {
        const r = card.getBoundingClientRect();
        const nx = clamp((e.clientX - r.left) / r.width, 0, 1);
        const ny = clamp((e.clientY - r.top) / r.height, 0, 1);
        rx((ny - 0.5) * -5.5);
        ry((nx - 0.5) * 5.5);
        if (ripple) ripple.setMouse(nx, 1 - ny);
        if (img) {
          gsap.to(img, {
            x: (nx - 0.5) * 16,
            y: (ny - 0.5) * 16,
            scale: 1.075,
            duration: 0.7,
            ease: 'power3.out',
            overwrite: 'auto'
          });
        }
      });
      media.addEventListener('pointerleave', function () {
        rx(0); ry(0);
        if (ripple) ripple.leave();
        if (img) gsap.to(img, { x: 0, y: 0, scale: 1.045, duration: 0.9, ease: 'power3.out', overwrite: 'auto' });
      });
    });
  }

  /* ── lookbook: view bubble + lightbox ─────────────────────────────── */
  const lb = { index: 0, items: [], lastFocus: null, filter: 'all' };

  function visibleLooks() {
    return $$('.look').filter(function (tile) {
      return !tile.classList.contains('is-hidden');
    });
  }

  function looksData() {
    return visibleLooks().map(function (btn) {
      const img = btn.querySelector('img');
      const cap = btn.querySelector('.look__cap em');
      return {
        src: img ? img.currentSrc || img.src : '',
        alt: img ? img.alt : '',
        caption: cap ? cap.textContent : '',
        cat: btn.dataset.cat || '',
        el: btn
      };
    });
  }

  function updateLookCount() {
    const tiles = $$('.look');
    const shown = tiles.filter(function (t) { return !t.classList.contains('is-hidden'); }).length;
    const countEl = $('#lookCount');
    if (countEl) countEl.textContent = N.t('look.showing', { count: shown, total: tiles.length });
  }

  function applyLookFilter(filter, animate) {
    lb.filter = filter;
    const filters = $('#lookFilters');
    if (filters) {
      $$('[data-filter]', filters).forEach(function (b) {
        b.setAttribute('aria-pressed', b.dataset.filter === filter ? 'true' : 'false');
      });
    }
    let shown = 0;
    $$('.look').forEach(function (tile) {
      const show = filter === 'all' || tile.dataset.cat === filter;
      tile.classList.toggle('is-hidden', !show);
      tile.classList.remove('is-showing');
      if (show) {
        if (animate && !reduce) {
          tile.style.animationDelay = Math.min(shown * 45, 280) + 'ms';
          void tile.offsetWidth;
          tile.classList.add('is-showing');
        } else {
          tile.style.animationDelay = '';
        }
        shown += 1;
      }
    });
    updateLookCount();
    const box = $('#lightbox');
    if (box && box.classList.contains('is-open')) {
      lb.items = looksData();
      lb.index = Math.min(lb.index, Math.max(0, lb.items.length - 1));
      updateLightbox();
    }
    if (animate && window.ScrollTrigger) setTimeout(function () { ScrollTrigger.refresh(); }, 70);
  }

  function buildThumbs() {
    const wrap = $('#lbThumbs');
    if (!wrap) return;
    wrap.innerHTML = lb.items.map(function (item, i) {
      return '<button type="button" data-lb-thumb="' + i + '" aria-current="' + (i === lb.index ? 'true' : 'false') + '" ' +
        'aria-label="' + esc(N.t('look.thumbLabel', { n: i + 1 })) + '">' +
        '<img src="' + esc(item.src) + '" alt="" loading="lazy" width="46" height="58"></button>';
    }).join('');
    const active = wrap.querySelector('[data-lb-thumb="' + lb.index + '"]');
    if (active && wrap.scrollWidth > wrap.clientWidth) {
      const left = active.offsetLeft - (wrap.clientWidth - active.offsetWidth) / 2;
      wrap.scrollTo({ left: Math.max(0, left), behavior: reduce ? 'auto' : 'smooth' });
    }
  }

  function updateLightbox() {
    const item = lb.items[lb.index];
    if (!item) return;
    const image = $('#lbImage');
    if (image) {
      image.src = item.src;
      image.alt = item.alt;
      image.width = item.src.indexOf('look2') > -1 || item.src.indexOf('look6') > -1 ? 1200 : 900;
    }
    const cap = $('#lbCaption');
    if (cap) cap.textContent = item.caption;
    const count = $('#lbCount');
    if (count) count.textContent = String(lb.index + 1).padStart(2, '0') + ' / ' + String(lb.items.length).padStart(2, '0');
    buildThumbs();
  }

  function openLightbox(index) {
    const box = $('#lightbox');
    if (!box) return;
    lb.items = looksData();
    if (!lb.items.length) return;
    lb.index = Math.max(0, Math.min(index, lb.items.length - 1));
    lb.lastFocus = document.activeElement;
    updateLightbox();
    box.classList.add('is-open');
    box.setAttribute('aria-hidden', 'false');
    N.lock(true);
    const close = $('#lbClose');
    if (close) setTimeout(function () { close.focus(); }, 120);
    if (gsap && !reduce) {
      gsap.fromTo('#lbImage', { opacity: 0, scale: 0.965 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out' });
    }
  }

  function closeLightbox() {
    const box = $('#lightbox');
    if (!box || !box.classList.contains('is-open')) return;
    box.classList.remove('is-open');
    box.setAttribute('aria-hidden', 'true');
    N.lock(false);
    if (lb.lastFocus) lb.lastFocus.focus({ preventScroll: true });
  }

  function stepLightbox(dir) {
    if (!lb.items.length) return;
    lb.index = (lb.index + dir + lb.items.length) % lb.items.length;
    if (gsap && !reduce) {
      gsap.fromTo('#lbImage', { opacity: 0, x: dir * 18 }, { opacity: 1, x: 0, duration: 0.45, ease: 'power2.out' });
    }
    updateLightbox();
  }

  function initLookbook() {
    const bubble = $('#viewBubble');
    const tiles = $$('.look');
    if (!tiles.length) return;

    tiles.forEach(function (tile) {
      tile.addEventListener('click', function () {
        openLightbox(visibleLooks().indexOf(tile));
      });
    });

    const filters = $('#lookFilters');
    if (filters) {
      filters.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-filter]');
        if (!btn || btn.dataset.filter === lb.filter) return;
        applyLookFilter(btn.dataset.filter, true);
      });
    }
    applyLookFilter('all', false);

    const box = $('#lightbox');
    if (box) {
      $('#lbClose').addEventListener('click', closeLightbox);
      $('#lbPrev').addEventListener('click', function () { stepLightbox(-1); });
      $('#lbNext').addEventListener('click', function () { stepLightbox(1); });
      const thumbs = $('#lbThumbs');
      if (thumbs) {
        thumbs.addEventListener('click', function (e) {
          const thumb = e.target.closest('[data-lb-thumb]');
          if (!thumb) return;
          lb.index = parseInt(thumb.dataset.lbThumb, 10);
          updateLightbox();
        });
      }
      const enquire = $('#lbEnquire');
      if (enquire) {
        enquire.addEventListener('click', function () {
          const item = lb.items[lb.index];
          if (!item) return;
          N.openWhatsApp(N.t('wa.card', { item: item.caption }));
        });
      }
      box.addEventListener('click', function (e) {
        if (e.target === box || e.target.classList.contains('lightbox__stage') || e.target.classList.contains('lightbox__shade')) closeLightbox();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (!box || !box.classList.contains('is-open')) return;
      if (e.key === 'Escape') { e.preventDefault(); closeLightbox(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); stepLightbox(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); stepLightbox(-1); }
      if (e.key === 'Tab') {
        const f = $$('button, [href], input, [tabindex]:not([tabindex="-1"])', box).filter(function (el) { return el.offsetParent !== null; });
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    if (bubble && !touch && !reduce) {
      let mx = window.innerWidth / 2, my = window.innerHeight / 2;
      let bx = mx, by = my;
      let active = false;
      window.addEventListener('pointermove', function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
      tiles.forEach(function (tile) {
        tile.addEventListener('pointerenter', function () { active = true; bubble.classList.add('is-on'); });
        tile.addEventListener('pointerleave', function () { active = false; bubble.classList.remove('is-on'); });
      });
      (function loop() {
        bx += (mx - bx) * 0.2;
        by += (my - by) * 0.2;
        bubble.style.transform = 'translate3d(' + (bx - 44) + 'px,' + (by - 44) + 'px,0) scale(' + (active ? 1 : 0.45) + ')';
        requestAnimationFrame(loop);
      })();
    }

    N.onLang(function () {
      applyLookFilter(lb.filter, false);
      if (box && box.classList.contains('is-open')) {
        lb.items = looksData();
        updateLightbox();
      }
    });
  }

  /* ── footer wordmark ───────────────────────────────────────────────── */
  function initFooter() {
    if (!gsap || !window.ScrollTrigger || reduce) return;
    const mark = $('#footerMark');
    if (!mark) return;
    gsap.fromTo(mark, { yPercent: 30 }, {
      yPercent: -4,
      ease: 'none',
      scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: 0.8 }
    });
    gsap.fromTo('.footer__grid > *', { opacity: 0, y: 26 }, {
      opacity: 1, y: 0, duration: 1, stagger: 0.08, ease: 'power3.out',
      scrollTrigger: { trigger: '.footer__grid', start: 'top 92%', once: true }
    });
  }

  /* ── anchors + back to top ─────────────────────────────────────────── */
  function initAnchors() {
    document.addEventListener('click', function (e) {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      N.scrollTo(target);
    });
    const back = $('#backTop');
    if (back) {
      back.addEventListener('click', function () {
        if (state.lenis) state.lenis.scrollTo(0, { duration: 1.6 });
        else window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      });
    }
  }

  /* ── boot experience ───────────────────────────────────────────────── */
  N.onInit(function () {
    prepareHero();
    initScroll();
    initHeroMedia();
    initLoader();
    initCursor();
    initMagnetic();
    initScramble();
    /* the pinned rail adds a spacer to the document, so build it before
       any scroll-relative reveal measures its start position */
    initCollections();
    initRailInput();
    initSectionIndex();
    initReveals();
    splitStatement();
    initCards();
    initLookbook();
    initFooter();
    initAnchors();
    N.refresh();
    N.onLang(function () {
      prepareHero();
      splitStatement();
    });
  });
})();
