export default function Slide5Tech() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{ backgroundColor: "#0C0F1A", fontFamily: "'Inter', sans-serif", color: "#FFFFFF", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}
    >
      {/* Background accents */}
      <div style={{ position: "absolute", top: "10vh", left: "20vw", width: "40vw", height: "40vw", borderRadius: "50%", backgroundColor: "#7C6BF0", opacity: 0.07, filter: "blur(12vw)" }} />
      <div style={{ position: "absolute", bottom: "5vh", right: "10vw", width: "40vw", height: "40vw", borderRadius: "50%", backgroundColor: "#4F7FFF", opacity: 0.05, filter: "blur(10vw)" }} />

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
      <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", width: "82vw" }}>

        {/* Label */}
        <div style={{ display: "inline-block", padding: "0.5vh 1.4vw", backgroundColor: "rgba(79,127,255,0.15)", border: "1px solid rgba(79,127,255,0.3)", borderRadius: "2vw", color: "#4F7FFF", fontSize: "1.5vw", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "3vh" }}>
          Technology
        </div>

        {/* Title */}
        <div style={{ fontSize: "4.5vw", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: "6vh", textAlign: "center" }}>
          Under the hood
        </div>

        {/* 2x2 tech grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2vw", width: "100%" }}>

          {/* Embeddings */}
          <div style={{ backgroundColor: "#131726", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1vw", padding: "3vh 3vw", display: "flex", gap: "2.5vw", alignItems: "flex-start" }}>
            <div style={{ width: "4vw", height: "4vw", backgroundColor: "rgba(79,127,255,0.15)", border: "1px solid rgba(79,127,255,0.25)", borderRadius: "0.8vw", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "1.8vw", height: "1.8vw", borderRadius: "50%", backgroundColor: "#4F7FFF" }} />
            </div>
            <div>
              <div style={{ fontSize: "1.9vw", fontWeight: 700, marginBottom: "1vh" }}>Word2vec embeddings</div>
              <div style={{ fontSize: "1.5vw", fontWeight: 300, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>179 reference words mapped into high-dimensional semantic space</div>
            </div>
          </div>

          {/* PCA */}
          <div style={{ backgroundColor: "#131726", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1vw", padding: "3vh 3vw", display: "flex", gap: "2.5vw", alignItems: "flex-start" }}>
            <div style={{ width: "4vw", height: "4vw", backgroundColor: "rgba(124,107,240,0.15)", border: "1px solid rgba(124,107,240,0.25)", borderRadius: "0.8vw", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "1.8vw", height: "0.3vw", backgroundColor: "#7C6BF0", borderRadius: "0.1vw" }} />
            </div>
            <div>
              <div style={{ fontSize: "1.9vw", fontWeight: 700, marginBottom: "1vh" }}>PCA projection into 3D</div>
              <div style={{ fontSize: "1.5vw", fontWeight: 300, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>Global PCA preserves semantic structure at render time</div>
            </div>
          </div>

          {/* React Three Fiber */}
          <div style={{ backgroundColor: "#131726", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1vw", padding: "3vh 3vw", display: "flex", gap: "2.5vw", alignItems: "flex-start" }}>
            <div style={{ width: "4vw", height: "4vw", backgroundColor: "rgba(79,127,255,0.15)", border: "1px solid rgba(79,127,255,0.25)", borderRadius: "0.8vw", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "2vw", height: "2vw", border: "0.3vw solid #4F7FFF", borderRadius: "0.3vw", transform: "rotate(15deg)" }} />
            </div>
            <div>
              <div style={{ fontSize: "1.9vw", fontWeight: 700, marginBottom: "1vh" }}>React Three Fiber</div>
              <div style={{ fontSize: "1.5vw", fontWeight: 300, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>Real-time 3D rendering of the semantic point cloud</div>
            </div>
          </div>

          {/* PostgreSQL */}
          <div style={{ backgroundColor: "#131726", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1vw", padding: "3vh 3vw", display: "flex", gap: "2.5vw", alignItems: "flex-start" }}>
            <div style={{ width: "4vw", height: "4vw", backgroundColor: "rgba(124,107,240,0.15)", border: "1px solid rgba(124,107,240,0.25)", borderRadius: "0.8vw", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "1.8vw", height: "1.8vw", borderRadius: "50% 50% 0 0", backgroundColor: "#7C6BF0", opacity: 0.9 }} />
            </div>
            <div>
              <div style={{ fontSize: "1.9vw", fontWeight: 700, marginBottom: "1vh" }}>Express + PostgreSQL</div>
              <div style={{ fontSize: "1.5vw", fontWeight: 300, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>REST API with Drizzle ORM for game state and leaderboards</div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: "5vh", left: "5vw", fontSize: "1.5vw", color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em" }}>EMBEDDINGUESSR</div>
      <div style={{ position: "absolute", bottom: "5vh", right: "5vw", fontSize: "1.5vw", color: "rgba(255,255,255,0.25)" }}>05 / 07</div>
    </div>
  );
}
