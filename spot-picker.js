/* Roll-In Shawarma: drive-up parking spot picker on the lot photo.
   Used by the QR drive-up page (order.html) and the tracking page
   (track.html). Each numbered sign in drive-up-lot.webp gets a tappable
   button, plus a row of big numbered buttons in the same left-to-right
   order (5 ... 1, spot 1 next to the truck). Taken spots are greyed out.
   Taken spots come from the get_taken_spots database function; the
   database also makes it impossible for two orders to hold one spot. */
(function(){
  // Sign centers in the photo (% of width / height); 5 is on the left.
  var SPOTS = [
    { n: 5, x: 7.67 }, { n: 4, x: 24.16 }, { n: 3, x: 40.44 }, { n: 2, x: 56.83 }, { n: 1, x: 74.24 }
  ];
  var SIGN_Y = 59.45;
  // Each sign's printed number circle is ~2% of the photo's width; the
  // on-screen number is drawn the same size, right on top of it.
  var CSS = [
    '.lot{ --lot-accent:#FFA94D; --lot-accent-ink:#241902; --lot-card:#121110; --lot-line:rgba(243,234,201,0.16); --lot-text:#FFFCF3; --lot-muted:rgba(243,234,201,0.64); --lot-taken:#6d6a64; }',
    '.lot.lot-light{ --lot-accent:#1d1d1f; --lot-accent-ink:#fff; --lot-card:#fff; --lot-line:#e3e3e8; --lot-text:#1d1d1f; --lot-muted:#6e6e73; --lot-taken:#aeaeb2; }',
    '.lot-pic{ position:relative; border-radius:16px; overflow:hidden; background:#1b1b1b; aspect-ratio:1600/386; container-type:inline-size; }',
    // Bottom-aligned "cover": the full photo (sky on top) is trimmed from the top,
    // so the signs line up the same in drive-up-lot-hq.jpg and drive-up-lot.webp.
    '.lot-pic img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; object-position:50% 100%; display:block; }',
    '.lot-hot{ position:absolute; top:0; bottom:0; padding:0; border:0; background:transparent; cursor:pointer; -webkit-tap-highlight-color:transparent; }',
    '.lot-hot:disabled{ cursor:not-allowed; }',
    // Sized in cqw (% of the photo's width) so it matches the printed number at any screen size.
    '.lot-badge{ position:absolute; left:50%; top:' + SIGN_Y + '%; transform:translate(-50%,-50%); width:2.1vw; height:2.1vw; width:2.1cqw; height:2.1cqw; border-radius:50%; background:#fff; color:#d62d20; font-family:"Inter", system-ui, sans-serif; font-weight:800; font-size:1.3vw; font-size:1.3cqw; line-height:1; display:flex; align-items:center; justify-content:center; box-shadow:0 0 0 0.22cqw #d62d20; transition:transform .15s ease, background .15s ease; }',
    '.lot-hot:not(:disabled):hover .lot-badge{ transform:translate(-50%,-50%) scale(1.15); }',
    '.lot-hot.is-sel .lot-badge{ background:var(--lot-accent); color:var(--lot-accent-ink); box-shadow:0 0 0 0.22cqw #fff, 0 0 0 0.5cqw var(--lot-accent); }',
    // No box around the tapped area: only the number badge shows the choice.
    '.lot-hot, .lot-hot:focus, .lot-hot:active{ outline:none; box-shadow:none; }',
    '.lot-hot:focus-visible .lot-badge{ outline:2px solid #fff; outline-offset:2px; }',
    '.lot-hot.is-taken .lot-badge{ background:#3a3a3c; color:#9a9a9f; box-shadow:0 0 0 0.22cqw #3a3a3c; }',
    '.lot-hot.is-taken::before{ content:"TAKEN"; position:absolute; left:50%; top:70%; transform:translateX(-50%); font:800 clamp(7px, 1.1cqw, 12px)/1 "Inter", system-ui, sans-serif; letter-spacing:.06em; color:#fff; background:rgba(0,0,0,.72); padding:2px 5px; border-radius:5px; }',
    '.lot-row{ display:grid; grid-template-columns:repeat(5, 1fr); gap:8px; margin-top:10px; }',
    '.lot-btn{ position:relative; min-height:58px; border-radius:14px; border:1px solid var(--lot-line); background:var(--lot-card); color:var(--lot-text); font:800 26px/1 "Inter", system-ui, sans-serif; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; cursor:pointer; }',
    '.lot-btn small{ font-size:12px; font-weight:600; letter-spacing:0; color:var(--lot-muted); }',
    '.lot-btn.is-sel{ background:var(--lot-accent); border-color:var(--lot-accent); color:var(--lot-accent-ink); }',
    '.lot-btn.is-sel small{ color:var(--lot-accent-ink); opacity:.8; }',
    '.lot-btn:disabled{ opacity:.45; cursor:not-allowed; }',
    '.lot-hint{ display:flex; justify-content:space-between; gap:10px; margin-top:8px; font-size:12.5px; color:var(--lot-muted); }'
  ].join('\n');
  function injectCss(){
    if (document.getElementById('lotPickerCss')) return;
    var st = document.createElement('style'); st.id = 'lotPickerCss'; st.textContent = CSS;
    document.head.appendChild(st);
  }
  function mount(el, opts){
    opts = opts || {};
    injectCss();
    var taken = [], selected = null, disabled = false;
    var bounds = SPOTS.map(function(s, i){
      var left = i === 0 ? 0 : (SPOTS[i - 1].x + s.x) / 2;
      var right = i === SPOTS.length - 1 ? s.x + (s.x - (SPOTS[i - 1].x + s.x) / 2) : (s.x + SPOTS[i + 1].x) / 2;
      return { n: s.n, left: left, width: right - left };
    });
    el.innerHTML = '<div class="lot' + (opts.theme === 'light' ? ' lot-light' : '') + '">' +
      '<div class="lot-pic">' +
        // High-quality photo first (drive-up-lot-hq.jpg: the full lot photo,
        // same framing); if it isn't uploaded, the built-in drive-up-lot.webp.
        '<img src="' + (opts.image || 'drive-up-lot-hq.jpg') + '" onerror="if(!this.dataset.fb){this.dataset.fb=1;this.src=\'drive-up-lot.webp\';}" alt="Drive-up parking: spots 5, 4, 3, 2 and 1 from left to right. Spot 1 is next to the truck." decoding="async">' +
        bounds.map(function(b){
          return '<button type="button" class="lot-hot" data-lot-spot="' + b.n + '" style="left:' + b.left.toFixed(2) + '%;width:' + b.width.toFixed(2) + '%" aria-label="Spot ' + b.n + '"><span class="lot-badge" aria-hidden="true">' + b.n + '</span></button>';
        }).join('') +
      '</div>' +
      '<div class="lot-row" role="group" aria-label="Parking spot">' +
        SPOTS.map(function(s){ return '<button type="button" class="lot-btn" data-lot-spot="' + s.n + '" aria-pressed="false">' + s.n + '<small>Open</small></button>'; }).join('') +
      '</div>' +
      '<div class="lot-hint"><span>Tap your spot on the picture or below. Spot 1 is next to the truck.</span></div>' +
    '</div>';
    function paint(){
      el.querySelectorAll('[data-lot-spot]').forEach(function(b){
        var n = parseInt(b.getAttribute('data-lot-spot'), 10);
        var isTaken = taken.indexOf(n) !== -1 && n !== selected;
        b.classList.toggle('is-taken', isTaken);
        b.classList.toggle('is-sel', n === selected);
        b.disabled = disabled || isTaken;
        if (b.classList.contains('lot-btn')) {
          b.setAttribute('aria-pressed', n === selected ? 'true' : 'false');
          b.querySelector('small').textContent = n === selected ? 'Yours' : isTaken ? 'Taken' : 'Open';
        } else {
          b.setAttribute('aria-label', 'Spot ' + n + (isTaken ? ', taken' : n === selected ? ', selected' : ''));
        }
      });
    }
    el.addEventListener('click', function(e){
      var b = e.target.closest('[data-lot-spot]');
      if (!b || b.disabled || !el.contains(b)) return;
      selected = parseInt(b.getAttribute('data-lot-spot'), 10);
      paint();
      if (opts.onPick) opts.onPick(selected);
    });
    paint();
    return {
      // Returns true when the spot you had picked was just taken by someone else.
      setTaken: function(list){
        taken = (list || []).map(Number);
        var lost = selected != null && taken.indexOf(selected) !== -1;
        if (lost) selected = null;
        paint();
        return lost;
      },
      setSelected: function(n){ selected = n ? Number(n) : null; paint(); },
      setDisabled: function(v){ disabled = !!v; paint(); },
      selected: function(){ return selected; },
      isTaken: function(n){ return taken.indexOf(Number(n)) !== -1; }
    };
  }
  window.RollinSpots = { mount: mount };
})();
