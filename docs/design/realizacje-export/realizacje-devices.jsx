// realizacje-devices.jsx — laptop + telefon NA WPROST (bez CSS 3D), proste kontenery.
// Wygląd obudowy/ramki/poświaty 1:1 jak w Hero (vena-devices), ale ekran wypełnia <img>.
// Export: RzLaptop, RzPhone, RzFloorGlow

function rzGray(l) {
  return `hsl(240 5% ${l.toFixed(1)}%)`;
}

function RzScreenImg({ src, alt, position = "top" }) {
  return (
    <img
      src={src}
      alt={alt || ""}
      loading="lazy"
      draggable="false"
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: position,
      }}
    ></img>
  );
}

function RzReflection() {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        background:
          "linear-gradient(112deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.035) 26%, rgba(255,255,255,0) 45%)",
      }}
    ></div>
  );
}

// Laptop — pokrywa + baza z wycięciem, ekran 1280:800. chassis 0..100 = jasność obudowy.
function RzLaptop({ t, width = 880, chassis = 88, src, alt }) {
  const bezel = 13;
  const screenW = width - bezel * 2;
  const screenH = Math.round((screenW * 800) / 1280);
  return (
    <div style={{ width, position: "relative" }}>
      <div
        style={{
          background: `linear-gradient(180deg, ${rzGray(4 + chassis * 0.28)} 0%, ${rzGray(1.6 + chassis * 0.136)} 55%, ${rzGray(1 + chassis * 0.098)} 100%)`,
          borderRadius: "20px 20px 6px 6px",
          padding: bezel,
          boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.08), 0 80px 160px -40px rgba(0,0,0,0.85), 0 40px 130px -30px ${t.glow}`,
        }}
      >
        <div
          style={{
            borderRadius: 8,
            overflow: "hidden",
            position: "relative",
            background: "#000",
            height: screenH,
          }}
        >
          <RzScreenImg src={src} alt={alt}></RzScreenImg>
          <RzReflection></RzReflection>
        </div>
      </div>
      <div
        style={{
          position: "relative",
          height: Math.round(width * 0.0216),
          width: "114%",
          marginLeft: "-7%",
          background: `linear-gradient(180deg, ${rzGray(5 + chassis * 0.345)} 0%, ${rzGray(2 + chassis * 0.178)} 45%, ${rzGray(0.7 + chassis * 0.072)} 100%)`,
          borderRadius: "3px 3px 16px 16px",
          boxShadow: "0 26px 60px -16px rgba(0,0,0,0.8)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: width * 0.16,
            height: 7,
            background: "rgba(0,0,0,0.45)",
            borderRadius: "0 0 10px 10px",
          }}
        ></div>
      </div>
    </div>
  );
}

// Telefon — neutralny, punch-hole, ekran 390:800.
function RzPhone({ t, width = 224, chassis = 88, src, alt }) {
  const bezel = 6;
  const screenW = width - bezel * 2;
  const screenH = Math.round((screenW * 800) / 390);
  const outerR = width * 0.165;
  return (
    <div
      style={{
        width,
        position: "relative",
        boxSizing: "border-box",
        background: `linear-gradient(180deg, ${rzGray(4 + chassis * 0.3)} 0%, ${rzGray(1.5 + chassis * 0.158)} 60%, ${rzGray(1 + chassis * 0.118)} 100%)`,
        borderRadius: outerR,
        padding: bezel,
        boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.10), 0 60px 120px -30px rgba(0,0,0,0.85), 0 30px 100px -20px ${t.glow}`,
      }}
    >
      <div
        style={{
          borderRadius: outerR - bezel,
          overflow: "hidden",
          position: "relative",
          background: "#000",
          height: screenH,
        }}
      >
        <RzScreenImg src={src} alt={alt}></RzScreenImg>
        <div
          style={{
            position: "absolute",
            top: 6,
            left: "50%",
            transform: "translateX(-50%)",
            width: 5,
            height: 5,
            borderRadius: 99,
            background: "#0a0a0a",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
            zIndex: 2,
          }}
        ></div>
        <RzReflection></RzReflection>
      </div>
    </div>
  );
}

// Miękka poświata "podłogi" pod urządzeniami
function RzFloorGlow({ t, width = 900, height = 170, style }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: "50%",
        background: `radial-gradient(ellipse at center, ${t.glow} 0%, rgba(0,0,0,0) 65%)`,
        filter: "blur(10px)",
        pointerEvents: "none",
        ...style,
      }}
    ></div>
  );
}

Object.assign(window, { RzLaptop, RzPhone, RzFloorGlow });
