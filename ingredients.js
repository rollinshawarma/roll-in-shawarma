/* Roll-In Shawarma: what's included in each item, shared by the website,
   QR page and kiosk. Customers can tap to take things off; the kitchen
   ticket only lists what was taken off ("No onions").
   The checkout server has the same list and checks every removal, so
   this file only drives the screens. Keep the two in step. */
(function(){
  var ING = {
    fries:       { label: 'Fries',        img: 'ing-fries.webp', hq: 'ing-fries-hq' },
    pickle:      { label: 'Pickles',      img: 'ing-pickle.svg', hq: 'ing-pickle-hq' },
    white_sauce: { label: 'White sauce',  img: 'ing-white-sauce.svg' },
    cucumber:    { label: 'Cucumbers',    img: 'ing-cucumber.webp' },
    tomato:      { label: 'Tomatoes',     img: 'ing-tomato.webp' },
    onion:       { label: 'Onions',       img: 'ing-onion.webp' },
    bell_pepper: { label: 'Bell peppers', img: 'ing-peppers.webp' },
    cheese:      { label: 'Cheese',       img: 'ing-cheese.webp' },
    cilantro:    { label: 'Cilantro',     img: 'ing-cilantro.svg', hq: 'ing-cilantro-hq' },
    lettuce:     { label: 'Lettuce',      img: 'ing-lettuce.webp' }
  };
  // Built-in lists = the fallback. The live ones come from the staff portal
  // (Menu tab, menu-studio.sql) through get_menu_options() as the page loads.
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
    double_protein: { label: 'Double protein', price: 3.50, img: 'ing-chicken.webp' },
    extra_falafel:  { label: 'Extra falafel',  price: 2.00, img: 'ing-falafel.svg', hq: 'ing-falafel-hq' },
    add_cucumber:   { label: 'Cucumbers',      price: 0.50, img: 'ing-cucumber.webp' },
    add_tomato:     { label: 'Tomatoes',       price: 0.50, img: 'ing-tomato.webp' },
    // White sauce: "Extra" on items that already come with it, "White sauce" on the rest.
    // max: how many a customer can add to one item (1 = on/off).
    extra_white:    { label: 'Extra white sauce', price: 1.39, img: 'ing-white-sauce.svg', max: 5 },
    add_white:      { label: 'White sauce',       price: 1.39, img: 'ing-white-sauce.svg', max: 5 },
    spicy_sauce:    { label: 'Signature Spicy Sauce', price: 1.39, img: 'ing-spicy-sauce.svg?v=2', max: 5, ticket: '+ Signature spicy sauce' }
  };
  var ADDON_SETS = {
    bowl: ['extra_white', 'spicy_sauce', 'double_protein'],
    veggie_bowl: ['extra_white', 'spicy_sauce', 'extra_falafel'],
    shawarma: ['add_cucumber', 'add_tomato', 'extra_white', 'spicy_sauce'],
    falafel: ['extra_white', 'spicy_sauce'],
    loaded: ['extra_white', 'spicy_sauce'],
    frankie: ['add_white', 'spicy_sauce'],
    taco: ['add_white', 'spicy_sauce']
  };
  // Spice level: which item types ask for it (portal: Menu -> item -> Spice level),
  // and the choices (nothing picked to start). The checkout checks it again.
  var SPICE = { shawarma: true, falafel: true, bowl: true, veggie_bowl: true };
  var SPICE_LEVELS = [{ key: 'mild', label: 'Mild' }, { key: 'medium', label: 'Medium' }, { key: 'spicy', label: 'Spicy' }];
  // Item types: which menu items each list applies to (category + optional word in the name).
  var GROUPS = [
    { key: 'shawarma', category: 'Shawarma', name_not: 'falafel' }, { key: 'falafel', category: 'Shawarma', name_has: 'falafel' },
    { key: 'frankie', category: 'Frankie Rolls' }, { key: 'bowl', category: 'Bowls', name_not: 'veggie' }, { key: 'veggie_bowl', category: 'Bowls', name_has: 'veggie' },
    { key: 'loaded', category: 'Loaded Fries' }, { key: 'taco', category: 'Tacos' }, { key: 'platter', category: 'Platters' }
  ];
  // Choices customers must pick (Platters: 1 base + 2 entrées). From the
  // database (portal: Menu -> Platter choices); these are the starting ones.
  var CHOICE_SETS = {
    platter_base: { title: 'Choose your base', pick: 1, options: [
      { key: 'white_jeera_rice', label: 'White Jeera Rice', veg: false, cents: 0, img: 'pick-white-jeera-rice.jpg' },
      { key: 'tandoori_naan', label: 'Tandoori Naan (2)', veg: false, cents: 399, img: 'pick-tandoori-naan.jpg' },
      { key: 'garlic_naan', label: 'Garlic Naan (2)', veg: false, cents: 499, img: 'pick-garlic-naan.jpg' }] },
    platter_entrees: { title: 'Choose two entrées', pick: 2, options: [
      { key: 'chana_masala', label: 'Chana Masala', veg: true, cents: 0, img: 'pick-chana-masala.jpg' },
      { key: 'butter_paneer', label: 'Butter Paneer', veg: true, cents: 0, img: 'pick-butter-paneer.jpg' },
      { key: 'paneer_tikka', label: 'Paneer Tikka', veg: true, cents: 0, img: 'pick-paneer-tikka.jpg' },
      { key: 'butter_chicken', label: 'Butter Chicken', veg: false, cents: 0, img: 'pick-butter-chicken.jpg' },
      { key: 'tikka_chicken', label: 'Tikka Chicken', veg: false, cents: 0, img: 'pick-tikka-chicken.jpg' },
      { key: 'spicy_chicken_curry', label: 'Spicy Chicken Curry', veg: false, cents: 0, img: 'pick-spicy-chicken-curry.jpg' }] }
  };
  var GROUP_CHOICES = { platter: ['platter_base', 'platter_entrees'] };
  SETS.veggie_bowl = SETS.bowl.slice();
  SETS.platter = []; ADDON_SETS.platter = [];
  var NOTE_MAX = 140;
  function setFor(item){
    if (!item) return null;
    var cat = item.category || '', name = item.name || '';
    // Deal picks ($0 "Deal Selections" items) get the same choices as the dish.
    if (cat === 'Deal Selections') {
      var k = /shawarma/i.test(name) ? (/falafel/i.test(name) ? 'falafel' : 'shawarma') : /frankie/i.test(name) ? 'frankie' : /bowl/i.test(name) ? 'bowl'
        : /^loaded fries/i.test(name) ? 'loaded' : /tacos?$/i.test(name) ? 'taco' : null;
      return k && SETS[k] ? k : null;
    }
    var n = name.toLowerCase(), c = cat.toLowerCase();
    for (var i = 0; i < GROUPS.length; i++) {
      var g = GROUPS[i];
      if (String(g.category || '').toLowerCase() !== c) continue;
      if (g.name_has && n.indexOf(String(g.name_has).toLowerCase()) === -1) continue;
      if (g.name_not && n.indexOf(String(g.name_not).toLowerCase()) !== -1) continue;
      return g.key;
    }
    return null;
  }
  function included(item){ var s = setFor(item); return s && SETS[s] ? SETS[s].filter(function(k){ return ING[k]; }) : []; }
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
    if (!s || (item && item.category === 'Deal Selections')) return [];
    return ADDON_SETS[s] ? ADDON_SETS[s].filter(function(k){ return ADDONS[k]; }) : [];
  }
  // Spice level: regular menu items of a type with spice on (not deal picks).
  function hasSpice(item){
    var s = setFor(item);
    return !!(s && SPICE[s] && SPICE_LEVELS.length && !(item && item.category === 'Deal Selections'));
  }
  function spiceLevel(k){ for (var i = 0; i < SPICE_LEVELS.length; i++) if (SPICE_LEVELS[i].key === k) return SPICE_LEVELS[i]; return null; }
  // Nothing is picked to start: the customer has to choose one ('' until then).
  function cleanSpice(item, k){
    if (!hasSpice(item)) return '';
    return spiceLevel(k) ? k : '';
  }
  function needsSpice(item, k){ return hasSpice(item) && !spiceLevel(k); }
  function spiceText(k){ var l = spiceLevel(k); return l ? '\ud83c\udf36 ' + l.label : ''; }
  // "Spice level" row of buttons; [data-spice] buttons. spicePick() marks the tapped one.
  function spiceHtml(item, level){
    if (!hasSpice(item)) return '';
    level = cleanSpice(item, level);
    return '<div class="ing-block ing-spice-block">' +
      '<div class="ing-head"><span class="ing-title">Spice level</span><span class="ing-hint ing-spice-req">Required</span></div>' +
      '<div class="ing-spice" role="radiogroup" aria-label="Spice level">' +
      SPICE_LEVELS.map(function(l, i){
        var on = l.key === level;
        return '<button type="button" class="ing-spice-btn ing-spice-' + esc(l.key) + (on ? ' is-on' : '') + '" role="radio" data-spice="' + esc(l.key) + '" aria-checked="' + on + '">' +
          '<span class="ing-spice-peps" aria-hidden="true">' + new Array(Math.min(3, i + 1) + 1).join('\ud83c\udf36') + '</span><span class="ing-spice-name">' + esc(l.label) + '</span></button>';
      }).join('') + '</div></div>';
  }
  function spicePick(el){
    var box = el && el.closest ? el.closest('.ing-spice') : null, k = el ? el.getAttribute('data-spice') : '';
    if (box) box.querySelectorAll('[data-spice]').forEach(function(b){ var on = b === el; b.classList.toggle('is-on', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); });
    var blk = box && box.closest('.ing-spice-block'); if (blk) blk.classList.remove('need');
    return k;
  }
  // Some add-ons can be taken more than once (2x white sauce): the list
  // repeats the key, up to that add-on's max (set in the staff portal).
  // The checkout caps it the same way.
  var ADD_MAX = 5;
  function addMax(k){ var m = ADDONS[k] && ADDONS[k].max; return m >= 1 ? Math.min(ADD_MAX, m) : 1; }
  function addCount(keys, k){ return (keys || []).filter(function(x){ return x === k; }).length; }
  function cleanAdd(item, keys){
    var allowed = addonsFor(item), out = [];
    keys = Array.isArray(keys) ? keys : [];
    allowed.forEach(function(k){ for (var n = Math.min(addMax(k), addCount(keys, k)); n > 0; n--) out.push(k); });
    return out;
  }
  // Click on an add-on: the row or chip toggles; "+" / "−" add or take one.
  function addStep(keys, el){
    keys = (keys || []).slice();
    var k = el.getAttribute('data-addon'), step = el.getAttribute('data-addon-step'), at = keys.indexOf(k);
    if (step === '1') { if (addCount(keys, k) < addMax(k)) keys.push(k); }
    else if (step === '-1') { if (at !== -1) keys.splice(at, 1); }
    else if (at !== -1) keys = keys.filter(function(x){ return x !== k; });
    else keys.push(k);
    return keys;
  }
  // After redrawing, put focus back on the same control (or the row).
  function addFocus(box, el){
    if (!box || !el) return;
    var k = el.getAttribute('data-addon'), step = el.getAttribute('data-addon-step');
    var t = (step && box.querySelector('[data-addon="' + k + '"][data-addon-step="' + step + '"]:not(:disabled)')) ||
      box.querySelector('[data-addon="' + k + '"][data-addon-step="1"]:not(:disabled)') || box.querySelector('[data-addon="' + k + '"]');
    if (t) t.focus();
  }
  function addPrice(keys){ return Math.round((keys || []).reduce(function(s, k){ return s + (ADDONS[k] ? ADDONS[k].price : 0); }, 0) * 100) / 100; }
  function addLabel(k){ var a = ADDONS[k]; if (a.ticket) return a.ticket; return '+ ' + (k === 'extra_sauce' || k === 'double_protein' || k === 'extra_falafel' || k === 'extra_white' ? a.label : 'Add ' + a.label.toLowerCase()); }
  function addNote(keys){
    var seen = [];
    (keys || []).forEach(function(k){ if (ADDONS[k] && seen.indexOf(k) === -1) seen.push(k); });
    return seen.map(function(k){ var n = addCount(keys, k); return addLabel(k) + (n > 1 ? ' \u00d7' + n : ''); }).join(', ');
  }
  function cleanNote(s){ return String(s || '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, NOTE_MAX); }
  // ---- Choices to pick (Platters) ----
  function choicesFor(item){
    var s = setFor(item);
    if (!s || (item && item.category === 'Deal Selections')) return [];
    return (GROUP_CHOICES[s] || []).filter(function(k){ return CHOICE_SETS[k] && CHOICE_SETS[k].options.length; });
  }
  function choiceOpt(set, k){ var cs = CHOICE_SETS[set]; if (!cs) return null; for (var i = 0; i < cs.options.length; i++) if (cs.options[i].key === k) return cs.options[i]; return null; }
  // {set: [keys]} with only real, switched-on choices, no repeats, at most "pick" each.
  function cleanPicks(item, p){
    var out = {}, any = false;
    choicesFor(item).forEach(function(set){
      var seen = [], cs = CHOICE_SETS[set];
      // Only one way to choose (one base on offer): it's picked already.
      if (cs.options.length === cs.pick) seen = cs.options.map(function(o){ return o.key; });
      ((p && p[set]) || []).forEach(function(k){ if (choiceOpt(set, k) && seen.indexOf(k) === -1 && seen.length < CHOICE_SETS[set].pick) seen.push(k); });
      if (seen.length) { out[set] = seen; any = true; }
    });
    return any ? out : null;
  }
  // Title of the first choice not fully picked yet ('' when all done).
  function needsPicks(item, p){
    var c = cleanPicks(item, p) || {}, sets = choicesFor(item);
    for (var i = 0; i < sets.length; i++) if ((c[sets[i]] || []).length < CHOICE_SETS[sets[i]].pick) return CHOICE_SETS[sets[i]].title;
    return '';
  }
  function pickPrice(p){
    var t = 0;
    Object.keys(p || {}).forEach(function(set){ (p[set] || []).forEach(function(k){ var o = choiceOpt(set, k); if (o) t += (Number(o.cents) || 0) / 100; }); });
    return Math.round(t * 100) / 100;
  }
  function pickText(p){
    if (!p) return '';
    return Object.keys(p).filter(function(set){ return CHOICE_SETS[set]; }).map(function(set){
      return (p[set] || []).map(function(k){ var o = choiceOpt(set, k); return o ? o.label + (o.veg ? ' (Veg)' : '') : ''; }).filter(Boolean).join(' + ');
    }).filter(Boolean).join(' · ');
  }
  var VEG_BADGE = '<span class="ing-veg" title="Vegetarian"><i></i>Veg</span>';
  // The pick blocks: tiles with photo, name, Veg badge, +price. [data-pick-set][data-pick]
  function picksHtml(item, p){
    var sets = choicesFor(item); if (!sets.length) return '';
    var c = cleanPicks(item, p) || {};
    return sets.map(function(set){
      var cs = CHOICE_SETS[set], mine = c[set] || [];
      return '<div class="ing-block ing-pick-block" data-pick-block="' + esc(set) + '">' +
        '<div class="ing-head"><span class="ing-title">' + esc(cs.title) + '</span><span class="ing-hint ing-pick-hint">' + pickHint(cs, mine.length) + '</span></div>' +
        '<div class="ing-pick-grid" role="group" aria-label="' + esc(cs.title) + '">' +
        cs.options.map(function(o){
          var n = mine.indexOf(o.key) + 1;
          return '<button type="button" class="ing-pick' + (n ? ' is-on' : '') + '" data-pick-set="' + esc(set) + '" data-pick="' + esc(o.key) + '" aria-pressed="' + (n ? 'true' : 'false') + '">' +
            '<span class="ing-pick-img"><img src="' + esc(o.img || 'item-build-your-platter.jpg') + '" alt="" loading="lazy" onerror="this.style.visibility=\'hidden\'">' + (cs.pick > 1 ? '<b class="ing-pick-n">' + (n || '') + '</b>' : '<b class="ing-pick-n">\u2713</b>') + '</span>' +
            '<span class="ing-pick-name">' + esc(o.label) + '</span>' +
            '<span class="ing-pick-meta">' + (o.veg ? VEG_BADGE : '') + (Number(o.cents) > 0 ? '<span class="ing-pick-price">+' + money(o.cents / 100) + '</span>' : '') + '</span>' +
          '</button>';
        }).join('') + '</div></div>';
    }).join('');
  }
  function pickHint(cs, n){ return cs.pick === 1 ? (n ? 'Picked' : 'Pick 1 \u00b7 Required') : n + ' of ' + cs.pick + ' picked' + (n < cs.pick ? ' \u00b7 Required' : ''); }
  // Tap a tile: returns the new picks and updates the tiles in place.
  // Pick 1: replaces. Pick 2+: adds until full; when full, tap a picked one to change.
  function pickTap(item, p, el){
    var set = el.getAttribute('data-pick-set'), k = el.getAttribute('data-pick'), cs = CHOICE_SETS[set];
    var c = cleanPicks(item, p) || {}, mine = (c[set] || []).slice(), i = mine.indexOf(k), full = false;
    if (!cs) return c;
    if (i >= 0) mine.splice(i, 1);
    else if (cs.pick === 1) mine = [k];
    else if (mine.length < cs.pick) mine.push(k);
    else full = true;
    c[set] = mine;
    var blk = el.closest('[data-pick-block]');
    if (blk) {
      blk.querySelectorAll('[data-pick]').forEach(function(b){
        var n = mine.indexOf(b.getAttribute('data-pick')) + 1;
        b.classList.toggle('is-on', !!n); b.setAttribute('aria-pressed', n ? 'true' : 'false');
        var nb = b.querySelector('.ing-pick-n'); if (nb && cs.pick > 1) nb.textContent = n ? String(n) : '';
      });
      var h = blk.querySelector('.ing-pick-hint');
      if (h) h.textContent = full ? 'You picked ' + cs.pick + '. Tap one to change it.' : pickHint(cs, mine.length);
      blk.classList.toggle('need', false); blk.classList.toggle('full', full);
      if (full) setTimeout(function(){ blk.classList.remove('full'); }, 600);
    }
    return c;
  }
  // Red "Required" on the first unpicked block, scrolled into view.
  function askPicks(root, item, p){
    var c = cleanPicks(item, p) || {}, sets = choicesFor(item);
    for (var i = 0; i < sets.length; i++) {
      if ((c[sets[i]] || []).length < CHOICE_SETS[sets[i]].pick) {
        var b = root && root.querySelector('[data-pick-block="' + sets[i] + '"]');
        if (b) { b.classList.add('need'); try { b.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {} }
        return CHOICE_SETS[sets[i]].title;
      }
    }
    return '';
  }
  // Everything that makes a cart line different from a plain one.
  function custom(item, c){
    c = c || {};
    var o = { remove: clean(item, c.remove), add: cleanAdd(item, c.add), note: cleanNote(c.note) };
    var sp = cleanSpice(item, c.spice); if (sp) o.spice = sp;
    var pk = cleanPicks(item, c.pick); if (pk) o.pick = pk;
    return o;
  }
  function pickKey(p){ return p ? Object.keys(p).sort().map(function(s){ return s + ':' + (p[s] || []).join('+'); }).join(';') : ''; }
  function lineKey(c){ return [(c && c.remove || []).join(','), (c && c.add || []).join(','), cleanNote(c && c.note)].join('|') + (c && c.spice ? '|' + c.spice : '') + (c && c.pick ? '|' + pickKey(c.pick) : ''); }
  // One line for the cart / review: "No onions, + Extra sauce. Note: extra crispy"
  function summary(c){
    if (!c) return '';
    var parts = [pickText(c.pick), spiceText(c.spice), note(c.remove), addNote(c.add)].filter(Boolean).join(', ');
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
        var n = addCount(added, k), a = ADDONS[k];
        // Once-only add-ons (veggies, double protein): a simple on/off row.
        if (addMax(k) === 1) return '<button type="button" class="ing-add' + (n ? ' is-on' : '') + '" data-addon="' + k + '" aria-pressed="' + !!n + '" aria-label="' + esc(a.label) + ', add ' + money(a.price) + (n ? ', added' : '') + '">' +
          '<span class="ing-add-pic">' + picHtml(a) + '</span>' +
          '<span class="ing-add-name">' + esc(a.label) + '</span>' +
          '<span class="ing-add-price">+' + money(a.price) + '</span>' +
          '<span class="ing-add-tick" aria-hidden="true">' + (n ? '\u2713' : '+') + '</span>' +
        '</button>';
        if (!n) return '<button type="button" class="ing-add" data-addon="' + k + '" aria-label="' + esc(a.label) + ', add ' + money(a.price) + '">' +
          '<span class="ing-add-pic">' + picHtml(a) + '</span>' +
          '<span class="ing-add-name">' + esc(a.label) + '</span>' +
          '<span class="ing-add-price">+' + money(a.price) + '</span>' +
          '<span class="ing-add-tick" aria-hidden="true">+</span>' +
        '</button>';
        // Added: a "− 2 +" stepper so customers can take more than one.
        return '<div class="ing-add is-on" role="group" aria-label="' + esc(a.label) + '">' +
          '<span class="ing-add-pic">' + picHtml(a) + '</span>' +
          '<span class="ing-add-name">' + esc(a.label) + (n > 1 ? '<small class="ing-add-each">' + money(a.price) + ' each</small>' : '') + '</span>' +
          '<span class="ing-add-price">+' + money(a.price * n) + '</span>' +
          '<span class="ing-step">' +
            '<button type="button" class="ing-step-btn" data-addon="' + k + '" data-addon-step="-1" aria-label="' + (n === 1 ? 'Remove ' + esc(a.label) : 'One less ' + esc(a.label)) + '">' + (n === 1 ? '\u2715' : '\u2212') + '</button>' +
            '<span class="ing-step-n" aria-live="polite" aria-label="' + n + ' added">' + n + '</span>' +
            '<button type="button" class="ing-step-btn" data-addon="' + k + '" data-addon-step="1" aria-label="One more ' + esc(a.label) + '"' + (n >= addMax(k) ? ' disabled' : '') + '>+</button>' +
          '</span>' +
        '</div>';
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
      'div.ing-add{cursor:default}' +
      '.ing-add-each{display:block;font-weight:500;font-size:.82em;color:var(--ing-muted,#6e6e73)}' +
      '.ing-step{display:flex;align-items:center;gap:4px;flex:none}' +
      '.ing-step-btn{width:36px;height:36px;min-width:36px;min-height:36px;padding:0;border-radius:50%;border:1.5px solid var(--ing-accent,#d62d20);background:var(--ing-card,#fff);color:var(--ing-accent,#d62d20);font:inherit;font-size:18px;font-weight:800;line-height:1;display:flex;align-items:center;justify-content:center;cursor:pointer;-webkit-tap-highlight-color:transparent}' +
      '.ing-step-btn[data-addon-step="1"]{background:var(--ing-accent,#d62d20);color:var(--ing-accent-ink,#fff)}' +
      '.ing-step-btn:disabled{opacity:.35;cursor:not-allowed}' +
      '.ing-step-n{min-width:24px;text-align:center;font-weight:800;font-variant-numeric:tabular-nums}' +
      '.ing-chip.is-extra .ing-pic{box-shadow:inset 0 0 0 1.5px var(--ing-line,#e3e3e8);background:transparent;border:1.5px dashed var(--ing-line,#c7c7cc);box-sizing:border-box}' +
      '.ing-chip.is-extra .ing-badge{background:var(--ing-card,#fff);color:var(--ing-ink,#1d1d1f);box-shadow:0 0 0 1.5px var(--ing-line,#c7c7cc);width:auto;padding:0 6px;border-radius:11px;right:auto;left:calc(50% + 10px);font-size:11px}' +
      '.ing-chip.is-extra.is-added .ing-pic{border-style:solid;border-color:var(--ing-accent,#d62d20)}' +
      '.ing-chip.is-extra.is-added .ing-badge{background:var(--ing-accent,#d62d20);color:var(--ing-accent-ink,#fff);box-shadow:none}' +
      '.ing-spice{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}' +
      // Pick tiles (Platters): photo, name, Veg badge; number shows pick order.
      '.ing-pick-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}' +
      '.ing-pick{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 6px 10px;border-radius:16px;border:2px solid var(--ing-line,#e3e3e8);background:var(--ing-card,#fff);color:var(--ing-ink,#1d1d1f);font:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;text-align:center}' +
      '.ing-pick.is-on{border-color:var(--ing-accent,#d62d20);box-shadow:0 0 0 2px var(--ing-accent,#d62d20) inset}' +
      '.ing-pick-img{position:relative;width:100%;aspect-ratio:1;border-radius:12px;overflow:hidden;background:#f5f1ea}' +
      '.ing-pick-img img{width:100%;height:100%;object-fit:cover;display:block}' +
      '.ing-pick-n{position:absolute;top:6px;right:6px;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;background:var(--ing-accent,#d62d20);color:#fff;opacity:0;transform:scale(.6);transition:.15s}' +
      '.ing-pick.is-on .ing-pick-n{opacity:1;transform:scale(1)}' +
      '.ing-pick-name{font-weight:700;font-size:14px;line-height:1.2}' +
      '.ing-pick-meta{display:flex;gap:6px;align-items:center;justify-content:center;min-height:20px;flex-wrap:wrap}' +
      '.ing-pick-price{font-size:12px;font-weight:700;color:var(--ing-muted,#6e6e73)}' +
      '.ing-veg{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#1b7a2e;border:1.5px solid #1b7a2e;border-radius:6px;padding:1px 5px 1px 4px;background:#effaf0;line-height:1.4}' +
      '.ing-veg i{width:8px;height:8px;border-radius:50%;background:#1b9a36;display:inline-block}' +
      '.ing-pick-block.need .ing-pick-hint{color:#d62d20;font-weight:800}' +
      '.ing-pick-block.need .ing-pick{border-color:#f1a39c}' +
      '.ing-pick-block.full .ing-pick-hint{color:#d62d20;font-weight:800}' +
      '@media (max-width:420px){.ing-pick-grid{grid-template-columns:repeat(2,1fr)}}' +
      '.ing-spice-btn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:62px;padding:8px 6px;border-radius:14px;border:1.5px solid var(--ing-line,#e3e3e8);background:var(--ing-card,#fff);color:var(--ing-ink,#1d1d1f);font:inherit;font-weight:700;cursor:pointer;-webkit-tap-highlight-color:transparent}' +
      '.ing-spice-peps{font-size:15px;line-height:1;letter-spacing:-2px}' +
      // Picked: Mild light orange, Medium orange, Spicy red.
      '.ing-spice-btn.is-on{border-color:#ffb867;background:#ffd3a1;color:#5a2e00}' +
      '.ing-spice-btn.ing-spice-medium.is-on{border-color:#f57c00;background:#f57c00;color:#fff}' +
      '.ing-spice-btn.ing-spice-spicy.is-on{border-color:#d62d20;background:#d62d20;color:#fff}' +
      '.ing-spice-req{font-weight:700}' +
      '.ing-spice-block.need .ing-spice-btn{border-color:#d62d20}' +
      '.ing-spice-block.need .ing-spice-req{color:#d62d20}' +
      '.ing-note-label{display:block}' +
      '.ing-note-label .ing-title{margin-right:8px}' +
      '.ing-note{display:block;width:100%;box-sizing:border-box;margin-top:10px;padding:10px 12px;border-radius:12px;border:1.5px solid var(--ing-line,#e3e3e8);background:var(--ing-card,#fff);color:var(--ing-ink,#1d1d1f);font:inherit;font-size:16px;resize:vertical;min-height:52px}' +
      '.ing-note:focus{outline:none;border-color:var(--ing-accent,#d62d20)}';
    (document.head || document.documentElement).appendChild(st);
  })();
  function note(keys){ return (keys || []).filter(function(k){ return ING[k]; }).map(noLabel).join(', '); }
  // Real photos uploaded to GitHub win (ing-<name>-hq.png, then .jpg);
  // until then the built-in picture shows.
  function picHtml(g){
    if (!g.hq) return '<img src="' + esc(g.img) + '" alt="" loading="lazy" decoding="async">';
    return '<img src="' + esc(g.hq) + '.png" data-fb="' + esc(g.hq) + '.jpg|' + esc(g.img) + '" alt="" loading="lazy" decoding="async" ' +
      'onerror="var l=(this.dataset.fb||\'\').split(\'|\'),n=l.shift();this.dataset.fb=l.join(\'|\');if(n)this.src=n;else this.onerror=null;">';
  }
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
          '<span class="ing-pic">' + picHtml(g) + '</span>' +
          '<span class="ing-badge" aria-hidden="true">' + (off ? '−' : '✓') + '</span>' +
          '<span class="ing-name">' + (off ? esc(noLabel(k)) : esc(g.label)) + '</span>' +
        '</button>';
      }).join('') +
      extras.map(function(k){
        var on = added.indexOf(k) !== -1, a = ADDONS[k];
        return '<button type="button" class="ing-chip is-extra' + (on ? ' is-added' : '') + '" data-addon="' + k + '" aria-pressed="' + on + '" aria-label="' + esc(a.label) + ', add ' + money(a.price) + (on ? ', added' : '') + '">' +
          '<span class="ing-pic">' + picHtml(a) + '</span>' +
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
  // ---- Live lists from the staff portal (Menu tab) ----
  // Replaces the built-in lists in place, then tells the page ("rollin:options")
  // so an open item can redraw. The checkout checks every choice and price again.
  var SB_URL = 'https://njcmcaoyzujijiyfardx.supabase.co', SB_KEY = 'sb_publishable_KKGHpbDgmjrw0jdpxTlWKg_JzMgmCO_';
  function applyOptions(d){
    if (!d || !Array.isArray(d.groups)) return false;
    var ing = {}, add = {}, sets = {}, asets = {}, groups = [], spice = {}, gch = {};
    Object.keys(d.ingredients || {}).forEach(function(k){ var v = d.ingredients[k] || {}; ing[k] = { label: String(v.label || k), img: v.img || 'ing-white-sauce.svg', hq: ING[k] && ING[k].img === v.img ? ING[k].hq : undefined }; });
    Object.keys(d.addons || {}).forEach(function(k){ var v = d.addons[k] || {}, c = Number(v.cents);
      if (!(c >= 0)) return;
      add[k] = { label: String(v.label || k), price: Math.round(c) / 100, img: v.img || 'ing-white-sauce.svg', hq: ADDONS[k] && ADDONS[k].img === v.img ? ADDONS[k].hq : undefined, ticket: v.ticket || null, where: v.included_grid ? 'included' : undefined, max: Number(v.max) >= 1 ? Math.min(ADD_MAX, Math.round(Number(v.max))) : 1 }; });
    d.groups.forEach(function(g){ if (!g || !g.key) return; groups.push({ key: String(g.key), category: g.category || '', name_has: g.name_has || null, name_not: g.name_not || null });
      sets[g.key] = (g.ingredients || []).map(String); asets[g.key] = (g.addons || []).map(String); if (g.spice === true) spice[g.key] = true;
      if (Array.isArray(g.choices)) gch[g.key] = g.choices.map(String); });
    if (d.choice_sets && typeof d.choice_sets === 'object') {
      Object.keys(CHOICE_SETS).forEach(function(k){ delete CHOICE_SETS[k]; });
      Object.keys(d.choice_sets).forEach(function(k){ var v = d.choice_sets[k] || {};
        CHOICE_SETS[k] = { title: String(v.title || k), pick: Math.max(1, Math.min(5, Number(v.pick) || 1)),
          options: (v.options || []).filter(function(o){ return o && o.key; }).map(function(o){ return { key: String(o.key), label: String(o.label || o.key), veg: o.veg === true, cents: Math.max(0, Number(o.cents) || 0), img: o.img || null }; }) }; });
      Object.keys(GROUP_CHOICES).forEach(function(k){ delete GROUP_CHOICES[k]; });
      Object.keys(gch).forEach(function(k){ GROUP_CHOICES[k] = gch[k]; });
    }
    // Older database (spice not set up yet): keep the built-in spice list.
    var hasSpiceCol = d.groups.some(function(g){ return g && typeof g.spice === 'boolean'; });
    if (hasSpiceCol) { Object.keys(SPICE).forEach(function(k){ delete SPICE[k]; }); Object.keys(spice).forEach(function(k){ SPICE[k] = true; }); }
    if (Array.isArray(d.spice_levels) && d.spice_levels.length) {
      var lv = d.spice_levels.filter(function(l){ return l && /^[a-z0-9_]{1,20}$/.test(String(l.key || '')); }).map(function(l){ return { key: String(l.key), label: String(l.label || l.key).slice(0, 20) }; });
      if (lv.length) { SPICE_LEVELS.length = 0; lv.forEach(function(l){ SPICE_LEVELS.push(l); }); }
    }
    [[ING, ing], [SETS, sets], [ADDONS, add], [ADDON_SETS, asets]].forEach(function(p){ Object.keys(p[0]).forEach(function(k){ delete p[0][k]; }); Object.keys(p[1]).forEach(function(k){ p[0][k] = p[1][k]; }); });
    GROUPS.length = 0; groups.filter(function(g){ return g.name_has; }).concat(groups.filter(function(g){ return !g.name_has; })).forEach(function(g){ GROUPS.push(g); });
    return true;
  }
  var optionsReady = false;
  function loadOptions(){
    if (typeof fetch !== 'function') return;
    fetch(SB_URL + '/rest/v1/rpc/get_menu_options', { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY }, body: '{}' })
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(d){ if (applyOptions(d)) { optionsReady = true; try { document.dispatchEvent(new Event('rollin:options')); } catch (e) {} } }, function(){});
  }
  loadOptions();
  setInterval(loadOptions, 5 * 60000);
  window.RollinIngredients = {
    ING: ING, included: included, clean: clean, note: note, noLabel: noLabel,
    chipsHtml: chipsHtml, toggle: toggle,
    ready: function(){ return optionsReady; }, reload: loadOptions, apply: applyOptions,
    ADDONS: ADDONS, addonsFor: addonsFor, cleanAdd: cleanAdd, addPrice: addPrice, addNote: addNote, addStep: addStep, addFocus: addFocus, addCount: addCount, addMax: addMax, ADD_MAX: ADD_MAX,
    addonsHtml: addonsHtml, noteHtml: noteHtml, cleanNote: cleanNote, custom: custom, lineKey: lineKey, summary: summary,
    hasSpice: hasSpice, cleanSpice: cleanSpice, needsSpice: needsSpice,
    // Platter choices
    choicesFor: choicesFor, picksHtml: picksHtml, pickTap: pickTap, cleanPicks: cleanPicks, needsPicks: needsPicks, askPicks: askPicks,
    pickPrice: pickPrice, pickText: pickText, CHOICE_SETS: CHOICE_SETS, VEG_BADGE: VEG_BADGE,
    // Must open the item window before adding (spice level or choices to pick).
    mustOpen: function(item){ return hasSpice(item) || choicesFor(item).length > 0; },
    // Shows "Required" in red on the spice row and scrolls to it.
    askSpice: function(root){ var b = root && root.querySelector('.ing-spice-block'); if (!b) return; b.classList.add('need'); try { b.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {} }, spiceHtml: spiceHtml, spicePick: spicePick, spiceText: spiceText, SPICE_LEVELS: SPICE_LEVELS,
    // True when the item has anything to customize (included, add-ons, spice).
    customizable: function(item){ return included(item).length > 0 || addonsFor(item).length > 0 || hasSpice(item) || choicesFor(item).length > 0; },
    key: function(keys){ return (keys || []).join(','); }
  };
})();
