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
  function setFor(item){
    if (!item) return null;
    var cat = item.category || '', name = item.name || '';
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
  function note(keys){ return (keys || []).filter(function(k){ return ING[k]; }).map(noLabel).join(', '); }
  function esc(s){ return String(s).replace(/[&<>"']/g, function(c){ return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  // "What's included" block: one small photo tile per ingredient, all on
  // by default. Tapping one takes it off (and back on). Each page styles
  // .ing-* its own way and listens for clicks on [data-ing].
  function chipsHtml(item, removed){
    var list = included(item);
    if (!list.length) return '';
    removed = removed || [];
    return '<div class="ing-block">' +
      '<div class="ing-head"><span class="ing-title">What’s included</span><span class="ing-hint">Tap to remove</span></div>' +
      '<div class="ing-grid" role="group" aria-label="What’s included. Tap to remove.">' +
      list.map(function(k){
        var off = removed.indexOf(k) !== -1, g = ING[k];
        return '<button type="button" class="ing-chip' + (off ? ' is-off' : '') + '" data-ing="' + k + '" aria-pressed="' + (!off) + '" aria-label="' + esc(g.label) + (off ? ', removed' : ', included') + '">' +
          '<span class="ing-pic"><img src="' + esc(g.img) + '" alt="" loading="lazy" decoding="async"></span>' +
          '<span class="ing-badge" aria-hidden="true">' + (off ? '−' : '✓') + '</span>' +
          '<span class="ing-name">' + (off ? esc(noLabel(k)) : esc(g.label)) + '</span>' +
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
    key: function(keys){ return (keys || []).join(','); }
  };
})();
