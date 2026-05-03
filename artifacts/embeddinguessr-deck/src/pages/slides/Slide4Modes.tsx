export default function Slide4Modes() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{ backgroundColor: "#0C0F1A", fontFamily: "'Inter', sans-serif", color: "#FFFFFF", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}
    >
      {/* Background accents */}
      <div style={{ position: "absolute", top: "-10vh", right: "0vw", width: "45vw", height: "45vw", borderRadius: "50%", backgroundColor: "#4F7FFF", opacity: 0.05, filter: "blur(10vw)" }} />
      <div style={{ position: "absolute", bottom: "-15vh", left: "0vw", width: "45vw", height: "45vw", borderRadius: "50%", backgroundColor: "#7C6BF0", opacity: 0.06, filter: "blur(10vw)" }} />

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
      <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", width: "84vw" }}>

        {/* Title */}
        <div style={{ fontSize: "4.5vw", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em", marginBottom: "6vh", textAlign: "center" }}>
          Two modes
        </div>

        {/* Two-column cards */}
        <div style={{ display: "flex", gap: "3vw", width: "100%" }}>

          {/* Daily */}
          <div style={{ flex: 1, backgroundColor: "#131726", border: "1px solid rgba(79,127,255,0.25)", borderRadius: "1.2vw", padding: "4vh 3.5vw", display: "flex", flexDirection: "column", gap: "2.5vh" }}>
            <div style={{ display: "inline-block", alignSelf: "flex-start", padding: "0.5vh 1.3vw", backgroundColor: "rgba(79,127,255,0.15)", border: "1px solid rgba(79,127,255,0.3)", borderRadius: "2vw", color: "#4F7FFF", fontSize: "1.5vw", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Daily
            </div>
            <div style={{ fontSize: "3vw", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em" }}>One word a day</div>
            <div style={{ width: "3vw", height: "2px", backgroundColor: "#4F7FFF" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "2vh" }}>
              <div style={{ display: "flex", gap: "1.2vw", alignItems: "flex-start" }}>
                <div style={{ marginTop: "0.4vh", width: "0.6vw", height: "0.6vw", borderRadius: "50%", backgroundColor: "#4F7FFF", flexShrink: 0 }} />
                <div style={{ fontSize: "1.7vw", fontWeight: 400, color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>One new word every day — globally shared</div>
              </div>
              <div style={{ display: "flex", gap: "1.2vw", alignItems: "flex-start" }}>
                <div style={{ marginTop: "0.4vh", width: "0.6vw", height: "0.6vw", borderRadius: "50%", backgroundColor: "#4F7FFF", flexShrink: 0 }} />
                <div style={{ fontSize: "1.7vw", fontWeight: 400, color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>Score goes on the global leaderboard</div>
              </div>
              <div style={{ display: "flex", gap: "1.2vw", alignItems: "flex-start" }}>
                <div style={{ marginTop: "0.4vh", width: "0.6vw", height: "0.6vw", borderRadius: "50%", backgroundColor: "#4F7FFF", flexShrink: 0 }} />
                <div style={{ fontSize: "1.7vw", fontWeight: 400, color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>Build a streak for every day you solve it</div>
              </div>
            </div>
          </div>

          {/* Endless */}
          <div style={{ flex: 1, backgroundColor: "#131726", border: "1px solid rgba(124,107,240,0.25)", borderRadius: "1.2vw", padding: "4vh 3.5vw", display: "flex", flexDirection: "column", gap: "2.5vh" }}>
            <div style={{ display: "inline-block", alignSelf: "flex-start", padding: "0.5vh 1.3vw", backgroundColor: "rgba(124,107,240,0.15)", border: "1px solid rgba(124,107,240,0.3)", borderRadius: "2vw", color: "#7C6BF0", fontSize: "1.5vw", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Endless
            </div>
            <div style={{ fontSize: "3vw", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em" }}>Unlimited rounds</div>
            <div style={{ width: "3vw", height: "2px", backgroundColor: "#7C6BF0" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "2vh" }}>
              <div style={{ display: "flex", gap: "1.2vw", alignItems: "flex-start" }}>
                <div style={{ marginTop: "0.4vh", width: "0.6vw", height: "0.6vw", borderRadius: "50%", backgroundColor: "#7C6BF0", flexShrink: 0 }} />
                <div style={{ fontSize: "1.7vw", fontWeight: 400, color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>Play as many rounds as you want</div>
              </div>
              <div style={{ display: "flex", gap: "1.2vw", alignItems: "flex-start" }}>
                <div style={{ marginTop: "0.4vh", width: "0.6vw", height: "0.6vw", borderRadius: "50%", backgroundColor: "#7C6BF0", flexShrink: 0 }} />
                <div style={{ fontSize: "1.7vw", fontWeight: 400, color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>Track your average guess count over time</div>
              </div>
              <div style={{ display: "flex", gap: "1.2vw", alignItems: "flex-start" }}>
                <div style={{ marginTop: "0.4vh", width: "0.6vw", height: "0.6vw", borderRadius: "50%", backgroundColor: "#7C6BF0", flexShrink: 0 }} />
                <div style={{ fontSize: "1.7vw", fontWeight: 400, color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>Rankings for best average scores</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: "5vh", left: "5vw", fontSize: "1.5vw", color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em" }}>EMBEDDINGUESSR</div>
      <div style={{ position: "absolute", bottom: "5vh", right: "5vw", fontSize: "1.5vw", color: "rgba(255,255,255,0.25)" }}>04 / 07</div>
    </div>
  );
}
