export default function Slide6Compete() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{ backgroundColor: "#0C0F1A", fontFamily: "'Inter', sans-serif", color: "#FFFFFF", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}
    >
      {/* Background accents */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "55vw", height: "55vw", borderRadius: "50%", backgroundColor: "#4F7FFF", opacity: 0.05, filter: "blur(14vw)" }} />
      <div style={{ position: "absolute", bottom: "-15vh", right: "-10vw", width: "40vw", height: "40vw", borderRadius: "50%", backgroundColor: "#7C6BF0", opacity: 0.07, filter: "blur(9vw)" }} />

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

        {/* Left-aligned heading block */}
        <div style={{ width: "100%", marginBottom: "5vh" }}>
          <div style={{ display: "inline-block", padding: "0.5vh 1.4vw", backgroundColor: "rgba(124,107,240,0.15)", border: "1px solid rgba(124,107,240,0.3)", borderRadius: "2vw", color: "#7C6BF0", fontSize: "1.5vw", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "2.5vh" }}>
            Leaderboard
          </div>
          <div style={{ fontSize: "4.5vw", fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.03em" }}>
            Compete
          </div>
        </div>

        {/* 2x2 feature grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2vw", width: "100%" }}>

          {/* Accounts */}
          <div style={{ backgroundColor: "#131726", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1vw", padding: "3vh 3vw" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1vw", marginBottom: "1.5vh" }}>
              <div style={{ width: "0.5vw", height: "3vh", backgroundColor: "#4F7FFF", borderRadius: "0.2vw" }} />
              <div style={{ fontSize: "1.9vw", fontWeight: 700 }}>Player accounts</div>
            </div>
            <div style={{ fontSize: "1.5vw", fontWeight: 300, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
              Create a username and password. Scores are tied to your account across sessions.
            </div>
          </div>

          {/* Daily leaderboard */}
          <div style={{ backgroundColor: "#131726", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1vw", padding: "3vh 3vw" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1vw", marginBottom: "1.5vh" }}>
              <div style={{ width: "0.5vw", height: "3vh", backgroundColor: "#4F7FFF", borderRadius: "0.2vw" }} />
              <div style={{ fontSize: "1.9vw", fontWeight: 700 }}>Daily leaderboard</div>
            </div>
            <div style={{ fontSize: "1.5vw", fontWeight: 300, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
              Live rankings for today's puzzle. See where your guess count places you.
            </div>
          </div>

          {/* Streaks */}
          <div style={{ backgroundColor: "#131726", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1vw", padding: "3vh 3vw" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1vw", marginBottom: "1.5vh" }}>
              <div style={{ width: "0.5vw", height: "3vh", backgroundColor: "#7C6BF0", borderRadius: "0.2vw" }} />
              <div style={{ fontSize: "1.9vw", fontWeight: 700 }}>Streak tracking</div>
            </div>
            <div style={{ fontSize: "1.5vw", fontWeight: 300, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
              Daily solve streaks with longest-streak records for each player.
            </div>
          </div>

          {/* Endless stats */}
          <div style={{ backgroundColor: "#131726", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1vw", padding: "3vh 3vw" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1vw", marginBottom: "1.5vh" }}>
              <div style={{ width: "0.5vw", height: "3vh", backgroundColor: "#7C6BF0", borderRadius: "0.2vw" }} />
              <div style={{ fontSize: "1.9vw", fontWeight: 700 }}>Endless statistics</div>
            </div>
            <div style={{ fontSize: "1.5vw", fontWeight: 300, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
              Average guess count across all endless rounds, ranked globally.
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: "5vh", left: "5vw", fontSize: "1.5vw", color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em" }}>EMBEDDINGUESSR</div>
      <div style={{ position: "absolute", bottom: "5vh", right: "5vw", fontSize: "1.5vw", color: "rgba(255,255,255,0.25)" }}>06 / 07</div>
    </div>
  );
}
