export default function Slide1Title() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{ backgroundColor: "#0C0F1A", fontFamily: "'Inter', sans-serif", color: "#FFFFFF", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}
    >
      {/* Background accent circles */}
      <div style={{ position: "absolute", top: "-20vh", right: "-10vw", width: "55vw", height: "55vw", borderRadius: "50%", backgroundColor: "#4F7FFF", opacity: 0.06, filter: "blur(9vw)" }} />
      <div style={{ position: "absolute", bottom: "-30vh", left: "-15vw", width: "60vw", height: "60vw", borderRadius: "50%", backgroundColor: "#7C6BF0", opacity: 0.06, filter: "blur(11vw)" }} />

      {/* Grid overlay */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "4vw 4vw", opacity: 0.6, pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ position: "absolute", top: "5vh", left: "5vw", display: "flex", alignItems: "center", gap: "0.8vw", zIndex: 10 }}>
        <div style={{ width: "2vw", height: "2vw", backgroundColor: "#4F7FFF", borderRadius: "0.4vw" }} />
        <span style={{ fontSize: "1.5vw", fontWeight: 700, letterSpacing: "-0.02em" }}>
          <span style={{ color: "#FFFFFF" }}>Embeddin</span>
          <span style={{ color: "#4F7FFF" }}>Guessr</span>
        </span>
      </div>
      <div style={{ position: "absolute", top: "5vh", right: "5vw", fontSize: "1.5vw", fontWeight: 400, color: "rgba(255,255,255,0.35)", zIndex: 10 }}>2026</div>

      {/* Center content */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", maxWidth: "72vw" }}>

        {/* Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", padding: "0.7vh 1.8vw", backgroundColor: "rgba(124,107,240,0.15)", border: "1px solid rgba(124,107,240,0.35)", borderRadius: "2vw", color: "#7C6BF0", fontSize: "1.5vw", fontWeight: 600, marginBottom: "4vh", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          A Semantic Word Game
        </div>

        {/* Title */}
        <div style={{ fontSize: "7.5vw", fontWeight: 800, lineHeight: 1.0, letterSpacing: "-0.04em", marginBottom: "3.5vh", textWrap: "balance" }}>
          <span style={{ color: "#FFFFFF" }}>Embeddin</span>
          <span style={{ color: "#4F7FFF" }}>Guessr</span>
        </div>

        {/* Subtitle */}
        <div style={{ fontSize: "1.9vw", fontWeight: 300, color: "rgba(255,255,255,0.6)", marginBottom: "7vh", lineHeight: 1.5, maxWidth: "50vw", textWrap: "balance" }}>
          Navigate semantic space to find the hidden word.
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: "1.5vw", alignItems: "center" }}>
          <div style={{ padding: "1.2vh 2.2vw", backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "0.5vw", fontSize: "1.5vw", fontWeight: 500, color: "rgba(255,255,255,0.75)" }}>
            Daily Challenge
          </div>
          <div style={{ padding: "1.2vh 2.2vw", backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "0.5vw", fontSize: "1.5vw", fontWeight: 500, color: "rgba(255,255,255,0.75)" }}>
            Endless Mode
          </div>
          <div style={{ padding: "1.2vh 2.2vw", backgroundColor: "rgba(79,127,255,0.12)", border: "1px solid rgba(79,127,255,0.28)", borderRadius: "0.5vw", fontSize: "1.5vw", fontWeight: 500, color: "#4F7FFF" }}>
            Real-time 3D
          </div>
        </div>
      </div>

      {/* Decorative card mock bottom-right */}
      <div style={{ position: "absolute", bottom: "11vh", right: "-2vw", width: "22vw", height: "14vh", backgroundColor: "#131726", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "1vw", padding: "1.6vw", boxShadow: "0 2vh 5vh rgba(0,0,0,0.5)", transform: "rotate(-6deg)", opacity: 0.75, zIndex: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8vw", marginBottom: "1.8vh" }}>
          <div style={{ width: "1.6vw", height: "1.6vw", borderRadius: "50%", backgroundColor: "#7C6BF0" }} />
          <div style={{ height: "0.8vw", width: "9vw", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: "0.2vw" }} />
        </div>
        <div style={{ height: "0.7vw", width: "15vw", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "0.2vw", marginBottom: "1vh" }} />
        <div style={{ height: "0.7vw", width: "12vw", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "0.2vw" }} />
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: "5vh", left: "5vw", fontSize: "1.5vw", fontWeight: 400, color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em" }}>EMBEDDINGUESSR</div>
      <div style={{ position: "absolute", bottom: "5vh", right: "5vw", fontSize: "1.5vw", fontWeight: 400, color: "rgba(255,255,255,0.25)" }}>01 / 07</div>
    </div>
  );
}
