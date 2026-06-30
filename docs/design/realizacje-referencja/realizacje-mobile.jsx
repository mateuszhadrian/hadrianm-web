// realizacje-mobile.jsx — wersja mobilna podstrony Realizacje:
//  • PhoneShell — ramka telefonu do podglądu na desktopie
//  • MobilePage — kompletna mini-strona (nagłówek + hero + galeria)
//  • MobileGallery — sama lista kart (single-column), 3 warianty: stos / zwarty / panel
// Export: PhoneShell, MobilePage, MobileGallery

function MCard({ t, r, variant, showPhone, onOpen }) {
  const cfg = {
    stos:   { lw: 280, align: 'center', compact: false, panel: false, gap: 22 },
    zwarty: { lw: 232, align: 'left',   compact: true,  panel: false, gap: 18 },
    panel:  { lw: 250, align: 'left',   compact: true,  panel: true,  gap: 20 },
  }[variant] || { lw: 280, align: 'center', compact: false, panel: false, gap: 22 };

  const inner = (
    <button type="button" className="rz-card rz-card--v" onClick={() => onOpen(r)}
      style={{ display: 'flex', flexDirection: 'column', alignItems: cfg.align === 'center' ? 'center' : 'stretch', gap: cfg.gap, width: '100%' }}>
      <div className="rz-media" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <RzDeviceDuo t={t} r={r} laptopW={cfg.lw} showPhone={showPhone}></RzDeviceDuo>
      </div>
      <RzMeta t={t} r={r} align={cfg.align} compact={cfg.compact}></RzMeta>
    </button>
  );

  if (cfg.panel) {
    return (
      <div style={{ background: 'rgba(245,240,236,0.04)', border: `1px solid ${t.line}`, borderRadius: 18, padding: '24px 18px 26px' }}>
        {inner}
      </div>
    );
  }
  return inner;
}

function MobileGallery({ t, tw, variant = 'stos', hover, onOpen }) {
  const extra = variant === 'zwarty' ? 12 : variant === 'panel' ? 16 : 30;
  return (
    <div data-hover={hover} style={{ display: 'flex', flexDirection: 'column', gap: tw.cardGap + extra, padding: '4px 22px 8px' }}>
      {REALIZACJE.map(r => (
        <MCard key={r.id} t={t} r={r} variant={variant} showPhone={tw.showPhone} onOpen={onOpen}></MCard>
      ))}
      <div className="rz-ghost" style={{ minHeight: 150, borderRadius: 18 }}>
        <div style={{ fontSize: 26, fontWeight: 300, lineHeight: 1 }}>+</div>
        <div style={{ fontFamily: t.mono, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Kolejne realizacje wkrótce</div>
      </div>
    </div>
  );
}

// Kompletna mini-strona mobilna (używana wewnątrz PhoneShell)
function MobilePage({ t, tw, variant, hover, onOpen }) {
  return (
    <div style={{ minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '40px 22px 14px' }}>
        <div style={{ fontFamily: t.display, fontWeight: 800, fontSize: 17 }}>hadrian<span style={{ color: t.muted }}>m</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width: 24 }}>
          <i style={{ height: 2, background: t.ink, borderRadius: 2 }}></i>
          <i style={{ height: 2, background: t.ink, borderRadius: 2 }}></i>
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '20px 24px 10px' }}>
        <div style={{ fontFamily: t.mono, fontSize: 10, letterSpacing: '0.34em', color: t.faint, marginBottom: 16 }}>ZREALIZOWANE ZLECENIA</div>
        <h1 style={{ margin: 0, fontFamily: t.display, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.02, fontSize: 40 }}>
          zobacz wybrane <span style={{ fontFamily: t.serif, fontStyle: 'italic', fontWeight: 400, background: 'linear-gradient(105deg,#FFF6F0 10%,#FFB3A6 90%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>realizacje</span>
        </h1>
        <p style={{ margin: '16px auto 0', fontSize: 14, lineHeight: 1.5, color: t.muted, maxWidth: 320, textWrap: 'pretty' }}>
          Wybrane projekty — każdy w wersji desktop i mobilnej. Dotknij, by zobaczyć szczegóły.
        </p>
      </div>

      <div style={{ marginTop: 22 }}>
        <MobileGallery t={t} tw={tw} variant={variant} hover={hover} onOpen={onOpen}></MobileGallery>
      </div>
      <div style={{ height: 28 }}></div>
    </div>
  );
}

// Ramka telefonu (do podglądu wersji mobilnej na desktopie)
function PhoneShell({ t, children }) {
  const g = (l) => `hsl(240 5% ${l.toFixed(1)}%)`;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 16px 60px' }}>
      <div style={{
        width: 360, borderRadius: 50, padding: 9,
        background: `linear-gradient(180deg, ${g(30)} 0%, ${g(9)} 60%, ${g(6)} 100%)`,
        boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.10), 0 70px 130px -30px rgba(0,0,0,0.85), 0 30px 110px -20px ${t.glow}`,
      }}>
        <div style={{ position: 'relative', borderRadius: 41, overflow: 'hidden', background: t.bg, height: 'min(820px, 80vh)' }}>
          <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 96, height: 22, background: '#000', borderRadius: 99, zIndex: 30 }}></div>
          <div style={{ position: 'absolute', inset: 0, overflowX: 'hidden', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {children}
          </div>
          <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', width: 120, height: 4, borderRadius: 99, background: 'rgba(245,240,236,0.5)', zIndex: 30 }}></div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PhoneShell, MobilePage, MobileGallery });
