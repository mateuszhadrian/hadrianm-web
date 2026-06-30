// realizacje-modal.jsx — modal szczegółów realizacji.
// Lewa kolumna (desktop): 3 zestawy laptop+telefon (Home / Galeria / Zamówienie).
// Prawa kolumna: wprowadzenie, liczby i wyniki, opinia klienta, zakres prac, CTA na żywo.
// Scrollowalny; X w rogu; Esc i klik w tło zamyka. Export: RzModal

function RzCheck({ color }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', flex: '0 0 auto' }}>
      <path d="M20 6L9 17l-5-5"></path>
    </svg>
  );
}

function RzClose({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M18 6L6 18M6 6l12 12"></path>
    </svg>
  );
}

function RzExternal({ color }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"></path>
    </svg>
  );
}

function RzInitials(name) {
  return name.split(/[\s&]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

// Jeden zestaw urządzeń z etykietą ekranu
function RzScreenSet({ t, screen, laptopW }) {
  const r = { name: screen.label, desktop: screen.desktop, mobile: screen.mobile };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: t.mono, fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase', color: t.accent }}>{screen.label}</span>
        <span style={{ flex: 1, height: 1, background: t.line }}></span>
      </div>
      <div style={{ paddingRight: laptopW * 0.14 }}>
        <RzDeviceDuo t={t} r={r} laptopW={laptopW} showPhone={true} chassis={88}></RzDeviceDuo>
      </div>
    </div>
  );
}

// Nagłówek: kategoria / rok / tytuł / wprowadzenie
function RzModalHeader({ t, r }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <span style={{ fontFamily: t.mono, fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: t.accent, border: `1px solid rgba(${t.glowRGB},0.45)`, borderRadius: 999, padding: '5px 11px' }}>{r.category}</span>
        <span style={{ fontFamily: t.mono, fontSize: 10.5, letterSpacing: '0.16em', color: t.faint }}>{r.year}</span>
      </div>
      <h2 style={{ margin: 0, fontFamily: t.display, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.0, fontSize: 'clamp(30px,7vw,48px)', color: t.ink }}>{r.name}</h2>
      <p style={{ margin: '16px 0 0', fontFamily: t.body, fontWeight: 500, fontSize: 16, lineHeight: 1.55, color: t.muted, textWrap: 'pretty' }}>{r.intro}</p>
    </div>
  );
}

// Body: liczby, opinia, zakres, CTA (bez nagłówka)
function RzModalBody({ t, r }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
      {/* Liczby i wyniki — najważniejsza sekcja */}
      <div>
        <div style={{ fontFamily: t.mono, fontSize: 10.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: t.faint, marginBottom: 16 }}>Liczby i wyniki</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {r.results.map((res, i) => (
            <div key={i} style={{ background: 'rgba(245,240,236,0.04)', border: `1px solid ${t.line}`, borderRadius: 14, padding: '18px 16px' }}>
              <div style={{ fontFamily: t.display, fontWeight: 800, letterSpacing: '-0.02em', fontSize: 'clamp(26px,3vw,34px)', lineHeight: 1, color: t.accent }}>{res.metric}</div>
              <div style={{ marginTop: 9, fontFamily: t.body, fontWeight: 500, fontSize: 12.5, lineHeight: 1.35, color: t.muted, textWrap: 'pretty' }}>{res.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Opinia klienta */}
      <div style={{ background: `linear-gradient(135deg, rgba(${t.glowRGB},0.10), rgba(245,240,236,0.03))`, border: `1px solid rgba(${t.glowRGB},0.22)`, borderRadius: 16, padding: '24px 22px' }}>
        <p style={{ margin: 0, fontFamily: t.serif, fontStyle: 'italic', fontSize: 'clamp(18px,2.2vw,22px)', lineHeight: 1.4, color: t.ink, textWrap: 'pretty' }}>„{r.quote}”</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 18 }}>
          <div style={{ width: 42, height: 42, borderRadius: 999, flex: '0 0 auto', display: 'grid', placeItems: 'center', background: t.accent, color: '#160a08', fontFamily: t.display, fontWeight: 800, fontSize: 15 }}>{RzInitials(r.author)}</div>
          <div>
            <div style={{ fontFamily: t.body, fontWeight: 700, fontSize: 14.5, color: t.ink }}>{r.author}</div>
            <div style={{ fontFamily: t.body, fontWeight: 500, fontSize: 12.5, color: t.faint }}>{r.role}</div>
          </div>
        </div>
      </div>

      {/* Zakres prac */}
      <div>
        <div style={{ fontFamily: t.mono, fontSize: 10.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: t.faint, marginBottom: 16 }}>Zakres prac</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px 22px' }}>
          {r.scope.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <RzCheck color={t.accent}></RzCheck>
              <span style={{ fontFamily: t.body, fontWeight: 600, fontSize: 14, color: 'rgba(245,240,236,0.82)' }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA na żywo */}
      <a href={r.liveUrl} target="_blank" rel="noopener noreferrer" className="rz-modal-cta" style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10, alignSelf: 'flex-start',
        fontFamily: t.body, fontWeight: 700, fontSize: 15, color: '#160a08', textDecoration: 'none',
        background: t.accent, borderRadius: 999, padding: '14px 24px',
      }}>
        <span>Zobacz stronę na żywo</span>
        <RzExternal color="#160a08"></RzExternal>
      </a>
    </div>
  );
}

function RzModalContent({ t, r }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
      <RzModalHeader t={t} r={r}></RzModalHeader>
      <RzModalBody t={t} r={r}></RzModalBody>
    </div>
  );
}

function RzModal({ t, r, onClose }) {
  const [closing, setClosing] = React.useState(false);
  const close = React.useCallback(() => { setClosing(true); setTimeout(onClose, 220); }, [onClose]);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [close]);

  if (!r) return null;

  return (
    <div className={'rz-modal-overlay' + (closing ? ' rz-modal-overlay--out' : '')} onClick={close}
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 'clamp(12px,4vw,56px)', overflowY: 'auto', background: 'rgba(6,4,5,0.72)', WebkitBackdropFilter: 'blur(8px)', backdropFilter: 'blur(8px)' }}>
      <div className={'rz-modal-card' + (closing ? ' rz-modal-card--out' : '')} onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', width: 'min(1180px, 100%)', background: 'linear-gradient(180deg, #16100F 0%, #0C0809 100%)', border: `1px solid ${t.line}`, borderRadius: 24, boxShadow: `0 60px 140px -30px rgba(0,0,0,0.85), 0 0 120px -40px ${t.glow}`, overflow: 'hidden' }}>
        {/* delikatne smugi w tle karty */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(60% 50% at 80% 0%, rgba(${t.glowRGB},0.16), rgba(0,0,0,0) 70%)` }}></div>

        {/* X zamknij */}
        <button type="button" onClick={close} aria-label="Zamknij" className="rz-modal-x" style={{
          position: 'absolute', top: 16, right: 16, zIndex: 5, width: 42, height: 42, borderRadius: 999,
          display: 'grid', placeItems: 'center', cursor: 'pointer',
          background: 'rgba(245,240,236,0.08)', border: `1px solid ${t.line}`, color: t.ink,
        }}>
          <RzClose color={t.ink}></RzClose>
        </button>

        <div className="rz-modal-grid" style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {/* Lewa kolumna: 3 zestawy urządzeń */}
          <div className="rz-modal-media" style={{ padding: 'clamp(28px,3.5vw,48px)', borderRight: `1px solid ${t.line}`, display: 'flex', flexDirection: 'column', gap: 'clamp(36px,4vw,56px)', background: 'rgba(255,255,255,0.012)' }}>
            {r.screens.map((sc, i) => (
              <RzScreenSet key={i} t={t} screen={sc} laptopW={390}></RzScreenSet>
            ))}
          </div>
          {/* Prawa kolumna: treść */}
          <div className="rz-modal-info" style={{ padding: 'clamp(28px,3.5vw,48px)' }}>
            <RzModalContent t={t} r={r}></RzModalContent>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Bottom sheet (mobile) ──
function RzModalSheet({ t, r, onClose }) {
  const [closing, setClosing] = React.useState(false);
  const close = React.useCallback(() => { setClosing(true); setTimeout(onClose, 260); }, [onClose]);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [close]);

  if (!r) return null;

  return (
    <div className={'rz-sheet-overlay' + (closing ? ' rz-sheet-overlay--out' : '')} onClick={close}
      style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(6,4,5,0.72)', WebkitBackdropFilter: 'blur(6px)', backdropFilter: 'blur(6px)' }}>
      <div className={'rz-sheet' + (closing ? ' rz-sheet--out' : '')} onClick={(e) => e.stopPropagation()}
        style={{ position: 'relative', width: '100%', maxWidth: 460, maxHeight: '92vh', display: 'flex', flexDirection: 'column',
          background: 'linear-gradient(180deg, #17110F 0%, #0C0809 100%)', borderTop: `1px solid ${t.line}`,
          borderTopLeftRadius: 26, borderTopRightRadius: 26, overflow: 'hidden',
          boxShadow: `0 -30px 90px -20px rgba(0,0,0,0.85), 0 0 120px -40px ${t.glow}` }}>

        {/* delikatna smuga */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(70% 40% at 80% 0%, rgba(${t.glowRGB},0.16), rgba(0,0,0,0) 70%)` }}></div>

        {/* Pasek chwytu + X (sticky) */}
        <div style={{ position: 'relative', zIndex: 2, flex: '0 0 auto', paddingTop: 12 }}>
          <div style={{ width: 44, height: 5, borderRadius: 99, background: 'rgba(245,240,236,0.28)', margin: '0 auto' }}></div>
          <button type="button" onClick={close} aria-label="Zamknij" className="rz-modal-x" style={{
            position: 'absolute', top: 10, right: 14, width: 38, height: 38, borderRadius: 999,
            display: 'grid', placeItems: 'center', cursor: 'pointer',
            background: 'rgba(245,240,236,0.08)', border: `1px solid ${t.line}`, color: t.ink }}>
            <RzClose color={t.ink}></RzClose>
          </button>
        </div>

        {/* Scrollowalna treść */}
        <div className="rz-sheet-scroll" style={{ position: 'relative', zIndex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '18px 22px 30px', display: 'flex', flexDirection: 'column', gap: 30 }}>
          <RzModalHeader t={t} r={r}></RzModalHeader>

          {/* Ekrany — stos urządzeń */}
          <div>
            <div style={{ fontFamily: t.mono, fontSize: 10.5, letterSpacing: '0.22em', textTransform: 'uppercase', color: t.faint, marginBottom: 18 }}>Podgląd strony</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 38 }}>
              {r.screens.map((sc, i) => (
                <RzScreenSet key={i} t={t} screen={sc} laptopW={280}></RzScreenSet>
              ))}
            </div>
          </div>

          <RzModalBody t={t} r={r}></RzModalBody>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { RzModal, RzModalSheet, RzModalContent, RzModalHeader, RzModalBody, RzScreenSet });
