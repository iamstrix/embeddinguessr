export default function Slide2Concept() {
  return (
    <div
      className="relative w-screen h-screen overflow-hidden"
      style={{ backgroundColor: "#0C0F1A", fontFamily: "'Inter', sans-serif", color: "#FFFFFF", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}
    >
      {/* Background accents */}
      <div style={{ position: "absolute", top: "-10vh", right: "-5vw", width: "45vw", height: "45vw", borderRadius: "50%", backgroundColor: "#4F7FFF", opacity: 0.05, filter: "blur(9vw)" }} />
      <div style={{ position: "absolute", bottom: "-20vh", left: "-10vw", width: "50vw", height: "50vw", borderRadius: "50%", backgroundColor: "#7C6BF0", opacity: 0.05, filter: "blur(11vw)" }} />

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

      {/* 2-column content */}
      <div style={{ position: "relative", zIndex: 10, display: "flex", width: "88vw", alignItems: "center", gap: "5vw" }}>

        {/* Left: text */}
        <div style={{ flex: "0 0 36vw", display: "flex", flexDirection: "column", gap: "3vh" }}>
          <div style={{ display: "inline-block", alignSelf: "flex-start", padding: "0.6vh 1.4vw", backgroundColor: "rgba(79,127,255,0.15)", border: "1px solid rgba(79,127,255,0.3)", borderRadius: "2vw", color: "#4F7FFF", fontSize: "1.5vw", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Semantic Space
          </div>

          <div style={{ fontSize: "4vw", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.03em", textWrap: "balance" }}>
            Words have positions
          </div>

          <div style={{ fontSize: "1.7vw", fontWeight: 300, color: "rgba(255,255,255,0.62)", lineHeight: 1.65 }}>
            Language models encode every word as a vector in high-dimensional space. Similar words cluster together. EmbeddinGuessr makes that space visible and explorable.
          </div>
        </div>

        {/* Right: scatter plot mockup */}
        <div style={{ flex: "0 0 42vw", height: "64vh", backgroundColor: "#131726", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1.2vw", position: "relative", overflow: "hidden", boxShadow: "0 2vh 6vh rgba(0,0,0,0.45)" }}>

          {/* Inner grid */}
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundImage: "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "5vw 5vw", pointerEvents: "none" }} />

          {/* "Royalty" cluster — blue dots, top-left area */}
          <div style={{ position: "absolute", top: "18%", left: "22%", width: "1.4vw", height: "1.4vw", borderRadius: "50%", backgroundColor: "#4F7FFF", boxShadow: "0 0 1vw #4F7FFF" }} />
          <div style={{ position: "absolute", top: "14%", left: "27%", fontSize: "1.5vw", color: "rgba(255,255,255,0.55)", whiteSpace: "nowrap" }}>king</div>
          <div style={{ position: "absolute", top: "27%", left: "15%", width: "1.2vw", height: "1.2vw", borderRadius: "50%", backgroundColor: "#4F7FFF", opacity: 0.7 }} />
          <div style={{ position: "absolute", top: "28%", left: "20%", fontSize: "1.5vw", color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap" }}>queen</div>
          <div style={{ position: "absolute", top: "20%", left: "10%", width: "1vw", height: "1vw", borderRadius: "50%", backgroundColor: "#4F7FFF", opacity: 0.5 }} />
          <div style={{ position: "absolute", top: "17%", left: "14%", fontSize: "1.5vw", color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>throne</div>

          {/* "Water" cluster — teal dots, right-center area */}
          <div style={{ position: "absolute", top: "52%", left: "62%", width: "1.4vw", height: "1.4vw", borderRadius: "50%", backgroundColor: "#27C9B0", boxShadow: "0 0 1vw #27C9B0" }} />
          <div style={{ position: "absolute", top: "48%", left: "67%", fontSize: "1.5vw", color: "rgba(255,255,255,0.55)", whiteSpace: "nowrap" }}>ocean</div>
          <div style={{ position: "absolute", top: "63%", left: "56%", width: "1.1vw", height: "1.1vw", borderRadius: "50%", backgroundColor: "#27C9B0", opacity: 0.7 }} />
          <div style={{ position: "absolute", top: "64%", left: "61%", fontSize: "1.5vw", color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>river</div>
          <div style={{ position: "absolute", top: "56%", left: "72%", width: "1vw", height: "1vw", borderRadius: "50%", backgroundColor: "#27C9B0", opacity: 0.5 }} />
          <div style={{ position: "absolute", top: "53%", left: "76%", fontSize: "1.5vw", color: "rgba(255,255,255,0.3)", whiteSpace: "nowrap" }}>lake</div>

          {/* "Nature" cluster — green dots, bottom-left */}
          <div style={{ position: "absolute", top: "68%", left: "20%", width: "1.4vw", height: "1.4vw", borderRadius: "50%", backgroundColor: "#3EC178", boxShadow: "0 0 1vw #3EC178" }} />
          <div style={{ position: "absolute", top: "64%", left: "25%", fontSize: "1.5vw", color: "rgba(255,255,255,0.55)", whiteSpace: "nowrap" }}>forest</div>
          <div style={{ position: "absolute", top: "76%", left: "28%", width: "1.1vw", height: "1.1vw", borderRadius: "50%", backgroundColor: "#3EC178", opacity: 0.65 }} />
          <div style={{ position: "absolute", top: "74%", left: "33%", fontSize: "1.5vw", color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap" }}>tree</div>

          {/* Target marker — center, glowing warm red */}
          <div style={{ position: "absolute", top: "40%", left: "43%", width: "1.8vw", height: "1.8vw", borderRadius: "50%", backgroundColor: "#FF6B6B", boxShadow: "0 0 2vw rgba(255,107,107,0.7)" }} />
          <div style={{ position: "absolute", top: "36%", left: "48%", fontSize: "1.5vw", fontWeight: 600, color: "rgba(255,120,120,0.85)", whiteSpace: "nowrap" }}>? target</div>

          {/* Axis labels */}
          <div style={{ position: "absolute", bottom: "4%", left: "50%", transform: "translateX(-50%)", fontSize: "1.5vw", color: "rgba(255,255,255,0.18)", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>semantic dimension 1</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: "5vh", left: "5vw", fontSize: "1.5vw", color: "rgba(255,255,255,0.25)", letterSpacing: "0.08em" }}>EMBEDDINGUESSR</div>
      <div style={{ position: "absolute", bottom: "5vh", right: "5vw", fontSize: "1.5vw", color: "rgba(255,255,255,0.25)" }}>02 / 07</div>
    </div>
  );
}
