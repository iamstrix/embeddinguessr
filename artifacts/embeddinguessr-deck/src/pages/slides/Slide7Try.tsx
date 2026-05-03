export default function Slide7Try() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{ backgroundColor: "#0C0F1A", fontFamily: "'Inter', sans-serif", color: "#FFFFFF", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}
    >
      {/* Background accents */}
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "65vw", height: "65vw", borderRadius: "50%", backgroundColor: "#4F7FFF", opacity: 0.07, filter: "blur(16vw)" }} />
      <div style={{ position: "absolute", bottom: "-20vh", right: "-10vw", width: "45vw", height: "45vw", borderRadius: "50%", backgroundColor: "#7C6BF0", opacity: 0.09, filter: "blur(9vw)" }} />

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

      {/* Center glass card */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", maxWidth: "58vw", padding: "6vh 5vw", backgroundColor: "rgba(19,23,38,0.7)", backdropFilter: "blur(2vw)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "2vw", boxShadow: "0 4vh 8vh rgba(0,0,0,0.5)" }}>

        {/* Icon */}
        <div style={{ width: "5vw", height: "5vw", backgroundColor: "rgba(79,127,255,0.2)", border: "1px solid rgba(79,127,255,0.35)", borderRadius: "1.2vw", marginBottom: "3.5vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "2vw", height: "2vw", backgroundColor: "#4F7FFF", borderRadius: "0.4vw" }} />
        </div>

        {/* Title */}
        <div style={{ fontSize: "5vw", fontWeight: 800, lineHeight: 1.0, letterSpacing: "-0.04em", marginBottom: "2vh" }}>
          Try it
        </div>

        {/* Subtitle */}
        <div style={{ fontSize: "1.7vw", fontWeight: 300, color: "rgba(255,255,255,0.6)", marginBottom: "5vh", lineHeight: 1.55, maxWidth: "44vw", textWrap: "balance" }}>
          Create an account, make your first guess, and navigate semantic space toward the hidden word.
        </div>

        {/* URL block */}
        <div style={{ width: "100%", padding: "2.5vh 3vw", backgroundColor: "rgba(79,127,255,0.1)", border: "1px solid rgba(79,127,255,0.25)", borderRadius: "1vw", marginBottom: "4vh" }}>
          <div style={{ fontSize: "1.5vw", fontWeight: 500, color: "rgba(255,255,255,0.4)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "1.2vh" }}>Play now</div>
          <div style={{ fontSize: "2.2vw", fontWeight: 700, color: "#4F7FFF", letterSpacing: "-0.01em" }}>your-project.replit.app</div>
        </div>

        {/* Three bottom pills */}
        <div style={{ display: "flex", gap: "2vw", justifyContent: "center" }}>
          <div style={{ padding: "0.8vh 1.8vw", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.5vw", fontSize: "1.5vw", fontWeight: 500, color: "rgba(255,255,255,0.55)" }}>Free to play</div>
          <div style={{ padding: "0.8vh 1.8vw", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.5vw", fontSize: "1.5vw", fontWeight: 500, color: "rgba(255,255,255,0.55)" }}>No install required</div>
          <div style={{ padding: "0.8vh 1.8vw", backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.5vw", fontSize: "1.5vw", fontWeight: 500, color: "rgba(255,255,255,0.55)" }}>Daily word resets at midnight</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: "5vh", left: "5vw", fontSize: "1.5vw", color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em" }}>EMBEDDINGUESSR</div>
      <div style={{ position: "absolute", bottom: "5vh", right: "5vw", fontSize: "1.5vw", color: "rgba(255,255,255,0.25)" }}>07 / 07</div>
    </div>
  );
}
