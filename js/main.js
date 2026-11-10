/* ==========================================================================
   NOORI PARADISE — main application
   ─────────────────────────────────────────────────────────────────────────
   OWNER: everything you need to supply lives in the CONFIG block below.
   Search for "OWNER". Nothing here is a real phone number, price, opening
   hour or customer review.
   ========================================================================== */

'use strict';

const CONFIG = {
  brand: 'Noori Paradise',

  /* OWNER — WhatsApp number, country code first, digits only.
     Example: '919876543210'. While it contains an X the demo opens
     WhatsApp's contact picker with the message already written. */
  whatsapp: '91XXXXXXXXXX',

  /* OWNER — phone and email shown in the footer. */
  phone: '+91 XXXXX XXXXX',
  email: 'hello@example.com',

  /* OWNER — Instagram profile URL and handle. */
  instagram: 'https://instagram.com/',
  handle: '@placeholder_handle',

  /* OWNER — opening hours, 24-hour "HH:MM", timezone Asia/Kolkata.
     Leave a day as ['',''] until confirmed: the badge will say
     "Hours in store" rather than guess. Example: mon: ['10:00','21:00']. */
  hours: {
    timezone: 'Asia/Kolkata',
    mon: ['', ''],
    tue: ['', ''],
    wed: ['', ''],
    thu: ['', ''],
    fri: ['', ''],
    sat: ['', ''],
    sun: ['', '']
  },

  /* OWNER — budget slider range. Set real figures (e.g. 1500 / 30000).
     Until then the slider reads "Price on request" — no invented prices. */
  priceRange: { currency: '₹', min: null, max: null },

  /* OWNER — festival countdown dates (demo dates) and display names.
     Offers are deliberately vague; no discount is invented. */
  festivals: [
    { key: 'diwali', date: '2026-11-08T00:00:00+05:30', name: { en: 'Diwali', ta: 'தீபாவளி', ur: 'دیوالی' } },
    { key: 'pongal', date: '2027-01-15T00:00:00+05:30', name: { en: 'Pongal', ta: 'பொங்கல்', ur: 'پونگل' } },
    { key: 'eid', date: '2027-03-20T00:00:00+05:30', name: { en: 'Eid al-Fitr', ta: 'ஈத் அல்-ஃபித்ர்', ur: 'عید الفطر' } }
  ],

  mapsQuery: 'Noori Paradise Triplicane High Rd Chennai 600005',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Noori+Paradise+Triplicane+High+Rd+Chennai+600005'
};

(function () {
  const I18N = window.NOOR_I18N || { en: {} };
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const state = {
    lang: 'en',
    reduce,
    touch,
    loading: true,
    inited: false,
    gsap: !!window.gsap,
    lenis: null,
    locks: 0
  };

  /* ── translation helpers ───────────────────────────────────────────── */
  function t(key, vars) {
    const dict = I18N[state.lang] || I18N.en || {};
    let out = dict[key];
    if (out == null) out = (I18N.en && I18N.en[key]) || key;
    if (vars) {
      Object.keys(vars).forEach(function (k) {
        out = out.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
      });
    }
    return out;
  }

  function applyStatic() {
    $$('[data-i18n]').forEach(function (el) {
      let value = t(el.dataset.i18n);
      if (el.dataset.i18nVars) {
        try {
          const vars = JSON.parse(el.dataset.i18nVars);
          Object.keys(vars).forEach(function (k) {
            value = value.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
          });
        } catch (e) {}
      }
      if (value != null) el.textContent = value;
    });
    $$('[data-i18n-aria]').forEach(function (el) {
      el.setAttribute('aria-label', t(el.dataset.i18nAria));
    });
    /* brand-adjacent bits that are not tagged in the markup */
    const titleMap = {
      en: 'Noori Paradise — Dress Atelier, Triplicane, Chennai',
      ta: 'நூரி பாரடைஸ் — ஆடை அட்லியர், திருவல்லிக்கேணி, சென்னை',
      ur: 'نوری پیراڈائز — لباس اٹلیئر، تریپلیکین، چنئی'
    };
    document.title = titleMap[state.lang] || titleMap.en;
    $$('.lang').forEach(function (b) {
      const on = b.dataset.lang === state.lang;
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function updateLanguageChrome() {
    const doc = document.documentElement;
    doc.lang = state.lang;
    doc.dir = state.lang === 'ur' ? 'rtl' : 'ltr';
    doc.dataset.lang = state.lang;
    $$('.lang').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.lang === state.lang ? 'true' : 'false');
    });
  }

  const FONT_LINKS = {
    ta: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@300;400;500&family=Noto+Serif+Tamil:wght@400;500&display=swap',
    ur: 'https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500&family=Noto+Nastaliq+Urdu:wght@400;500&display=swap'
  };
  const fontsLoaded = {};

  function ensureFont(lang) {
    if (lang === 'en' || fontsLoaded[lang]) return Promise.resolve();
    fontsLoaded[lang] = true;
    return new Promise(function (resolve) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = FONT_LINKS[lang];
      link.onload = resolve;
      link.onerror = resolve;
      document.head.appendChild(link);
      setTimeout(resolve, 2600);
    });
  }

  const initFns = [];
  const langFns = [];

  function onInit(fn) {
    if (state.inited) { try { fn(); } catch (e) { console.error(e); } }
    else initFns.push(fn);
  }
  function onLang(fn) { langFns.push(fn); }

  function applyLanguage() {
    updateLanguageChrome();
    applyStatic();
    langFns.forEach(function (fn) {
      try { fn(); } catch (e) { console.error('lang module', e); }
    });
    if (window.ScrollTrigger) {
      setTimeout(function () {
        if (window.ScrollTrigger) ScrollTrigger.refresh();
        if (state.lenis) state.lenis.resize();
      }, 90);
    }
  }

  function setLang(next, opts) {
    if (!I18N[next]) return;
    if (next === state.lang && !(opts && opts.force)) return;
    const run = function () {
      state.lang = next;
      try { localStorage.setItem('np-lang', next); } catch (e) {}
      updateLanguageChrome();
      applyStatic();
      langFns.forEach(function (fn) {
        try { fn(); } catch (e) { console.error('lang module', e); }
      });
      if (window.ScrollTrigger) {
        setTimeout(function () {
          ScrollTrigger.refresh();
          if (state.lenis) state.lenis.resize();
        }, 100);
      }
    };

    ensureFont(next).then(function () {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
          run();
          setTimeout(function () { if (window.ScrollTrigger) ScrollTrigger.refresh(); }, 80);
        });
      } else {
        run();
      }
    });
  }

  /* ── scroll locking ───────────────────────────────────────────────── */
  function lock(on) {
    if (on) state.locks += 1;
    else state.locks = Math.max(0, state.locks - 1);
    const shouldLock = state.locks > 0 || state.loading;
    document.body.classList.toggle('is-locked', state.locks > 0);
    if (!state.lenis) return;
    if (shouldLock) state.lenis.stop();
    else state.lenis.start();
  }

  function scrollToTarget(target) {
    const el = typeof target === 'string' ? $(target) : target;
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 64;
    if (state.lenis) state.lenis.scrollTo(y, { duration: 1.35 });
    else window.scrollTo({ top: y, behavior: state.reduce ? 'auto' : 'smooth' });
  }

  /* ── WhatsApp ─────────────────────────────────────────────────────── */
  function waNumber() {
    const raw = String(CONFIG.whatsapp || '').trim();
    const digits = raw.replace(/[^\d]/g, '');
    return /x/i.test(raw) || digits.length < 8 ? '' : digits;
  }
  function waLink(text) {
    const n = waNumber();
    const body = encodeURIComponent(text);
    return n ? 'https://wa.me/' + n + '?text=' + body : 'https://wa.me/?text=' + body;
  }
  function openWhatsApp(text) {
    if (!waNumber()) toast(t('toast.demo'));
    const win = window.open(waLink(text), '_blank', 'noopener');
    if (win) win.opener = null;
  }

  /* ── toast ─────────────────────────────────────────────────────────── */
  let toastTimer = 0;
  function toast(message) {
    const el = $('#toast');
    if (!el || !message) return;
    el.textContent = message;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-on'); }, 3800);
  }

  /* ── opening hours ─────────────────────────────────────────────────── */
  const DAY_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const WEEKDAY_KEY = { Mon: 'mon', Tue: 'tue', Wed: 'wed', Thu: 'thu', Fri: 'fri', Sat: 'sat', Sun: 'sun' };
  const CLOCK = {};

  function kolkataClock() {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: CONFIG.hours.timezone || 'Asia/Kolkata',
      weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(now);
    const get = function (type) {
      const p = parts.find(function (x) { return x.type === type; });
      return p ? p.value : '';
    };
    return {
      day: WEEKDAY_KEY[get('weekday')] || 'mon',
      minutes: (parseInt(get('hour'), 10) % 24) * 60 + parseInt(get('minute'), 10)
    };
  }

  function parseHM(value) {
    if (!value || !/^\d{1,2}:\d{2}$/.test(value)) return null;
    const bits = value.split(':');
    const h = parseInt(bits[0], 10);
    const m = parseInt(bits[1], 10);
    if (h > 23 || m > 59) return null;
    return h * 60 + m;
  }

  function getOpenState() {
    const schedule = CONFIG.hours || {};
    const clock = kolkataClock();
    const today = schedule[clock.day] || ['', ''];
    const open = parseHM(today[0]);
    const close = parseHM(today[1]);
    if (open == null || close == null) return { state: 'unknown', day: clock.day };
    if (open === close) return { state: 'closed', day: clock.day };
    let isOpen;
    if (close > open) isOpen = clock.minutes >= open && clock.minutes < close;
    else isOpen = clock.minutes >= open || clock.minutes < close;
    return { state: isOpen ? 'open' : 'closed', day: clock.day, until: today[1] };
  }

  function dayTimeLabel(open, close) {
    const a = parseHM(open);
    const b = parseHM(close);
    if (a == null || b == null) return t('hours.unknown');
    return open + ' – ' + close;
  }

  /* ── festival countdown ────────────────────────────────────────────── */
  function nextFestival() {
    const now = Date.now();
    return CONFIG.festivals
      .map(function (f) { return { f: f, ts: new Date(f.date).getTime() }; })
      .filter(function (x) { return x.ts > now; })
      .sort(function (a, b) { return a.ts - b.ts; })[0] || null;
  }

  /* ── public namespace ──────────────────────────────────────────────── */
  const Noor = {
    CONFIG: CONFIG,
    state: state,
    I18N: I18N,
    t: t,
    $: $,
    $$: $$,
    clamp: clamp,
    reduce: reduce,
    touch: touch,
    onInit: onInit,
    onLang: onLang,
    toast: toast,
    lock: lock,
    scrollTo: scrollToTarget,
    waNumber: waNumber,
    waLink: waLink,
    openWhatsApp: openWhatsApp,
    getOpenState: getOpenState,
    dayTimeLabel: dayTimeLabel,
    nextFestival: nextFestival,
    DAY_ORDER: DAY_ORDER,
    setLang: setLang,
    ensureFont: ensureFont,
    applyStatic: applyStatic,
    refresh: function () {
      if (window.ScrollTrigger) ScrollTrigger.refresh();
      if (state.lenis) state.lenis.resize();
    }
  };
  window.Noor = Noor;

  /* ── boot ──────────────────────────────────────────────────────────── */
  function boot() {
    if (state.inited) return;
    let saved = 'en';
    try { saved = localStorage.getItem('np-lang') || 'en'; } catch (e) {}
    if (!I18N[saved]) saved = 'en';
    state.lang = saved;

    ensureFont(saved);
    updateLanguageChrome();
    applyStatic();

    /* language buttons: header + mobile menu */
    $$('.lang').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setLang(btn.dataset.lang);
      });
    });

    initFns.forEach(function (fn) {
      try { fn(); } catch (e) { console.error('init module', e); }
    });
    state.inited = true;

    /* language-dependent modules now know their state */
    langFns.forEach(function (fn) {
      try { fn(); } catch (e) { console.error('lang module', e); }
    });

    ensureFont(saved).then(function () {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
          Noor.refresh();
          setTimeout(function () { Noor.refresh(); }, 500);
        });
      }
    });

    document.getElementById('year').textContent = new Date().getFullYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
