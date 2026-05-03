export default function Slide3HowToPlay() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{ backgroundColor: "#0C0F1A", fontFamily: "'Inter', sans-serif", color: "#FFFFFF", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}
    >
      {/* Background accents */}
      <div style={{ position: "absolute", top: "5vh", left: "15vw", width: "45vw", height: "45vw", borderRadius: "50%", backgroundColor: "#7C6BF0", opacity: 0.05, filter: "blur(12vw)" }} />
      <div style={{ position: "absolute", bottom: "0vh", right: "5vw", width: "40vw", height: "40vw", borderRadius: "50%", backgroundColor: "#4F7FFF", opacity: 0.05, filter: "blur(10vw)" }} />

      {/* Grid overlay */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "4vw 4vw", opacity: 0.5, pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ position: "absolute", top: "5vh", left: "5vw", display: "flex", alignItems: "center", gap: "0.8vw", zIndex: 10 }}>
        <div style={{ width: "2vw", height: "2vw", backgroundColor: "#4F7FFF", borderRadius: "0.4vw" }} />
        <span style={{ fontSize: "1.5vw", fontWeight: 700 }}>
          <span>Embeddin</span><span style={{ color: "#4F7FFF" }}>Guessr</span>
        </span>
      </div>
      <div style={{ position: "absolute", top: "5vh", right: "5vw", fontSize: "1.5vw", color: "rgba(255,255,255,0.35)", zIndex: 10 }}>2026</div>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", width: "88vw" }}>

        {/* Label */}
        <div style={{ display: "inline-block", padding: "0.5vh 1.4vw", backgroundColor: "rgba(124,107,240,0.15)", border: "1px solid rgba(124,107,240,0.3)", borderRadius: "2vw", color: "#7C6BF0", fontSize: "1.5vw", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "3vh" }}>
          How to play
        </div>

        {/* Title */}
        <div style={{ fontSize: "4.5vw", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: "2.5vh", textAlign: "center", textWrap: "balance" }}>
          Four steps to the target word
        </div>

        {/* Subtitle */}
        <div style={{ fontSize: "1.7vw", fontWeight: 300, color: "rgba(255,255,255,0.55)", marginBottom: "5vh", textAlign: "center" }}>
          Each guess reveals your position in semantic space.
        </div>

        {/* 4 step cards */}
        <div style={{ display: "flex", gap: "1.8vw", width: "100%", justifyContent: "center" }}>

          {/* Step 01 */}
          <div style={{ flex: "1", backgroundColor: "#131726", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1vw", padding: "2.8vh 2vw", display: "flex", flexDirection: "column", gap: "2vh" }}>
            <div style={{ fontSize: "3.5vw", fontWeight: 800, color: "rgba(79,127,255,0.25)", letterSpacing: "-0.04em", lineHeight: 1 }}>01</div>
            <div style={{ width: "2.5vw", height: "2px", backgroundColor: "#4F7FFF", opacity: 0.5 }} />
            <div style={{ fontSize: "1.9vw", fontWeight: 700, lineHeight: 1.2 }}>Type any word</div>
            <div style={{ fontSize: "1.5vw", fontWeight: 300, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>Enter any word as your first guess.</div>
          </div>

          {/* Step 02 */}
          <div style={{ flex: "1", backgroundColor: "#131726", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1vw", padding: "2.8vh 2vw", display: "flex", flexDirection: "column", gap: "2vh" }}>
            <div style={{ fontSize: "3.5vw", fontWeight: 800, color: "rgba(79,127,255,0.25)", letterSpacing: "-0.04em", lineHeight: 1 }}>02</div>
            <div style={{ width: "2.5vw", height: "2px", backgroundColor: "#4F7FFF", opacity: 0.5 }} />
            <div style={{ fontSize: "1.9vw", fontWeight: 700, lineHeight: 1.2 }}>Watch it appear in 3D</div>
            <div style={{ fontSize: "1.5vw", fontWeight: 300, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>It plots as a point in semantic space.</div>
          </div>

          {/* Step 03 */}
          <div style={{ flex: "1", backgroundColor: "#131726", border: "1px solid rgba(124,107,240,0.2)", borderRadius: "1vw", padding: "2.8vh 2vw", display: "flex", flexDirection: "column", gap: "2vh" }}>
            <div style={{ fontSize: "3.5vw", fontWeight: 800, color: "rgba(124,107,240,0.3)", letterSpacing: "-0.04em", lineHeight: 1 }}>03</div>
            <div style={{ width: "2.5vw", height: "2px", backgroundColor: "#7C6BF0", opacity: 0.6 }} />
            <div style={{ fontSize: "1.9vw", fontWeight: 700, lineHeight: 1.2 }}>Color shows distance</div>
            <div style={{ fontSize: "1.5vw", fontWeight: 300, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>Red is cold. Green means you are close.</div>
          </div>

          {/* Step 04 */}
          <div style={{ flex: "1", backgroundColor: "#131726", border: "1px solid rgba(124,107,240,0.2)", borderRadius: "1vw", padding: "2.8vh 2vw", display: "flex", flexDirection: "column", gap: "2vh" }}>
            <div style={{ fontSize: "3.5vw", fontWeight: 800, color: "rgba(124,107,240,0.3)", letterSpacing: "-0.04em", lineHeight: 1 }}>04</div>
            <div style={{ width: "2.5vw", height: "2px", backgroundColor: "#7C6BF0", opacity: 0.6 }} />
            <div style={{ fontSize: "1.9vw", fontWeight: 700, lineHeight: 1.2 }}>Close in on the target</div>
            <div style={{ fontSize: "1.5vw", fontWeight: 300, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>Use clusters and distances to navigate in.</div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: "5vh", left: "5vw", fontSize: "1.5vw", color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em" }}>EMBEDDINGUESSR</div>
      <div style={{ position: "absolute", bottom: "5vh", right: "5vw", fontSize: "1.5vw", color: "rgba(255,255,255,0.25)" }}>03 / 07</div>
    </div>
  );
}
