// realizacje-card.jsx — tło "Czerwona Mgła" na całą stronę, duet urządzeń (laptop+telefon),
// metadane (branża, tagi, CTA) oraz elastyczna karta realizacji.
// Export: RzBg, RzDeviceDuo, RzCard, RzArrow

// ── Ziarno filmowe (jak w Hero) ──
const RZ_GRAIN = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>"
);

// ── Tło na całą stronę (fixed) — kolorowe smugi + winieta + siatka kropek ──
function RzBg({ t }) {
  return (
    <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', background: t.bg, pointerEvents: 'none' }}>
      {t.blobs.map((bl, i) => {
        const d = bl.r * 2 * 100;
        return (
          <div key={i} style={{
            position: 'absolute', left: `calc(${bl.x * 100}% - ${d / 2}vw)`, top: `calc(${bl.y * 100}% - ${d / 2}vw)`,
            width: `${d}vw`, height: `${d}vw`, borderRadius: '50%',
            background: `radial-gradient(closest-side, ${bl.c} 0%, rgba(0,0,0,0) 72%)`,
            filter: 'blur(48px)',
          }}></div>
        );
      })}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(135% 100% at 50% 30%, rgba(0,0,0,0) 46%, rgba(0,0,0,0.55) 100%)' }}></div>
      <div style={{
        position: 'absolute', inset: 0, mixBlendMode: 'multiply', opacity: 0.85,
        backgroundImage: 'radial-gradient(circle at center, rgba(0,0,0,0.96) 1.1px, rgba(0,0,0,0) 2.4px)',
        backgroundSize: '9px 9px',
      }}></div>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url("${RZ_GRAIN}")`, backgroundSize: '300px', opacity: 0.05 }}></div>
    </div>
  );
}

// ── Duet urządzeń: laptop + telefon nachodzący na prawy dolny róg ──
function RzDeviceDuo({ t, r, laptopW = 560, showPhone = true, chassis = 88 }) {
  const phoneW = Math.round(laptopW * 0.255);
  return (
    <div className="rz-media-inner" style={{ position: 'relative', width: laptopW, margin: '0 auto', willChange: 'transform' }}>
      <RzFloorGlow t={t} width={laptopW * 1.28} height={laptopW * 0.22}
        style={{ position: 'absolute', left: '50%', bottom: -laptopW * 0.07, transform: 'translateX(-50%)' }}></RzFloorGlow>
      <RzLaptop t={t} width={laptopW} chassis={chassis} src={r.desktop} alt={`${r.name} — wersja desktop`}></RzLaptop>
      {showPhone ? (
        <div style={{ position: 'absolute', right: -phoneW * 0.34, bottom: -phoneW * 0.18 }}>
          <RzPhone t={t} width={phoneW} chassis={chassis} src={r.mobile} alt={`${r.name} — wersja mobile`}></RzPhone>
        </div>
      ) : null}
    </div>
  );
}

function RzArrow({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M5 12h13M13 6l6 6-6 6"></path>
    </svg>
  );
}

// ── Metadane realizacji: branża, tytuł, opis, tagi, CTA ──
function RzMeta({ t, r, align = 'left', compact = false }) {
  const isC = align === 'center';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isC ? 'center' : 'flex-start', textAlign: isC ? 'center' : 'left', gap: compact ? 12 : 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: isC ? 'center' : 'flex-start' }}>
        <span style={{
          fontFamily: t.mono, fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase',
          color: t.accent, border: `1px solid rgba(${t.glowRGB},0.45)`, borderRadius: 999, padding: '5px 11px',
        }}>{r.category}</span>
        <span style={{ fontFamily: t.mono, fontSize: 10.5, letterSpacing: '0.16em', color: t.faint }}>{r.year}</span>
      </div>

      <div>
        <h3 style={{ margin: 0, fontFamily: t.display, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.02, fontSize: compact ? 26 : 34, color: t.ink }}>{r.name}</h3>
        <p style={{ margin: '8px 0 0', fontFamily: t.body, fontWeight: 500, fontSize: compact ? 14 : 16, lineHeight: 1.45, color: t.muted, maxWidth: 440, textWrap: 'pretty' }}>{r.blurb}</p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: isC ? 'center' : 'flex-start' }}>
        {r.tags.slice(0, 3).map((tag, i) => (
          <span key={i} style={{
            fontFamily: t.body, fontWeight: 600, fontSize: 12, color: 'rgba(245,240,236,0.78)',
            background: 'rgba(245,240,236,0.06)', border: `1px solid ${t.line}`, borderRadius: 8, padding: '6px 10px',
          }}>{tag}</span>
        ))}
      </div>

      <div className="rz-cta" style={{
        marginTop: compact ? 2 : 6, display: 'inline-flex', alignItems: 'center', gap: 9,
        fontFamily: t.body, fontWeight: 700, fontSize: 14, color: t.ink,
        border: `1px solid rgba(${t.glowRGB},0.4)`, borderRadius: 999, padding: '9px 16px',
      }}>
        <span>Zobacz realizację</span>
        <span className="rz-cta-arrow" style={{ display: 'inline-flex' }}><RzArrow size={15}></RzArrow></span>
      </div>
    </div>
  );
}

// ── Elastyczna karta: 'vertical' (media nad tekstem) lub 'horizontal' (obok, naprzemiennie) ──
function RzCard({ t, r, layout = 'vertical', laptopW = 520, flip = false, showPhone = true, onOpen }) {
  const open = () => onOpen && onOpen(r);
  const media = (
    <div className="rz-media">
      <RzDeviceDuo t={t} r={r} laptopW={laptopW} showPhone={showPhone}></RzDeviceDuo>
    </div>
  );

  if (layout === 'horizontal') {
    return (
      <button type="button" className="rz-card rz-card--h" onClick={open}
        style={{ display: 'grid', gridTemplateColumns: flip ? '1fr 1.15fr' : '1.15fr 1fr', gap: 'clamp(28px,5vw,90px)', alignItems: 'center', width: '100%' }}>
        <div style={{ order: flip ? 2 : 1 }}>{media}</div>
        <div style={{ order: flip ? 1 : 2 }}><RzMeta t={t} r={r}></RzMeta></div>
      </button>
    );
  }

  return (
    <button type="button" className="rz-card rz-card--v" onClick={open}
      style={{ display: 'flex', flexDirection: 'column', gap: 26, width: '100%' }}>
      {media}
      <RzMeta t={t} r={r} compact={laptopW < 460}></RzMeta>
    </button>
  );
}

Object.assign(window, { RzBg, RzDeviceDuo, RzCard, RzArrow, RzMeta });
