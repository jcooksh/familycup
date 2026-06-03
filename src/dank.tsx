import * as React from "react"

// ── MLG airhorn, synthesised so there are no audio assets to ship ──
export function playAirhorn() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const now = ctx.currentTime
    ;[0, 0.26, 0.52].forEach((t) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = "sawtooth"
      o.frequency.setValueAtTime(420, now + t)
      o.frequency.linearRampToValueAtTime(470, now + t + 0.2)
      g.gain.setValueAtTime(0.0001, now + t)
      g.gain.exponentialRampToValueAtTime(0.35, now + t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.22)
      o.connect(g).connect(ctx.destination)
      o.start(now + t)
      o.stop(now + t + 0.24)
    })
    setTimeout(() => ctx.close(), 1600)
  } catch {
    /* audio not allowed — silent */
  }
}

// little "oof" on the way out
export function playOof() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const now = ctx.currentTime
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = "square"
    o.frequency.setValueAtTime(300, now)
    o.frequency.exponentialRampToValueAtTime(80, now + 0.25)
    g.gain.setValueAtTime(0.25, now)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.28)
    o.connect(g).connect(ctx.destination)
    o.start(now)
    o.stop(now + 0.3)
    setTimeout(() => ctx.close(), 500)
  } catch {
    /* silent */
  }
}

const MEMES = ["🔥", "💯", "😎", "🌿", "🥦", "🍩", "🥤", "🐸", "💪", "🎯", "⚡", "🤑", "👽", "🛹", "💸", "🚀"]

// falling-emoji layer that rains while dank mode is on
export function DankFx() {
  const items = React.useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        dur: 4 + Math.random() * 6,
        delay: Math.random() * 5,
        size: 22 + Math.random() * 34,
        emoji: MEMES[Math.floor(Math.random() * MEMES.length)],
      })),
    []
  )
  return (
    <div className="dank-fx" aria-hidden>
      {items.map((it) => (
        <span
          key={it.id}
          className="dank-emoji"
          style={{
            left: `${it.left}%`,
            fontSize: it.size,
            animationDuration: `${it.dur}s`,
            animationDelay: `${it.delay}s`,
          }}
        >
          {it.emoji}
        </span>
      ))}
    </div>
  )
}
