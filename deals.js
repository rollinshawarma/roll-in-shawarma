/* Roll-In Shawarma — deals, shared by the website, QR page and kiosk.
 *
 *  - The member deals (one list for every platform) and what each one
 *    includes / lets you pick.
 *  - Taco Tuesday & Thursday: every taco order is $6.99 on those days
 *    (truck time, America/New_York). The server applies the same price,
 *    so what the page shows is what gets charged.
 *  - A small step-by-step picker for the deals (website + QR page;
 *    the kiosk keeps its own big-screen picker but uses this list).
 *
 * Deal prices come from the menu (menu_items, category "Deals"); each
 * pick is a $0 "Deal Selections" item so the kitchen sees exactly what
 * to make. The server refuses deals without a member and picks without
 * a deal.
 */
(function(){
  var SODAS = ['Soda - Coke', 'Soda - Diet Coke', 'Soda - Coke Zero', 'Soda - Sprite', 'Soda - Root Beer', 'Soda - Water'];
  var FRANKIES = ['Butter Chicken Frankie', 'Chicken Tikka Frankie', 'Tandoori Chicken Frankie', 'Signature Chicken Frankie', 'Paneer Frankie'];
  var BOWLS = ['Butter Chicken Bowl', 'Chicken Tikka Bowl', 'Tandoori Chicken Bowl', 'Signature Chicken Bowl', 'Veggie Bowl'];
  var TACOS = ['Butter Chicken Tacos', 'Chicken Tikka Tacos', 'Tandoori Chicken Tacos', 'Signature Chicken Tacos'];
  var LOADED = ['Loaded Fries - Butter Chicken', 'Loaded Fries - Chicken Tikka', 'Loaded Fries - Tandoori Chicken', 'Loaded Fries - Signature Chicken'];

  var SPECS = {
    'Treat Yourself': {
      blurb: 'Loaded Fries, a Frankie Roll and a soda',
      fixed: [],
      steps: [
        { label: 'Choose your Loaded Fries', count: 1, options: LOADED },
        { label: 'Choose 1 Frankie Roll', count: 1, options: FRANKIES },
        { label: 'Choose 1 soda', count: 1, options: SODAS }
      ]
    },
    'Flavor Fiesta': {
      blurb: 'A taco order, a Chicken Shawarma, fries and a soda',
      fixed: ['Chicken Shawarma', 'Fries'],
      steps: [
        { label: 'Choose 1 taco order', count: 1, options: TACOS },
        { label: 'Choose 1 soda', count: 1, options: SODAS }
      ]
    },
    'Family Deal': {
      blurb: 'A Chicken Shawarma, 2 Frankie Rolls and a Rice Bowl',
      fixed: ['Chicken Shawarma'],
      steps: [
        { label: 'Choose 2 Frankie Rolls', count: 2, options: FRANKIES },
        { label: 'Choose 1 Rice Bowl', count: 1, options: BOWLS }
      ]
    },
    'Dinner Party Deal': {
      blurb: '2 Shawarmas, 2 Frankies, 2 Rice Bowls, 2 Peri Peri Fries, 2 sodas',
      fixed: ['Chicken Shawarma', 'Chicken Shawarma', 'Peri Peri Fries', 'Peri Peri Fries'],
      steps: [
        { label: 'Choose 2 Frankie Rolls', count: 2, options: FRANKIES },
        { label: 'Choose 2 Rice Bowls', count: 2, options: BOWLS },
        { label: 'Choose 2 sodas', count: 2, options: SODAS }
      ]
    }
  };
  var ORDER = ['Treat Yourself', 'Flavor Fiesta', 'Family Deal', 'Dinner Party Deal'];

  var TACO_PRICE = 6.99;
  function truckWeekday(d){
    try { return new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'long' }).format(d || new Date()); }
    catch (e) { return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][(d || new Date()).getDay()]; }
  }
  function tacoDay(d){ var w = truckWeekday(d); return (w === 'Tuesday' || w === 'Thursday') ? w : null; }
  // Menu rows from get_public_menu: on Taco Tuesday/Thursday every taco
  // order drops to $6.99. The regular price is kept for a strike-through.
  function applyTacoPricing(items){
    var day = tacoDay();
    (items || []).forEach(function(it){
      if (it.category !== 'Tacos') return;
      if (it.regular_price == null) it.regular_price = Number(it.price);
      it.price = day ? Math.min(Number(it.regular_price), TACO_PRICE) : Number(it.regular_price);
      it.taco_deal = !!day && Number(it.regular_price) > TACO_PRICE;
    });
    return day;
  }
  function shortName(n){ return String(n).replace(/^Soda - /, '').replace(/^Loaded Fries - /, ''); }

  // ---- step-by-step picker (website + QR page) ----
  // Colors come from the page: --dp-bg, --dp-card, --dp-ink, --dp-muted,
  // --dp-line, --dp-accent, --dp-accent-ink.
  var css = '' +
    '.dp-scrim{position:fixed;inset:0;z-index:400;background:rgba(0,0,0,.5)}' +
    '.dp-sheet{position:fixed;z-index:401;left:50%;bottom:0;transform:translateX(-50%);width:min(480px,100%);max-height:88vh;display:flex;flex-direction:column;background:var(--dp-bg,#fff);color:var(--dp-ink,#1d1d1f);border-radius:24px 24px 0 0;font-family:inherit}' +
    '@media (min-width:700px){.dp-sheet{bottom:auto;top:50%;transform:translate(-50%,-50%);border-radius:24px}}' +
    '.dp-head{padding:20px 20px 10px;position:relative}.dp-head h3{margin:0;font-size:22px;font-weight:800;letter-spacing:-.02em}' +
    '.dp-step{margin-top:4px;font-size:14px;color:var(--dp-muted,#6e6e73)}.dp-inc{margin-top:8px;font-size:13px;color:var(--dp-muted,#6e6e73)}' +
    '.dp-x{position:absolute;right:14px;top:14px;width:36px;height:36px;border-radius:50%;border:0;background:var(--dp-card,#f5f5f7);color:inherit;font-size:22px;line-height:1;cursor:pointer}' +
    '.dp-opts{overflow-y:auto;padding:4px 20px 12px;display:flex;flex-direction:column;gap:8px}' +
    '.dp-opt{display:flex;align-items:center;gap:12px;width:100%;min-height:52px;padding:8px 12px;border-radius:14px;border:1.5px solid var(--dp-line,#e3e3e8);background:var(--dp-card,#fff);color:inherit;font:inherit;text-align:left;cursor:pointer}' +
    '.dp-opt.on{border-color:var(--dp-accent,#1d1d1f)}.dp-opt .n{flex:1;font-weight:600}' +
    '.dp-cnt{min-width:28px;height:28px;border-radius:14px;display:inline-flex;align-items:center;justify-content:center;font-weight:800;background:var(--dp-line,#e3e3e8)}' +
    '.dp-opt.on .dp-cnt{background:var(--dp-accent,#1d1d1f);color:var(--dp-accent-ink,#fff)}' +
    '.dp-minus{width:32px;height:32px;border-radius:50%;border:1.5px solid var(--dp-line,#e3e3e8);background:transparent;color:inherit;font-size:18px;cursor:pointer}' +
    '.dp-foot{display:flex;gap:10px;padding:12px 20px calc(16px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--dp-line,#e3e3e8)}' +
    '.dp-back{height:50px;padding:0 18px;border-radius:999px;border:1.5px solid var(--dp-line,#e3e3e8);background:transparent;color:inherit;font:inherit;font-weight:700;cursor:pointer}' +
    '.dp-next{flex:1;height:50px;border-radius:999px;border:0;background:var(--dp-accent,#1d1d1f);color:var(--dp-accent-ink,#fff);font:inherit;font-weight:800;font-size:16px;cursor:pointer}' +
    '.dp-next:disabled{opacity:.45;cursor:default}';
  var styled = false, root = null, state = null;

  function el(html){ var d = document.createElement('div'); d.innerHTML = html; return d.firstChild; }
  function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function money(n){ return '$' + Number(n || 0).toFixed(2); }

  function close(){
    if (!root) return;
    root.scrim.remove(); root.sheet.remove(); root = null; state = null;
    document.documentElement.style.overflow = '';
  }
  function render(){
    var spec = state.spec, step = spec.steps[state.i], picks = state.picks[state.i];
    var total = Object.keys(picks).reduce(function(s, k){ return s + picks[k]; }, 0);
    var s = root.sheet;
    s.querySelector('.dp-step').textContent = 'Step ' + (state.i + 1) + ' of ' + spec.steps.length + ' · ' + step.label + ' (' + total + '/' + step.count + ')';
    s.querySelector('.dp-opts').innerHTML = step.options.filter(function(n){ return state.available(n); }).map(function(n){
      var c = picks[n] || 0;
      return '<button type="button" class="dp-opt' + (c ? ' on' : '') + '" data-dp="' + esc(n) + '">' +
        '<span class="n">' + esc(shortName(n)) + '</span>' +
        (c ? '<span class="dp-minus" role="button" aria-label="Remove one" data-dp-minus="' + esc(n) + '">−</span>' : '') +
        '<span class="dp-cnt">' + c + '</span></button>';
    }).join('');
    s.querySelector('.dp-back').style.display = state.i ? '' : 'none';
    var next = s.querySelector('.dp-next');
    var last = state.i === spec.steps.length - 1;
    next.textContent = last ? 'Add deal · ' + money(state.deal.price) : 'Next';
    next.disabled = total !== step.count;
  }
  function openPicker(opts){
    var spec = SPECS[opts.deal.name];
    if (!spec) return false;
    if (!styled) { var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); styled = true; }
    close();
    state = { deal: opts.deal, spec: spec, i: 0, picks: spec.steps.map(function(){ return {}; }), onAdd: opts.onAdd,
              available: opts.available || function(){ return true; } };
    var scrim = el('<div class="dp-scrim"></div>');
    var sheet = el('<section class="dp-sheet" role="dialog" aria-modal="true" aria-label="' + esc(opts.deal.name) + '">' +
      '<div class="dp-head"><h3>' + esc(opts.deal.name) + '</h3>' +
      '<div class="dp-inc">' + esc(spec.fixed.length ? 'Includes ' + spec.fixed.map(shortName).join(', ') + '. ' : '') + money(opts.deal.price) + '</div>' +
      '<div class="dp-step"></div><button type="button" class="dp-x" aria-label="Close">×</button></div>' +
      '<div class="dp-opts"></div>' +
      '<div class="dp-foot"><button type="button" class="dp-back">Back</button><button type="button" class="dp-next">Next</button></div></section>');
    document.body.appendChild(scrim); document.body.appendChild(sheet);
    root = { scrim: scrim, sheet: sheet };
    document.documentElement.style.overflow = 'hidden';
    scrim.addEventListener('click', close);
    sheet.querySelector('.dp-x').addEventListener('click', close);
    sheet.querySelector('.dp-back').addEventListener('click', function(){ if (state.i) { state.i -= 1; render(); } });
    sheet.querySelector('.dp-next').addEventListener('click', function(){
      if (state.i < state.spec.steps.length - 1) { state.i += 1; render(); return; }
      var picks = {};
      state.spec.fixed.forEach(function(n){ picks[n] = (picks[n] || 0) + 1; });
      state.picks.forEach(function(p){ Object.keys(p).forEach(function(n){ picks[n] = (picks[n] || 0) + p[n]; }); });
      var onAdd = state.onAdd, deal = state.deal;
      close();
      onAdd(deal, Object.keys(picks).map(function(n){ return { name: n, qty: picks[n] }; }));
    });
    sheet.querySelector('.dp-opts').addEventListener('click', function(e){
      var minus = e.target.closest('[data-dp-minus]');
      var picks = state.picks[state.i], step = state.spec.steps[state.i];
      if (minus) {
        var m = minus.getAttribute('data-dp-minus');
        picks[m] -= 1; if (picks[m] <= 0) delete picks[m];
        render(); return;
      }
      var b = e.target.closest('[data-dp]');
      if (!b) return;
      var total = Object.keys(picks).reduce(function(s, k){ return s + picks[k]; }, 0);
      var n = b.getAttribute('data-dp');
      if (total < step.count) { picks[n] = (picks[n] || 0) + 1; }
      else if (step.count === 1) { state.picks[state.i] = {}; state.picks[state.i][n] = 1; }
      render();
    });
    document.addEventListener('keydown', function onKey(e){ if (e.key === 'Escape') { close(); document.removeEventListener('keydown', onKey); } });
    render();
    return true;
  }

  window.RollinDeals = {
    specs: SPECS,
    order: ORDER,
    tacoPrice: TACO_PRICE,
    tacoDay: tacoDay,
    applyTacoPricing: applyTacoPricing,
    shortName: shortName,
    openPicker: openPicker
  };
})();
