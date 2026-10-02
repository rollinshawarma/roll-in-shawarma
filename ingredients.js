/* Roll-In Shawarma: what's included in each item, shared by the website,
   QR page and kiosk. Customers can tap to take things off; the kitchen
   ticket only lists what was taken off ("No onions").
   The checkout server has the same list and checks every removal, so
   this file only drives the screens. Keep the two in step. */
(function(){
  var ING = {
    fries:       { label: 'Fries',        img: 'ing-fries.webp' },
    pickle:      { label: 'Pickles',      img: 'ing-pickle.svg' },
    white_sauce: { label: 'White sauce',  img: 'ing-white-sauce.svg' },
    cucumber:    { label: 'Cucumbers',    img: 'ing-cucumber.webp' },
    tomato:      { label: 'Tomatoes',     img: 'ing-tomato.webp' },
    onion:       { label: 'Onions',       img: 'ing-onion.webp' },
    bell_pepper: { label: 'Bell peppers', img: 'ing-peppers.webp' },
    cheese:      { label: 'Cheese',       img: 'ing-cheese.webp' },
    cilantro:    { label: 'Cilantro',     img: 'ing-cilantro.svg' },
    lettuce:     { label: 'Lettuce',      img: 'ing-lettuce.webp' }
  };
  var SETS = {
    shawarma: ['fries', 'pickle', 'white_sauce'],
    falafel:  ['fries', 'pickle', 'white_sauce', 'cucumber', 'tomato'],
    frankie:  ['onion', 'bell_pepper', 'cheese', 'cilantro'],
    bowl:     ['bell_pepper', 'cucumber', 'tomato', 'lettuce', 'white_sauce', 'cilantro'],
    loaded:   ['cheese', 'white_sauce', 'cilantro'],
    taco:     ['onion', 'bell_pepper', 'cheese', 'cilantro', 'lettuce']
  };
  // Paid extras. "included" ones sit in the What's included grid (off
  // until tapped); the rest are listed under Add-ons. Prices are checked
  // and charged by the server (same list in create-order-checkout).
  var ADDONS = {
    extra_sauce:    { label: 'Extra sauce',    price: 1.00, img: 'ing-white-sauce.svg', where: 'included' },
    double_protein: { label: 'Double protein', price: 3.50, img: 'ing-chicken.webp' },
    add_cucumber:   { label: 'Cucumbers',      price: 0.50, img: 'ing-cucumber.webp' },
    add_tomato:     { label: 'Tomatoes',       price: 0.50, img: 'ing-tomato.webp' }
  };
  var ADDON_SETS = {
    bowl: ['extra_sauce', 'double_protein'],
    shawarma: ['add_cucumber', 'add_tomato']
  };
  var NOTE_MAX = 140;
  function setFor(item){
    if (!item) return null;
    var cat = item.category || '', name = item.name || '';
    // Deal picks ($0 "Deal Selections" items) get the same choices as the dish.
    if (cat === 'Deal Selections') {
      if (/shawarma/i.test(name)) return /falafel/i.test(name) ? 'falafel' : 'shawarma';
      if (/frankie/i.test(name)) return 'frankie';
      if (/bowl/i.test(name)) return 'bowl';
      if (/^loaded fries/i.test(name)) return 'loaded';
      if (/tacos?$/i.test(name)) return 'taco';
      return null;
    }
    if (cat === 'Shawarma') return /falafel/i.test(name) ? 'falafel' : 'shawarma';
    if (cat === 'Frankie Rolls') return 'frankie';
    if (cat === 'Bowls') return 'bowl';
    if (cat === 'Loaded Fries') return 'loaded';
    if (cat === 'Tacos') return 'taco';
    return null;
  }
  function included(item){ var s = setFor(item); return s ? SETS[s].slice() : []; }
  // Only real, allowed removals, in menu order, no repeats.
  function clean(item, keys){
    var allowed = included(item);
    keys = Array.isArray(keys) ? keys : [];
    return allowed.filter(function(k){ return keys.indexOf(k) !== -1; });
  }
  function noLabel(k){ return 'No ' + ING[k].label.toLowerCase(); }
  // Add-ons are for regular menu items only (not deal picks).
  function addonsFor(item){
    var s = setFor(item);
    if (!s || !ADDON_SETS[s] || (item && item.category === 'Deal Selections')) return [];
    return ADDON_SETS[s].slice();
  }
  function cleanAdd(item, keys){
    var allowed = addonsFor(item);
    keys = Array.isArray(keys) ? keys : [];
    return allowed.filter(function(k){ return keys.indexOf(k) !== -1; });
  }
  function addPrice(keys){ return Math.round((keys || []).reduce(function(s, k){ return s + (ADDONS[k] ? ADDONS[k].price : 0); }, 0) * 100) / 100; }
  function addLabel(k){ return '+ ' + (k === 'extra_sauce' || k === 'double_protein' ? ADDONS[k].label : 'Add ' + ADDONS[k].label.toLowerCase()); }
  function addNote(keys){ return (keys || []).filter(function(k){ return ADDONS[k]; }).map(addLabel).join(', '); }
  function cleanNote(s){ return String(s || '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, NOTE_MAX); }
  // Everything that makes a cart line different from a plain one.
  function custom(item, c){
    c = c || {};
    return { remove: clean(item, c.remove), add: cleanAdd(item, c.add), note: cleanNote(c.note) };
  }
  function lineKey(c){ return [(c && c.remove || []).join(','), (c && c.add || []).join(','), cleanNote(c && c.note)].join('|'); }
  // One line for the cart / review: "No onions, + Extra sauce. Note: extra crispy"
  function summary(c){
    if (!c) return '';
    var parts = [note(c.remove), addNote(c.add)].filter(Boolean).join(', ');
    var n = cleanNote(c.note);
    return parts + (n ? (parts ? '. ' : '') + 'Note: ' + n : '');
  }
  function money(n){ return '$' + Number(n).toFixed(2); }
  // "Add-ons" list under What's included (Chick-fil-A style rows).
  function addonsHtml(item, added){
    var list = addonsFor(item).filter(function(k){ return ADDONS[k].where !== 'included'; });
    if (!list.length) return '';
    added = added || [];
    return '<div class="ing-block ing-addons">' +
      '<div class="ing-head"><span class="ing-title">Add-ons</span><span class="ing-hint">Optional</span></div>' +
      '<div class="ing-add-list" role="group" aria-label="Add-ons">' +
      list.map(function(k){
        var on = added.indexOf(k) !== -1, a = ADDONS[k];
        return '<button type="button" class="ing-add' + (on ? ' is-on' : '') + '" data-addon="' + k + '" aria-pressed="' + on + '" aria-label="' + esc(a.label) + ', add ' + money(a.price) + (on ? ', added' : '') + '">' +
          '<span class="ing-add-pic"><img src="' + esc(a.img) + '" alt="" loading="lazy" decoding="async"></span>' +
          '<span class="ing-add-name">' + esc(a.label) + '</span>' +
          '<span class="ing-add-price">+' + money(a.price) + '</span>' +
          '<span class="ing-add-tick" aria-hidden="true">' + (on ? '\u2713' : '+') + '</span>' +
        '</button>';
      }).join('') + '</div></div>';
  }
  function noteHtml(value){
    return '<div class="ing-block ing-note-block"><label class="ing-note-label">' +
      '<span class="ing-title">Note for the kitchen</span><span class="ing-hint">Optional</span>' +
      '<textarea class="ing-note" data-ing-note rows="2" maxlength="' + NOTE_MAX + '" placeholder="e.g. Extra crispy, sauce on the side">' + esc(value || '') + '</textarea>' +
      '</label></div>';
  }
  // Shared look for add-on rows and the note box; each page sets the colors
  // with --ing-ink, --ing-muted, --ing-line, --ing-card, --ing-accent, --ing-accent-ink.
  (function(){
    if (document.getElementById('ingAddCss')) return;
    var st = document.createElement('style'); st.id = 'ingAddCss';
    st.textContent =
      '.ing-add-list{display:flex;flex-direction:column;gap:8px}' +
      '.ing-add{display:flex;align-items:center;gap:12px;width:100%;min-height:58px;padding:8px 12px 8px 8px;border-radius:14px;border:1.5px solid var(--ing-line,#e3e3e8);background:var(--ing-card,#fff);color:var(--ing-ink,#1d1d1f);font:inherit;text-align:left;cursor:pointer;-webkit-tap-highlight-color:transparent}' +
      '.ing-add.is-on{border-color:var(--ing-accent,#d62d20)}' +
      '.ing-add-pic{width:42px;height:42px;border-radius:50%;background:#f5f5f7;display:flex;align-items:center;justify-content:center;overflow:hidden;flex:none}' +
      '.ing-add-pic img{width:120%;height:auto;max-width:none}' +
      '.ing-add-name{flex:1;font-weight:600}' +
      '.ing-add-price{color:var(--ing-muted,#6e6e73);font-weight:600;font-size:.95em}' +
      '.ing-add-tick{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex:none;font-weight:800;border:1.5px solid var(--ing-line,#e3e3e8);color:var(--ing-ink,#1d1d1f)}' +
      '.ing-add.is-on .ing-add-tick{background:var(--ing-accent,#d62d20);border-color:var(--ing-accent,#d62d20);color:var(--ing-accent-ink,#fff)}' +
      '.ing-chip.is-extra .ing-pic{box-shadow:inset 0 0 0 1.5px var(--ing-line,#e3e3e8);background:transparent;border:1.5px dashed var(--ing-line,#c7c7cc);box-sizing:border-box}' +
      '.ing-chip.is-extra .ing-badge{background:var(--ing-card,#fff);color:var(--ing-ink,#1d1d1f);box-shadow:0 0 0 1.5px var(--ing-line,#c7c7cc);width:auto;padding:0 6px;border-radius:11px;right:auto;left:calc(50% + 10px);font-size:11px}' +
      '.ing-chip.is-extra.is-added .ing-pic{border-style:solid;border-color:var(--ing-accent,#d62d20)}' +
      '.ing-chip.is-extra.is-added .ing-badge{background:var(--ing-accent,#d62d20);color:var(--ing-accent-ink,#fff);box-shadow:none}' +
      '.ing-note-label{display:block}' +
      '.ing-note-label .ing-title{margin-right:8px}' +
      '.ing-note{display:block;width:100%;box-sizing:border-box;margin-top:10px;padding:10px 12px;border-radius:12px;border:1.5px solid var(--ing-line,#e3e3e8);background:var(--ing-card,#fff);color:var(--ing-ink,#1d1d1f);font:inherit;font-size:16px;resize:vertical;min-height:52px}' +
      '.ing-note:focus{outline:none;border-color:var(--ing-accent,#d62d20)}';
    (document.head || document.documentElement).appendChild(st);
  })();
  function note(keys){ return (keys || []).filter(function(k){ return ING[k]; }).map(noLabel).join(', '); }
  function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  // "What's included" block: one small photo tile per ingredient, all on
  // by default. Tapping one takes it off (and back on). Each page styles
  // .ing-* its own way and listens for clicks on [data-ing].
  function chipsHtml(item, removed, added){
    var list = included(item);
    if (!list.length) return '';
    removed = removed || []; added = added || [];
    var extras = addonsFor(item).filter(function(k){ return ADDONS[k].where === 'included'; });
    return '<div class="ing-block">' +
      '<div class="ing-head"><span class="ing-title">What’s included</span><span class="ing-hint">' + (extras.length ? 'Tap to remove or add' : 'Tap to remove') + '</span></div>' +
      '<div class="ing-grid" role="group" aria-label="What’s included. Tap to remove.">' +
      list.map(function(k){
        var off = removed.indexOf(k) !== -1, g = ING[k];
        return '<button type="button" class="ing-chip' + (off ? ' is-off' : '') + '" data-ing="' + k + '" aria-pressed="' + (!off) + '" aria-label="' + esc(g.label) + (off ? ', removed' : ', included') + '">' +
          '<span class="ing-pic"><img src="' + esc(g.img) + '" alt="" loading="lazy" decoding="async"></span>' +
          '<span class="ing-badge" aria-hidden="true">' + (off ? '−' : '✓') + '</span>' +
          '<span class="ing-name">' + (off ? esc(noLabel(k)) : esc(g.label)) + '</span>' +
        '</button>';
      }).join('') +
      extras.map(function(k){
        var on = added.indexOf(k) !== -1, a = ADDONS[k];
        return '<button type="button" class="ing-chip is-extra' + (on ? ' is-added' : '') + '" data-addon="' + k + '" aria-pressed="' + on + '" aria-label="' + esc(a.label) + ', add ' + money(a.price) + (on ? ', added' : '') + '">' +
          '<span class="ing-pic"><img src="' + esc(a.img) + '" alt="" loading="lazy" decoding="async"></span>' +
          '<span class="ing-badge" aria-hidden="true">' + (on ? '\u2713' : '+' + money(a.price).replace('.00', '')) + '</span>' +
          '<span class="ing-name">' + esc(a.label) + '</span>' +
        '</button>';
      }).join('') +
      '</div></div>';
  }
  function toggle(removed, k){
    removed = (removed || []).slice();
    var i = removed.indexOf(k);
    if (i === -1) removed.push(k); else removed.splice(i, 1);
    return removed;
  }
  window.RollinIngredients = {
    ING: ING, included: included, clean: clean, note: note, noLabel: noLabel,
    chipsHtml: chipsHtml, toggle: toggle,
    ADDONS: ADDONS, addonsFor: addonsFor, cleanAdd: cleanAdd, addPrice: addPrice, addNote: addNote,
    addonsHtml: addonsHtml, noteHtml: noteHtml, cleanNote: cleanNote, custom: custom, lineKey: lineKey, summary: summary,
    // True when the item has anything to customize (included, add-ons).
    customizable: function(item){ return included(item).length > 0 || addonsFor(item).length > 0; },
    key: function(keys){ return (keys || []).join(','); }
  };
})();
