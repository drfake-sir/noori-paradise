/* Noori Paradise — vector atelier drawings.
   The colour studio and wishlist use these lightweight SVGs so the page owns
   its art direction even before real photography arrives. */
(function () {
  'use strict';

  var uid = 0;

  var PATHS = {
    lehenga: {
      m: ['M72 60Q100 74 128 60L124 126 76 126Z', 'M76 126H124L188 352Q100 366 12 352Z'],
      x: ['M72 60Q36 170 58 340L78 344Q60 190 96 96Z', 'M128 60Q164 170 142 340L122 344Q140 190 104 96Z'],
      t: ['M76 126H124', 'M16 340Q100 354 184 340', 'M30 300Q100 314 170 300'],
      f: ['M100 126V358', 'M88 126L56 356', 'M112 126L144 356']
    },
    anarkali: {
      m: ['M72 60Q100 76 128 60L122 124 78 124Z', 'M78 124H122Q176 240 184 352Q100 368 16 352Q24 240 78 124Z'],
      x: ['M72 60L52 66 44 190 58 192 76 96Z', 'M128 60L148 66 156 190 142 192 124 96Z'],
      t: ['M78 124H122', 'M44 186L58 188', 'M156 186L142 188', 'M20 340Q100 356 180 340'],
      f: ['M100 124V360', 'M90 124Q70 240 54 356', 'M110 124Q130 240 146 356']
    },
    gown: {
      m: ['M80 60Q100 92 120 60L126 128Q120 200 124 236Q178 300 182 356Q100 372 18 356Q22 300 76 236Q80 200 74 128Z'],
      x: [],
      t: ['M80 60Q100 92 120 60', 'M74 128Q100 138 126 128', 'M124 236Q150 290 178 356'],
      f: ['M100 140V366', 'M88 150Q80 260 50 360', 'M112 150Q120 260 150 360']
    },
    abaya: {
      m: ['M74 60Q100 72 126 60L172 96 182 352Q100 366 18 352L28 96Z', 'M97 68H103L106 360H94Z'],
      x: [],
      t: ['M100 68V360', 'M20 340Q100 354 180 340', 'M24 300Q36 306 52 300', 'M176 300Q164 306 148 300'],
      f: ['M74 80L50 350', 'M126 80L150 350']
    },
    salwar: {
      m: ['M70 214H100L96 352H64Z', 'M100 214H130L136 352H104Z', 'M74 60Q100 74 126 60L136 214H64Z'],
      x: ['M74 60Q150 100 126 214L112 210Q130 120 74 80Z'],
      t: ['M74 60Q100 74 126 60', 'M70 100Q100 112 130 100', 'M64 206H136', 'M64 342H96', 'M104 342H136'],
      f: ['M100 80V210']
    },
    kurti: {
      m: ['M72 242L98 244 94 352H74Z', 'M102 244L128 242 126 352H106Z', 'M74 60Q100 74 126 60L146 236Q100 250 54 236Z'],
      x: [],
      t: ['M72 96Q100 112 128 96', 'M54 232Q100 246 146 232', 'M100 74V244'],
      f: ['M88 110Q76 180 66 236', 'M112 110Q124 180 134 236']
    }
  };

  var COLOURS = {
    ivory: { pal: ['#FFF4DC', '#E9D2A0', '#B9985A'], swatch: 'linear-gradient(135deg,#FFF4DC,#E9D2A0,#B9985A)' },
    ruby: { pal: ['#E0526E', '#B3183C', '#5C0A22'], swatch: 'linear-gradient(135deg,#E0526E,#B3183C,#5C0A22)' },
    rose: { pal: ['#F5C1C6', '#E08F9B', '#A85468'], swatch: 'linear-gradient(135deg,#F5C1C6,#E08F9B,#A85468)' },
    mulberry: { pal: ['#B0687C', '#6A2438', '#2A0C17'], swatch: 'linear-gradient(135deg,#B0687C,#6A2438,#2A0C17)' },
    midnight: { pal: ['#6F86C9', '#2D3E78', '#0E1633'], swatch: 'linear-gradient(135deg,#6F86C9,#2D3E78,#0E1633)' },
    emerald: { pal: ['#4FB59A', '#14705F', '#06352D'], swatch: 'linear-gradient(135deg,#4FB59A,#14705F,#06352D)' },
    champagne: { pal: ['#FAEBD0', '#DCC08D', '#A98B52'], swatch: 'linear-gradient(135deg,#FAEBD0,#DCC08D,#A98B52)' },
    blush: { pal: ['#FBE3DC', '#EBB9AE', '#C98A82'], swatch: 'linear-gradient(135deg,#FBE3DC,#EBB9AE,#C98A82)' },
    onyx: { pal: ['#6B5560', '#2A1820', '#0E070B'], swatch: 'linear-gradient(135deg,#6B5560,#2A1820,#0E070B)' }
  };

  var STYLES = ['lehenga', 'anarkali', 'gown', 'abaya', 'salwar', 'kurti'];
  var FABRICS = ['satin', 'georgette', 'velvet'];

  function svg(style, colourKey, fabric) {
    var p = PATHS[style] || PATHS.lehenga;
    var c = (COLOURS[colourKey] || COLOURS.ivory).pal;
    var fab = FABRICS.indexOf(fabric) > -1 ? fabric : 'satin';
    var id = 'np' + (++uid);

    function L(d, opacity) {
      var a = opacity ? ' opacity="' + opacity + '"' : '';
      return '<path d="' + d + '" fill="url(#' + id + 'g)"' + a + '/>';
    }

    var defs = '<defs>' +
      '<linearGradient id="' + id + 'g" x1="0" x2="1">' +
      '<stop offset="0" stop-color="' + c[2] + '"/>' +
      '<stop offset=".18" stop-color="' + c[0] + '"/>' +
      '<stop offset=".42" stop-color="' + c[1] + '"/>' +
      '<stop offset=".64" stop-color="' + c[0] + '"/>' +
      '<stop offset="1" stop-color="' + c[2] + '"/>' +
      '</linearGradient>' +
      '<linearGradient id="' + id + 'v" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#fff" stop-opacity=".22"/>' +
      '<stop offset=".48" stop-color="#fff" stop-opacity="0"/>' +
      '<stop offset="1" stop-color="#000" stop-opacity=".3"/>' +
      '</linearGradient>' +
      '<linearGradient id="' + id + 's" x1="-.7" x2="-.1">' +
      '<stop offset="0" stop-color="#fff" stop-opacity="0"/>' +
      '<stop offset=".5" stop-color="#fff" stop-opacity=".44"/>' +
      '<stop offset="1" stop-color="#fff" stop-opacity="0"/>' +
      '<animate attributeName="x1" values="-.7;1.5" dur="5s" repeatCount="indefinite"/>' +
      '<animate attributeName="x2" values="-.2;2" dur="5s" repeatCount="indefinite"/>' +
      '</linearGradient>' +
      '<pattern id="' + id + 'p" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">' +
      '<line x1="0" y1="0" x2="0" y2="5" stroke="#fff" stroke-opacity=".16" stroke-width=".7"/>' +
      '<line x1="2.5" y1="0" x2="2.5" y2="5" stroke="#000" stroke-opacity=".05" stroke-width=".6"/>' +
      '</pattern>' +
      '<radialGradient id="' + id + 'vel" cx=".35" cy=".25" r=".85">' +
      '<stop offset="0" stop-color="#fff" stop-opacity=".2"/>' +
      '<stop offset=".45" stop-color="#fff" stop-opacity="0"/>' +
      '<stop offset="1" stop-color="#000" stop-opacity=".34"/>' +
      '</radialGradient>' +
      '</defs>';

    var neck = '<g class="dress-gold" fill="none" stroke="#E7C896" stroke-width="1.4" stroke-linecap="round">' +
      '<path d="M100 34V24a6 6 0 1 1 6 6"/>' +
      '<path d="M100 34L40 58Q34 62 42 62H158Q166 62 160 58Z"/>' +
      '<path d="M88 62q12 9 24 0" stroke-width="1"/>' +
      '</g>';

    var cloth = '<g class="dress-cloth">';
    p.m.forEach(function (d) { cloth += L(d); });
    (p.x || []).forEach(function (d) { cloth += L(d, .7); });

    if (fab === 'georgette') {
      p.m.forEach(function (d) { cloth += '<path d="' + d + '" fill="url(#' + id + 'p)"/>'; });
    }
    if (fab === 'velvet') {
      p.m.forEach(function (d) { cloth += '<path d="' + d + '" fill="url(#' + id + 'vel)"/>'; });
    }

    if (fab === 'satin') {
      p.m.forEach(function (d) { cloth += '<path d="' + d + '" fill="url(#' + id + 's)"/>'; });
    }
    p.m.forEach(function (d) { cloth += '<path d="' + d + '" fill="url(#' + id + 'v)"/>'; });

    cloth += '<g fill="none" stroke="#fff" stroke-width=".8" stroke-opacity=".28" stroke-linecap="round">' +
      p.f.map(function (d) { return '<path d="' + d + '"/>'; }).join('') + '</g>';
    cloth += '<g fill="none" stroke="#E7C896" stroke-width="1.5" stroke-opacity=".9" stroke-linecap="round">' +
      p.t.map(function (d) { return '<path d="' + d + '"/>'; }).join('') + '</g>';

    if (style === 'lehenga' || style === 'anarkali') {
      cloth += '<g fill="#F6E4B8" opacity=".8">' +
        '<circle cx="84" cy="146" r="1.6"/><circle cx="100" cy="156" r="1.2"/><circle cx="116" cy="146" r="1.6"/>' +
        '<circle cx="60" cy="292" r="1.2"/><circle cx="140" cy="306" r="1.2"/><circle cx="100" cy="332" r="1.4"/>' +
        '</g>';
    }
    if (fab === 'velvet') {
      cloth += '<ellipse cx="86" cy="176" rx="20" ry="52" fill="#fff" opacity=".07" transform="rotate(-8 86 176)"/>';
    }
    cloth += '</g>';

    var sparks = [[100, 104], [72, 250], [132, 292], [104, 196], [150, 330]].map(function (q, n) {
      return '<g transform="translate(' + q[0] + ' ' + q[1] + ')" class="dress-spark" style="animation-delay:' + (n * .7) + 's">' +
        '<path d="M0-6Q0 0 6 0Q0 0 0 6Q0 0-6 0Q0 0 0-6Z" fill="#fff"/></g>';
    }).join('');

    return '<svg viewBox="0 0 200 372" class="dress-svg fabric-' + fab + '" aria-hidden="true" focusable="false">' +
      defs + neck + cloth + sparks + '</svg>';
  }

  window.NoorDress = {
    styles: STYLES,
    colours: COLOURS,
    fabrics: FABRICS,
    svg: svg
  };
})();
