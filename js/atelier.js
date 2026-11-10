/* Noori Paradise — atelier layer
   Wishlist · colour studio · finder · testimonials · hours · overlays. */
(function () {
  'use strict';

  const N = window.Noor;
  if (!N) return;

  const { $, $$, t, state, CONFIG } = N;
  const reduce = N.reduce;
  const touch = N.touch;
  const WISH_KEY = 'np-wishlist';

  const studio = {
    style: 'lehenga',
    colour: 'ivory',
    fabric: 'satin',
    min: 12,
    max: 72
  };

  const finder = { occasion: '', mood: '', budget: '' };
  let wish = loadWish();
  let lastFocus = null;
  let drawerTimer = 0;
  let quoteIndex = 0;
  let quoteTimer = 0;

  /* ── helpers ───────────────────────────────────────────────────────── */
  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function focusables(root) {
    return $$('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])', root)
      .filter(function (el) { return el.offsetParent !== null; });
  }

  function trapFocus(e, root) {
    if (e.key !== 'Tab' || !root) return;
    const items = focusables(root);
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function priceVisible() {
    const range = CONFIG.priceRange || {};
    return typeof range.min === 'number' && isFinite(range.min) &&
      typeof range.max === 'number' && isFinite(range.max) && range.max > range.min;
  }

  function money(value) {
    const range = CONFIG.priceRange || {};
    const currency = range.currency === '₹' ? 'INR' : 'INR';
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 0
      }).format(value);
    } catch (e) {
      return String(value);
    }
  }

  function budgetLabel() {
    if (!priceVisible()) return t('studio.priceOnRequest');
    const range = CONFIG.priceRange;
    const lo = Math.round(range.min + (range.max - range.min) * (studio.min / 100));
    const hi = Math.round(range.min + (range.max - range.min) * (studio.max / 100));
    return money(lo) + ' – ' + money(hi);
  }

  function styleName(key) { return t('studio.styles.' + key); }
  function colourName(key) { return t('studio.colours.' + key); }
  function fabricName(key) { return t('studio.fabrics.' + key + '.name'); }

  /* ── look link + look card ─────────────────────────────────────────── */
  function lookParam() {
    return studio.style + '-' + studio.colour + '-' + studio.fabric;
  }

  function readLookFromURL() {
    try {
      const raw = new URLSearchParams(window.location.search).get('look');
      if (!raw || !window.NoorDress) return;
      const parts = raw.split('-');
      if (parts.length !== 3) return;
      if (window.NoorDress.styles.indexOf(parts[0]) > -1 &&
          window.NoorDress.colours[parts[1]] &&
          window.NoorDress.fabrics.indexOf(parts[2]) > -1) {
        studio.style = parts[0];
        studio.colour = parts[1];
        studio.fabric = parts[2];
      }
    } catch (e) {}
  }

  function syncLookURL() {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('look', lookParam());
      history.replaceState(null, '', url.pathname + url.search + url.hash);
    } catch (e) {}
  }

  function copyText(text) {
    function fallback() {
      return new Promise(function (resolve, reject) {
        const area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', '');
        area.style.cssText = 'position:fixed;top:-1000px;opacity:0';
        document.body.appendChild(area);
        area.select();
        try {
          document.execCommand('copy') ? resolve() : reject(new Error('copy'));
        } catch (e) {
          reject(e);
        }
        area.remove();
      });
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(fallback);
    }
    return fallback();
  }

  function downloadLookCard() {
    if (!window.NoorDress) return;
    const trigger = $('#studioCard');
    if (trigger && trigger.getAttribute('aria-busy') === 'true') return;
    if (trigger) {
      trigger.setAttribute('aria-busy', 'true');
      trigger.classList.add('is-busy');
    }
    N.toast(t('studio.cardPreparing'));
    const W = 1080;
    const H = 1350;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) { releaseCard(); return; }

    function releaseCard() {
      const btn = $('#studioCard');
      if (btn) {
        btn.removeAttribute('aria-busy');
        btn.classList.remove('is-busy');
      }
    }

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#1D0A11');
    bg.addColorStop(0.55, '#2A0F19');
    bg.addColorStop(1, '#4A1A2B');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(W / 2, H * 0.42, 10, W / 2, H * 0.42, W * 0.6);
    glow.addColorStop(0, 'rgba(255,222,180,.22)');
    glow.addColorStop(1, 'rgba(255,222,180,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(234,214,176,.34)';
    ctx.lineWidth = 2;
    ctx.strokeRect(46, 46, W - 92, H - 92);
    ctx.strokeStyle = 'rgba(234,214,176,.14)';
    ctx.lineWidth = 1;
    ctx.strokeRect(58, 58, W - 116, H - 116);

    const style = styleName(studio.style);
    const shade = colourName(studio.colour);
    const fabric = fabricName(studio.fabric);
    const price = budgetLabel();
    const note = t('studio.notes.' + studio.style);

    function finish() {
      ctx.textAlign = 'center';

      ctx.fillStyle = '#C9AE7C';
      ctx.font = '500 24px Georgia, "Times New Roman", serif';
      ctx.fillText('NOORI PARADISE', W / 2, 138);
      ctx.fillStyle = 'rgba(244,230,207,.55)';
      ctx.font = '400 17px Georgia, serif';
      ctx.fillText('T R I P L I C A N E   ·   C H E N N A I', W / 2, 172);

      ctx.strokeStyle = 'rgba(201,174,124,.4)';
      ctx.beginPath();
      ctx.moveTo(W / 2 - 42, 196);
      ctx.lineTo(W / 2 + 42, 196);
      ctx.stroke();

      ctx.fillStyle = '#F4E6CF';
      ctx.font = 'italic 62px Georgia, "Times New Roman", serif';
      ctx.fillText(style, W / 2, 1050);
      ctx.fillStyle = 'rgba(234,214,176,.8)';
      ctx.font = '400 24px Georgia, serif';
      ctx.fillText(shade + '  ·  ' + fabric, W / 2, 1094);

      ctx.fillStyle = 'rgba(244,230,207,.5)';
      ctx.font = '400 19px Georgia, serif';
      ctx.fillText(price, W / 2, 1136);

      ctx.fillStyle = 'rgba(244,230,207,.62)';
      ctx.font = 'italic 21px Georgia, serif';
      drawWrapped(ctx, note, W / 2, 1196, W - 220, 30);

      ctx.fillStyle = 'rgba(201,174,124,.6)';
      ctx.font = '400 15px Georgia, serif';
      ctx.fillText(t('studio.madeToMeasure'), W / 2, H - 92);

      canvas.toBlob(function (blob) {
        releaseCard();
        if (!blob) return;
        const link = document.createElement('a');
        const href = URL.createObjectURL(blob);
        link.href = href;
        link.download = 'noori-paradise-' + lookParam() + '.png';
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(function () { URL.revokeObjectURL(href); }, 3000);
        N.toast(t('studio.cardDone'));
      }, 'image/png');
    }

    const markup = window.NoorDress.svg(studio.style, studio.colour, studio.fabric)
      .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
    const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = function () {
      const drawH = 760;
      const drawW = drawH * (200 / 372);
      ctx.drawImage(img, (W - drawW) / 2, 236, drawW, drawH);
      URL.revokeObjectURL(url);
      finish();
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      finish();
    };
    img.src = url;
  }

  function drawWrapped(ctx, text, x, y, maxWidth, lineHeight) {
    const words = String(text).split(/\s+/);
    let line = '';
    let offset = 0;
    words.forEach(function (word) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, y + offset);
        line = word;
        offset += lineHeight;
      } else {
        line = test;
      }
    });
    if (line) ctx.fillText(line, x, y + offset);
  }

  function updateStylingNote(animate) {
    const host = $('#studioNote');
    const text = $('#studioNoteText');
    if (text) text.textContent = t('studio.notes.' + studio.style);
    if (host && animate && !reduce) {
      host.classList.remove('pop');
      void host.offsetWidth;
      host.classList.add('pop');
    }
  }

  /* ── wishlist storage ──────────────────────────────────────────────── */
  function loadWish() {
    try {
      const raw = JSON.parse(localStorage.getItem(WISH_KEY) || '[]');
      if (!Array.isArray(raw)) return [];
      return raw.filter(function (item) {
        return item && window.NoorDress &&
          window.NoorDress.styles.indexOf(item.style) > -1 &&
          window.NoorDress.colours[item.colour] &&
          window.NoorDress.fabrics.indexOf(item.fabric) > -1;
      }).slice(0, 24);
    } catch (e) {
      return [];
    }
  }

  function persistWish() {
    try { localStorage.setItem(WISH_KEY, JSON.stringify(wish)); } catch (e) {}
  }

  function wishKey(item) {
    return item.style + '|' + item.colour + '|' + item.fabric;
  }

  function hasWish(item) {
    return wish.some(function (w) { return wishKey(w) === wishKey(item); });
  }

  function wishCount() {
    const count = $('#wishCount');
    const btn = $('#wishOpen');
    if (count) count.textContent = String(wish.length);
    if (btn) {
      btn.classList.toggle('has-items', wish.length > 0);
      btn.setAttribute('aria-label', t('a11y.wishlist') + ' · ' + wish.length);
    }
  }

  function itemTitle(item) {
    return styleName(item.style);
  }

  function itemMeta(item) {
    return colourName(item.colour) + ' · ' + fabricName(item.fabric);
  }

  function renderWish() {
    const body = $('#wishBody');
    if (!body) return;
    if (!wish.length) {
      body.innerHTML = '<p class="wish-empty">' + esc(t('wish.empty')) + '</p>';
    } else {
      body.innerHTML = wish.map(function (item, i) {
        const svg = window.NoorDress ? window.NoorDress.svg(item.style, item.colour, item.fabric) : '';
        return '<article class="wish-item">' +
          '<div class="wish-item__thumb">' + svg + '</div>' +
          '<div class="wish-item__info">' +
            '<b>' + esc(itemTitle(item)) + '</b>' +
            '<p>' + esc(itemMeta(item)) + '</p>' +
            '<span class="wish-item__price">' + esc(t('col.onrequest')) + '</span>' +
          '</div>' +
          '<button class="wish-item__remove" type="button" data-wish-remove="' + i + '" aria-label="' + esc(t('wish.clear')) + '">&times;</button>' +
          '</article>';
      }).join('');
    }
    wishCount();
    syncStudioSave();
  }

  function addWish(item) {
    if (hasWish(item)) {
      N.toast(t('toast.added'));
      syncStudioSave();
      return;
    }
    wish.unshift({ style: item.style, colour: item.colour, fabric: item.fabric });
    wish = wish.slice(0, 24);
    persistWish();
    renderWish();
    N.toast(t('toast.added'));
  }

  function removeWish(index) {
    if (!wish[index]) return;
    wish.splice(index, 1);
    persistWish();
    renderWish();
    N.toast(t('toast.removed'));
  }

  function syncStudioSave() {
    const btn = $('#studioSave');
    if (!btn) return;
    const saved = hasWish(studio);
    btn.classList.toggle('is-saved', saved);
    btn.setAttribute('aria-pressed', saved ? 'true' : 'false');
    const label = btn.querySelector('[data-i18n]');
    if (label) label.textContent = saved ? t('studio.saved') : t('studio.save');
  }

  /* ── drawer ────────────────────────────────────────────────────────── */
  function openDrawer() {
    const drawer = $('#wishDrawer');
    const scrim = $('#scrim');
    if (!drawer) return;
    renderWish();
    lastFocus = document.activeElement;
    clearTimeout(drawerTimer);
    if (scrim) {
      scrim.hidden = false;
      requestAnimationFrame(function () { scrim.classList.add('is-on'); });
    }
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    drawer.inert = false;
    N.lock(true);
    setTimeout(function () {
      const close = $('#wishClose');
      if (close) close.focus();
    }, 140);
  }

  function closeDrawer() {
    const drawer = $('#wishDrawer');
    const scrim = $('#scrim');
    if (!drawer || !drawer.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.inert = true;
    N.lock(false);
    if (scrim) {
      scrim.classList.remove('is-on');
      drawerTimer = setTimeout(function () { scrim.hidden = true; }, 460);
    }
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  function wishSummary() {
    return wish.map(function (item) {
      return itemTitle(item) + ' — ' + itemMeta(item);
    }).join('; ');
  }

  /* ── colour studio ─────────────────────────────────────────────────── */
  function buildStyleChips() {
    const wrap = $('#styleChips');
    if (!wrap) return;
    wrap.innerHTML = window.NoorDress ? window.NoorDress.styles.map(function (key) {
      return '<button type="button" data-style="' + key + '" aria-pressed="' + (studio.style === key) + '">' + esc(styleName(key)) + '</button>';
    }).join('') : '';
  }

  function buildFabricChips() {
    const wrap = $('#fabricChips');
    if (!wrap) return;
    wrap.innerHTML = window.NoorDress ? window.NoorDress.fabrics.map(function (key) {
      return '<button class="fabric" type="button" data-fabric="' + key + '" aria-pressed="' + (studio.fabric === key) + '">' +
        '<span class="fabric__swatch" aria-hidden="true"></span>' +
        '<span class="fabric__meta"><b>' + esc(fabricName(key)) + '</b><span>' + esc(t('studio.fabrics.' + key + '.desc')) + '</span></span>' +
        '</button>';
    }).join('') : '';
  }

  function buildSwatches() {
    const wrap = $('#shadeChips');
    if (!wrap || !window.NoorDress) return;
    wrap.innerHTML = Object.keys(window.NoorDress.colours).map(function (key) {
      return '<button class="swatch" type="button" data-colour="' + key + '" aria-pressed="' + (studio.colour === key) + '" ' +
        'aria-label="' + esc(colourName(key)) + '" title="' + esc(colourName(key)) + '" ' +
        'style="background:' + window.NoorDress.colours[key].swatch + '"></button>';
    }).join('');
  }

  function updateRange() {
    const minInput = $('#priceMin');
    const maxInput = $('#priceMax');
    const fill = $('#rangeFill');
    const value = $('#budgetValue');
    if (minInput) minInput.value = studio.min;
    if (maxInput) maxInput.value = studio.max;
    if (fill) {
      fill.style.marginInlineStart = studio.min + '%';
      fill.style.width = Math.max(0, studio.max - studio.min) + '%';
    }
    if (minInput && maxInput) {
      minInput.style.zIndex = studio.min > 88 ? '5' : '3';
      maxInput.style.zIndex = '4';
    }
    if (value) value.textContent = budgetLabel();
  }

  function renderStudio(animate) {
    const stage = $('#studioStage');
    const host = $('#studioDress');
    const code = $('#studioCode');
    const shade = $('#shadeName');
    if (shade) shade.textContent = colourName(studio.colour);
    if (code) {
      code.textContent = 'NP · ' + styleName(studio.style) + ' · ' + fabricName(studio.fabric) + ' · ' + colourName(studio.colour);
    }
    if (stage) stage.dataset.fabric = studio.fabric;
    if (host && window.NoorDress) {
      host.innerHTML = window.NoorDress.svg(studio.style, studio.colour, studio.fabric);
      if (animate && window.gsap && !reduce) {
        gsap.fromTo(host.firstElementChild,
          { opacity: 0, y: 12, scale: 0.97 },
          { opacity: 1, y: 0, scale: 1, duration: 0.65, ease: 'power3.out' });
      }
    }
    syncStudioSave();
    updateStylingNote(animate);
    updateRange();
  }

  function syncStudioPressed() {
    $$('#styleChips [data-style]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.style === studio.style ? 'true' : 'false');
    });
    $$('#fabricChips [data-fabric]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.fabric === studio.fabric ? 'true' : 'false');
    });
    $$('#shadeChips [data-colour]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.colour === studio.colour ? 'true' : 'false');
    });
  }

  function initStudio() {
    readLookFromURL();
    buildStyleChips();
    buildFabricChips();
    buildSwatches();
    renderStudio(false);

    const styleWrap = $('#styleChips');
    if (styleWrap) {
      styleWrap.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-style]');
        if (!btn) return;
        studio.style = btn.dataset.style;
        syncStudioPressed();
        renderStudio(true);
        syncLookURL();
      });
    }

    const fabricWrap = $('#fabricChips');
    if (fabricWrap) {
      fabricWrap.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-fabric]');
        if (!btn) return;
        studio.fabric = btn.dataset.fabric;
        syncStudioPressed();
        renderStudio(true);
        syncLookURL();
      });
    }

    const shadeWrap = $('#shadeChips');
    if (shadeWrap) {
      shadeWrap.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-colour]');
        if (!btn) return;
        studio.colour = btn.dataset.colour;
        syncStudioPressed();
        renderStudio(true);
        syncLookURL();
      });
    }

    const minInput = $('#priceMin');
    const maxInput = $('#priceMax');
    if (minInput) {
      minInput.addEventListener('input', function () {
        studio.min = Math.min(parseInt(minInput.value, 10), studio.max - 4);
        if (studio.min < 0) studio.min = 0;
        updateRange();
      });
    }
    if (maxInput) {
      maxInput.addEventListener('input', function () {
        studio.max = Math.max(parseInt(maxInput.value, 10), studio.min + 4);
        if (studio.max > 100) studio.max = 100;
        updateRange();
      });
    }

    const save = $('#studioSave');
    if (save) {
      save.addEventListener('click', function () {
        addWish({ style: studio.style, colour: studio.colour, fabric: studio.fabric });
      });
    }

    const enquire = $('#studioEnquire');
    if (enquire) {
      enquire.addEventListener('click', function () {
        N.openWhatsApp(t('wa.studio', {
          style: styleName(studio.style),
          shade: colourName(studio.colour),
          fabric: fabricName(studio.fabric),
          budget: budgetLabel()
        }));
      });
    }

    const share = $('#studioShare');
    if (share) {
      share.addEventListener('click', function () {
        syncLookURL();
        copyText(window.location.href).then(function () {
          N.toast(t('studio.copied'));
        }).catch(function () {
          N.toast(t('studio.copyFail'));
        });
      });
    }

    const card = $('#studioCard');
    if (card) {
      card.addEventListener('click', downloadLookCard);
    }
  }

  /* ── find your look ────────────────────────────────────────────────── */
  function finderStyle() {
    const occ = finder.occasion;
    let key = occ === 'wedding' ? 'bridal' : occ === 'festival' ? 'anarkali' : occ === 'party' ? 'gown' : 'salwar';
    if (finder.mood === 'modest') key = 'abaya';
    else if (finder.mood === 'statement' && occ !== 'wedding') key = 'gown';
    if (finder.budget === 'high' && occ !== 'everyday' && finder.mood !== 'modest') key = 'bridal';
    if (finder.budget === 'low') key = occ === 'everyday' ? 'kurti' : 'salwar';
    return key;
  }

  function finderColour() {
    return finder.occasion === 'wedding' ? 'mulberry' :
      finder.occasion === 'festival' ? 'champagne' :
        finder.occasion === 'party' ? 'onyx' : 'rose';
  }

  function finderDressKey(colKey) {
    return { 'col.01': 'lehenga', 'col.02': 'anarkali', 'col.03': 'gown', 'col.04': 'abaya', 'col.05': 'salwar', 'col.06': 'kurti' }[colKey];
  }

  function finderBudgetLabel() {
    return finder.budget === 'low' ? t('finder.q3.a1') :
      finder.budget === 'high' ? t('finder.q3.a3') : t('finder.q3.a2');
  }

  function renderFinder() {
    const host = $('#finderResult');
    if (!host) return;
    if (!finder.occasion || !finder.mood || !finder.budget) {
      host.classList.remove('is-result', 'pop');
      host.innerHTML = '<p class="finder__empty">' + esc(t('finder.empty')) + '</p>';
      return;
    }

    const colKey = { bridal: 'col.01', anarkali: 'col.02', gown: 'col.03', abaya: 'col.04', salwar: 'col.05', kurti: 'col.06' }[finderStyle()];
    const dressKey = finderDressKey(colKey);
    const art = window.NoorDress ? window.NoorDress.svg(dressKey, finderColour(), 'satin') : '';
    host.classList.add('is-result');
    host.innerHTML =
      '<div class="fr__dress" aria-hidden="true">' + art + '</div>' +
      '<p class="fr__meta">Noori Paradise · ' + esc(t('finder.label')) + '</p>' +
      '<h3>' + esc(t(colKey + '.name')) + '</h3>' +
      '<p>' + esc(t(colKey + '.desc')) + '</p>' +
      '<p class="fr__meta">' + esc(t('finder.resultNote', { budget: finderBudgetLabel() })) + '</p>' +
      '<button class="btn btn--ghost magnetic" type="button" id="finderAsk">' +
        '<span>' + esc(t('finder.cta')) + '</span><i class="btn__arrow" aria-hidden="true">↗</i></button>';

    const ask = $('#finderAsk');
    if (ask) {
      ask.addEventListener('click', function () {
        N.openWhatsApp(t('wa.finder', { item: t(colKey + '.name') }));
      });
      if (window.gsap && !reduce) {
        gsap.fromTo(ask, { y: 6, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, delay: 0.15, ease: 'power3.out' });
      }
    }

    if (window.gsap && !reduce) {
      host.classList.remove('pop');
      void host.offsetWidth;
      host.classList.add('pop');
    }
  }

  function initFinder() {
    $$('.options').forEach(function (group) {
      group.addEventListener('click', function (e) {
        const btn = e.target.closest('.option');
        if (!btn) return;
        const name = group.dataset.group;
        finder[name] = btn.dataset.value;
        $$('.option', group).forEach(function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        renderFinder();
      });
    });
  }

  /* ── testimonials ──────────────────────────────────────────────────── */
  function quotes() { return $$('.quote'); }

  function showQuote(index) {
    const items = quotes();
    if (!items.length) return;
    quoteIndex = (index + items.length) % items.length;
    items.forEach(function (q, i) {
      q.classList.toggle('is-active', i === quoteIndex);
      q.setAttribute('aria-hidden', i === quoteIndex ? 'false' : 'true');
    });
    $$('#quoteDots button').forEach(function (dot, i) {
      dot.setAttribute('aria-pressed', i === quoteIndex ? 'true' : 'false');
    });
  }

  function buildDots() {
    const wrap = $('#quoteDots');
    const items = quotes();
    if (!wrap || !items.length) return;
    wrap.innerHTML = items.map(function (q, i) {
      return '<button type="button" aria-pressed="' + (i === 0) + '" aria-label="' + esc(t('social.label') + ' ' + (i + 1)) + '"></button>';
    }).join('');
  }

  function initDots() {
    const wrap = $('#quoteDots');
    if (!wrap || wrap.dataset.bound) return;
    wrap.dataset.bound = '1';
    wrap.addEventListener('click', function (e) {
      const dot = e.target.closest('button');
      if (!dot) return;
      showQuote($$('#quoteDots button').indexOf(dot));
      restartQuotes();
    });
  }

  function restartQuotes() {
    clearInterval(quoteTimer);
    if (reduce) return;
    quoteTimer = setInterval(function () {
      if (document.hidden) return;
      showQuote(quoteIndex + 1);
    }, 7600);
  }

  function initTestimonials() {
    initDots();
    buildDots();
    showQuote(0);
    const prev = $('#quotePrev');
    const next = $('#quoteNext');
    if (prev) prev.addEventListener('click', function () { showQuote(quoteIndex - 1); restartQuotes(); });
    if (next) next.addEventListener('click', function () { showQuote(quoteIndex + 1); restartQuotes(); });
    const box = $('#testimonials');
    if (box) {
      box.addEventListener('pointerenter', function () { clearInterval(quoteTimer); });
      box.addEventListener('pointerleave', restartQuotes);
      box.addEventListener('focusin', function () { clearInterval(quoteTimer); });
      box.addEventListener('focusout', restartQuotes);
    }
    restartQuotes();
  }

  /* ── size guide modal ──────────────────────────────────────────────── */
  function openSize() {
    const modal = $('#sizeModal');
    if (!modal) return;
    lastFocus = document.activeElement;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    N.lock(true);
    setTimeout(function () {
      const close = $('#sizeClose');
      if (close) close.focus();
    }, 120);
  }

  function closeSize() {
    const modal = $('#sizeModal');
    if (!modal || !modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    N.lock(false);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  function initSize() {
    ['sizeOpen', 'footerSize'].forEach(function (id) {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openSize();
      });
    });
    const close = $('#sizeClose');
    if (close) close.addEventListener('click', closeSize);
    const modal = $('#sizeModal');
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeSize();
      });
    }
  }

  /* ── book a fitting ────────────────────────────────────────────────── */
  function openBook(prefillNote, focusBack) {
    const modal = $('#bookModal');
    if (!modal) return;
    lastFocus = focusBack || document.activeElement;
    const note = $('#bookNote');
    if (note) note.value = prefillNote || '';
    const date = $('#bookDate');
    if (date) {
      const now = new Date();
      const iso = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
      date.min = iso;
      if (!date.value) date.value = iso;
    }
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    N.lock(true);
    focusFirstBook(0);
  }

  function focusFirstBook(attempt) {
    const first = $('#bookName');
    if (!first) return;
    first.focus({ preventScroll: true });
    if (document.activeElement !== first && attempt < 6) {
      setTimeout(function () { focusFirstBook(attempt + 1); }, 80);
    }
  }

  function closeBook() {
    const modal = $('#bookModal');
    if (!modal || !modal.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    N.lock(false);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  function initBook() {
    const open = $('#bookOpen');
    if (open) open.addEventListener('click', function () { openBook(''); });

    const plan = $('#wishPlan');
    if (plan) {
      plan.addEventListener('click', function () {
        if (!wish.length) { N.toast(t('toast.wishEmpty')); return; }
        const items = wishSummary();
        closeDrawer();
        setTimeout(function () { openBook(items, $('#wishOpen')); }, 240);
      });
    }

    const close = $('#bookClose');
    if (close) close.addEventListener('click', closeBook);
    const modal = $('#bookModal');
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeBook();
      });
    }

    const form = $('#bookForm');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const nameEl = $('#bookName');
        const dateEl = $('#bookDate');
        const timeEl = $('#bookTime');
        const phoneEl = $('#bookPhone');
        const noteEl = $('#bookNote');
        const occEl = $('#bookOccasion');
        const name = nameEl ? nameEl.value.trim() : '';
        const date = dateEl ? dateEl.value : '';
        const time = timeEl ? timeEl.value : '';
        if (!name || !date || !time) {
          N.toast(t('book.missing'));
          const target = !name ? nameEl : !date ? dateEl : timeEl;
          if (target) target.focus();
          return;
        }
        const occasion = occEl && occEl.selectedIndex > -1 ? occEl.options[occEl.selectedIndex].text : '';
        N.openWhatsApp(t('book.wa', {
          name: name,
          date: date,
          time: time,
          occasion: occasion,
          phone: (phoneEl && phoneEl.value.trim()) || '—',
          note: (noteEl && noteEl.value.trim()) || '—'
        }));
        N.toast(t('book.ready'));
        setTimeout(closeBook, 700);
      });
    }
  }

  function updateClock() {
    const el = $('#chennaiTime');
    if (!el) return;
    try {
      el.textContent = new Intl.DateTimeFormat('en-GB', {
        timeZone: (CONFIG.hours && CONFIG.hours.timezone) || 'Asia/Kolkata',
        hour: '2-digit', minute: '2-digit', hour12: false
      }).format(new Date());
    } catch (e) {
      el.textContent = '--:--';
    }
  }

  /* ── mobile menu ───────────────────────────────────────────────────── */
  function openMenu() {
    const menu = $('#mobileMenu');
    const btn = $('#menuOpen');
    if (!menu) return;
    lastFocus = document.activeElement;
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    if (btn) btn.setAttribute('aria-expanded', 'true');
    N.lock(true);
    setTimeout(function () {
      const close = $('#menuClose');
      if (close) close.focus();
    }, 120);
  }

  function closeMenu() {
    const menu = $('#mobileMenu');
    const btn = $('#menuOpen');
    if (!menu || !menu.classList.contains('is-open')) return;
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    N.lock(false);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  function initMenu() {
    const open = $('#menuOpen');
    const close = $('#menuClose');
    if (open) open.addEventListener('click', openMenu);
    if (close) close.addEventListener('click', closeMenu);
    $$('#mobileMenu a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function () { closeMenu(); });
    });
    const menu = $('#mobileMenu');
    if (menu) {
      menu.addEventListener('click', function (e) {
        if (e.target === menu) closeMenu();
      });
    }
  }

  /* ── hours, status, countdown ──────────────────────────────────────── */
  function buildHours() {
    const list = $('#hoursList');
    if (!list) return;
    const clock = N.getOpenState();
    list.innerHTML = N.DAY_ORDER.map(function (day) {
      const slot = (CONFIG.hours && CONFIG.hours[day]) || ['', ''];
      const time = N.dayTimeLabel(slot[0], slot[1]);
      return '<li class="' + (day === clock.day ? 'is-today' : '') + '">' +
        '<span>' + esc(t('days.' + day)) + '</span><span>' + esc(time) + '</span></li>';
    }).join('');
  }

  function updateStatus() {
    const info = N.getOpenState();
    ['openStatus', 'visitStatus'].forEach(function (id) {
      const el = document.getElementById(id);
      if (!el) return;
      el.dataset.state = info.state;
      const text = el.querySelector('span');
      if (!text) return;
      if (info.state === 'open') {
        text.textContent = id === 'visitStatus' && info.until
          ? t('status.open') + ' · ' + t('status.until', { time: info.until })
          : t('status.open');
      } else if (info.state === 'closed') {
        text.textContent = t('status.closed');
      } else {
        text.textContent = t('status.unknown');
      }
    });
  }

  function pad(n) { return String(n).padStart(2, '0'); }

  function updateCountdown() {
    const next = N.nextFestival();
    const name = $('#festivalName');
    const days = $('#cdDays');
    const hours = $('#cdHours');
    const mins = $('#cdMins');
    const secs = $('#cdSecs');
    if (!next) {
      if (name) name.textContent = t('countdown.nextSeason');
      [days, hours, mins, secs].forEach(function (el) { if (el) el.textContent = '--'; });
      return;
    }
    if (name) name.textContent = (next.f.name && (next.f.name[state.lang] || next.f.name.en)) || next.f.key;
    const diff = Math.max(0, next.ts - Date.now());
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    if (days) days.textContent = String(d).padStart(2, '0');
    if (hours) hours.textContent = pad(h);
    if (mins) mins.textContent = pad(m);
    if (secs) secs.textContent = pad(s);
  }

  /* ── occasion peek ─────────────────────────────────────────────────── */
  function initOccasions() {
    const peek = $('#occPeek');
    const list = $('#occList');
    if (!peek || !list || touch || reduce) return;
    const img = peek.querySelector('img');
    list.addEventListener('pointerenter', function () {
      peek.classList.add('is-on');
    }, true);
    list.addEventListener('pointerleave', function () {
      peek.classList.remove('is-on');
    });
    list.addEventListener('pointerover', function (e) {
      const row = e.target.closest('.occ__row');
      if (!row) return;
      const src = row.dataset.preview;
      if (src && img) img.src = src;
      peek.classList.add('is-on');
    });
    list.addEventListener('pointermove', function (e) {
      peek.style.left = (e.clientX + 36) + 'px';
      peek.style.top = (e.clientY - 20) + 'px';
    }, { passive: true });
  }

  /* ── links ─────────────────────────────────────────────────────────── */
  function initLinks() {
    const insta = CONFIG.instagram || 'https://instagram.com/';
    const handle = $('#social .ig-handle span:last-child');
    if (handle) handle.textContent = String(CONFIG.handle || '').replace(/^@/, '');
    $$('.ig-tile, .ig-handle').forEach(function (a) {
      a.href = insta;
      a.target = '_blank';
      a.rel = 'noopener';
    });
    $$('.footer__col a[href="https://instagram.com/"]').forEach(function (a) {
      a.href = insta;
    });

    const visit = $('#visitWhats');
    const mobile = $('#mobileWhats');
    const footer = $('#footerWhats');
    const size = $('#sizeWhats');

    function wire(link, text) {
      if (!link) return;
      link.href = N.waLink(text);
      link.target = '_blank';
      link.rel = 'noopener';
      link.addEventListener('click', function () {
        if (!N.waNumber()) N.toast(t('toast.demo'));
      });
    }
    wire(visit, t('wa.visit'));
    wire(mobile, t('wa.visit'));
    wire(footer, t('wa.visit'));
    wire(size, t('wa.size'));

    const faqLink = $('#faqWhats');
    if (faqLink) {
      faqLink.href = N.waLink(t('wa.faq'));
      faqLink.target = '_blank';
      faqLink.rel = 'noopener';
      faqLink.addEventListener('click', function () {
        if (!N.waNumber()) N.toast(t('toast.demo'));
      });
    }

    const wishAsk = $('#wishEnquire');
    if (wishAsk) {
      wishAsk.addEventListener('click', function () {
        if (!wish.length) { N.toast(t('toast.wishEmpty')); return; }
        N.openWhatsApp(t('wa.wish', { items: wishSummary() }));
      });
    }

    const clear = $('#wishClear');
    if (clear) {
      clear.addEventListener('click', function () {
        if (!wish.length) return;
        wish = [];
        persistWish();
        renderWish();
        N.toast(t('toast.cleared'));
      });
    }
  }

  /* ── overlays: shared keys ─────────────────────────────────────────── */
  function initOverlayKeys() {
    document.addEventListener('keydown', function (e) {
      const size = $('#sizeModal');
      const book = $('#bookModal');
      const drawer = $('#wishDrawer');
      const menu = $('#mobileMenu');
      const openSize = size && size.classList.contains('is-open');
      const openBookModal = book && book.classList.contains('is-open');
      const openDrawer = drawer && drawer.classList.contains('is-open');
      const openMenu = menu && menu.classList.contains('is-open');

      if (e.key === 'Escape') {
        if (openSize) { e.preventDefault(); closeSize(); return; }
        if (openBookModal) { e.preventDefault(); closeBook(); return; }
        if (openDrawer) { e.preventDefault(); closeDrawer(); return; }
        if (openMenu) { e.preventDefault(); closeMenu(); return; }
      }
      if (openSize) trapFocus(e, size);
      else if (openBookModal) trapFocus(e, book);
      else if (openDrawer) trapFocus(e, drawer);
      else if (openMenu) trapFocus(e, menu);
    });
  }

  /* ── language refresh ──────────────────────────────────────────────── */
  function refreshText() {
    if (window.NoorDress) {
      buildStyleChips();
      buildFabricChips();
      buildSwatches();
      syncStudioPressed();
      renderStudio(false);
    }
    renderWish();
    renderFinder();
    buildHours();
    updateStatus();
    updateCountdown();
    const dots = $('#quoteDots');
    if (dots) {
      const current = quoteIndex;
      buildDots();
      showQuote(current);
    }
    initLinksStaticText();
    if (!reduce) {
      document.body.classList.remove('lang-morph');
      void document.body.offsetWidth;
      document.body.classList.add('lang-morph');
      setTimeout(function () { document.body.classList.remove('lang-morph'); }, 620);
    }
  }

  /* Text-only links whose labels live in markup but hrefs carry language. */
  function initLinksStaticText() {
    const visit = $('#visitWhats');
    const mobile = $('#mobileWhats');
    const footer = $('#footerWhats');
    const size = $('#sizeWhats');
    if (visit) visit.href = N.waLink(t('wa.visit'));
    if (mobile) mobile.href = N.waLink(t('wa.visit'));
    if (footer) footer.href = N.waLink(t('wa.visit'));
    if (size) size.href = N.waLink(t('wa.size'));
    const faqLink = $('#faqWhats');
    if (faqLink) faqLink.href = N.waLink(t('wa.faq'));
  }

  /* ── boot ──────────────────────────────────────────────────────────── */
  N.onInit(function () {
    renderWish();
    initStudio();
    initFinder();
    initTestimonials();
    initSize();
    initBook();
    initMenu();
    initOccasions();
    initLinks();
    initOverlayKeys();
    buildHours();
    updateStatus();
    updateCountdown();
    updateClock();
    setInterval(updateCountdown, 1000);
    setInterval(updateStatus, 60000);
    setInterval(updateClock, 15000);

    const open = $('#wishOpen');
    if (open) open.addEventListener('click', openDrawer);
    const close = $('#wishClose');
    if (close) close.addEventListener('click', closeDrawer);
    const scrim = $('#scrim');
    if (scrim) scrim.addEventListener('click', closeDrawer);

    const body = $('#wishBody');
    if (body) {
      body.addEventListener('click', function (e) {
        const btn = e.target.closest('[data-wish-remove]');
        if (!btn) return;
        removeWish(parseInt(btn.dataset.wishRemove, 10));
      });
    }

    N.onLang(refreshText);
  });
})();
