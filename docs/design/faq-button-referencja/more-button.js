/* ════════════════════════════════════════════════════════════════
   BLOK „WIĘCEJ" — button „Zobacz wszystkie pytania" · logika
   1) synchronizacja licznika/nadpisu z data-* na .fq-all
      (data-shown, data-total; nadpis z data-tpl na .lead),
   2) delikatne wejście przy scrollu (ScrollTrigger → toggleClass .on).
   GSAP opcjonalny: bez niego blok po prostu jest widoczny.
   ════════════════════════════════════════════════════════════════ */
(function () {
  var MOTION_OK = window.matchMedia('(prefers-reduced-motion: no-preference)').matches;
  var STATIC = document.body.classList.contains('fq-static');
  var pad = function (n) { return String(n).length < 2 ? '0' + n : String(n); };

  /* ── licznik z data-* (opcjonalne; bez atrybutów zostaje markup) ── */
  var btn = document.querySelector('.fq-all');
  if (btn) {
    var shown = btn.getAttribute('data-shown');
    var total = btn.getAttribute('data-total');
    if (shown != null && total != null) {
      var countEl = btn.querySelector('.count');
      if (countEl) countEl.textContent = pad(shown) + ' / ' + pad(total);
      var lead = document.querySelector('.fq-more .lead');
      if (lead && lead.getAttribute('data-tpl')) {
        lead.textContent = lead.getAttribute('data-tpl').replace('{shown}', shown).replace('{total}', total);
      }
    }
  }

  /* ── wejście ── */
  var more = document.querySelector('.fq-more');
  if (!more || STATIC) return;
  if (!window.gsap || !window.ScrollTrigger || !MOTION_OK) { more.classList.add('on'); return; }
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.create({ trigger: more, start: 'top 92%', once: true,
    toggleClass: { targets: more, className: 'on' } });
})();
