import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './index.css'

// ─── Data ────────────────────────────────────────────────────────────────────

const VIALS = [
  { id: 'tony',  name: 'Tony Soprano',      abbr: 'TS', role: 'The Enforcer',     color: '#cc2222', glow: 'rgba(204,34,34,0.5)',   ring: '#ff4444', emoji: '🤌' },
  { id: 'dave',  name: 'Dave Chappelle',    abbr: 'DC', role: 'The Truth-Teller', color: '#22aa44', glow: 'rgba(34,170,68,0.5)',   ring: '#44ff77', emoji: '🎤' },
  { id: 'elle',  name: 'Elle Woods',        abbr: 'EW', role: 'The Strategist',   color: '#cc44aa', glow: 'rgba(204,68,170,0.5)',  ring: '#ff77dd', emoji: '💅' },
  { id: 'sonia', name: 'Sonia Sotomayor',   abbr: 'SS', role: 'The Justice',      color: '#2255cc', glow: 'rgba(34,85,204,0.5)',   ring: '#4488ff', emoji: '⚖️' },
]

// Short names from API → vial IDs
const NAME_TO_ID = { Tony: 'tony', Dave: 'dave', Elle: 'elle', Sonia: 'sonia' }

// ─── Sub-components ──────────────────────────────────────────────────────────

function SoupParticle({ color, delay }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: Math.random() * 6 + 3,
        height: Math.random() * 6 + 3,
        background: color,
        opacity: 0.3,
        left: `${Math.random() * 80 + 10}%`,
        top: `${Math.random() * 80 + 10}%`,
      }}
      animate={{ y: [0, -10, 4, 0], opacity: [0.2, 0.5, 0.2], scale: [1, 1.3, 0.9, 1] }}
      transition={{ duration: 3 + Math.random() * 2, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  )
}

function VialInSoup({ vial, index, total, onClick, isConvening, isSpeaking }) {
  const angle    = total === 1 ? 0 : (index / total) * Math.PI * 2 - Math.PI / 2
  const radius   = total <= 2 ? 58 : total === 3 ? 68 : 75
  const orbitX   = total === 1 ? 0 : Math.cos(angle) * radius
  const orbitY   = total === 1 ? 0 : Math.sin(angle) * radius
  const collapsed = isConvening

  return (
    <motion.button
      className="absolute flex flex-col items-center justify-center rounded-full border-2 select-none overflow-visible"
      style={{
        width: 60, height: 60,
        top: 'calc(50% - 30px)',
        left: 'calc(50% - 30px)',
        background: `radial-gradient(circle at 35% 35%, ${vial.color}cc, ${vial.color}88)`,
        borderColor: isSpeaking ? vial.ring : `${vial.ring}99`,
        boxShadow: isSpeaking
          ? `0 0 28px 10px ${vial.glow}, inset 0 1px 0 rgba(255,255,255,0.2)`
          : `0 0 14px 4px ${vial.glow}88, inset 0 1px 0 rgba(255,255,255,0.12)`,
        cursor: collapsed ? 'default' : 'pointer',
        zIndex: isSpeaking ? 20 : 10,
      }}
      initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
      animate={{
        x: collapsed ? 0 : orbitX,
        y: collapsed ? 0 : orbitY,
        scale: collapsed ? 0.78 : 1,
        opacity: 1,
      }}
      exit={{ scale: 0, opacity: 0, x: 0, y: 0 }}
      transition={{ type: 'spring', stiffness: 160, damping: 22 }}
      whileHover={!collapsed ? { scale: 1.1 } : {}}
      whileTap={!collapsed ? { scale: 0.9 } : {}}
      onClick={!collapsed ? onClick : undefined}
      title={!collapsed ? `Remove ${vial.name}` : undefined}
    >
      {/* Speaking glow ring */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            className="absolute inset-[-6px] rounded-full pointer-events-none"
            style={{ border: `2px solid ${vial.ring}`, boxShadow: `0 0 20px 6px ${vial.glow}` }}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: [0.8, 1.35, 1.0], opacity: [0, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* Inner content — jump when speaking */}
      <motion.div
        className="flex flex-col items-center pointer-events-none"
        animate={isSpeaking ? { scale: [1, 1.35, 0.92, 1.08, 1], y: [0, -9, 1, -4, 0] } : {}}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      >
        <span className="text-xl leading-none select-none">{vial.emoji}</span>
        <span className="text-[9px] font-bold tracking-widest mt-0.5" style={{ color: 'rgba(255,255,255,0.9)' }}>
          {vial.abbr}
        </span>
      </motion.div>
    </motion.button>
  )
}

function DebateBubble({ entry }) {
  return (
    <div className="flex gap-3 items-start">
      <div
        className="w-[3px] shrink-0 rounded-full self-stretch"
        style={{ background: entry.color, boxShadow: `0 0 8px 2px ${entry.color}88`, minHeight: 40 }}
      />
      <div className="flex-1 min-w-0">
        <span className="text-[9px] font-bold tracking-[0.3em] uppercase block mb-1" style={{ color: entry.color }}>
          {entry.name}
        </span>
        <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.82)' }}>
          {entry.text}
        </p>
      </div>
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [inSoup,        setInSoup]        = useState(new Set())
  const [dilemma,       setDilemma]       = useState('')
  const [phase,         setPhase]         = useState('idle')     // 'idle' | 'convening' | 'complete'
  const [debate,        setDebate]        = useState(null)
  const [revealedCount, setRevealedCount] = useState(0)
  const [showInsight,   setShowInsight]   = useState(false)
  const [speakingId,    setSpeakingId]    = useState(null)
  const [apiError,      setApiError]      = useState(null)

  const soupVials  = VIALS.filter(v => inSoup.has(v.id))
  const isConvening = phase === 'convening'
  const isComplete  = phase === 'complete'
  const canConvene  = inSoup.size >= 2 && dilemma.trim().length > 0 && phase === 'idle'

  // ── Staggered reveal once debate data arrives ──────────────────────────────
  useEffect(() => {
    if (phase !== 'complete' || !debate) return

    setRevealedCount(0)
    setShowInsight(false)
    setSpeakingId(null)

    const timeouts = []
    const entries  = debate.debate ?? []

    entries.forEach((entry, i) => {
      timeouts.push(
        setTimeout(() => {
          setRevealedCount(i + 1)
          const id = NAME_TO_ID[entry.name]
          if (id) {
            setSpeakingId(id)
            timeouts.push(setTimeout(() => setSpeakingId(null), 550))
          }
        }, i * 800),
      )
    })

    // insight appears 1 s after the last bubble
    timeouts.push(
      setTimeout(() => setShowInsight(true), (entries.length - 1) * 800 + 1000),
    )

    return () => timeouts.forEach(clearTimeout)
  }, [phase, debate])

  // ── Actions ────────────────────────────────────────────────────────────────
  const toggleVial = id => {
    if (phase !== 'idle') return
    setInSoup(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
    setDebate(null)
    setApiError(null)
  }

  const dissolveCouncil = () => {
    setInSoup(new Set())
    setDilemma('')
    setPhase('idle')
    setDebate(null)
    setRevealedCount(0)
    setShowInsight(false)
    setSpeakingId(null)
    setApiError(null)
  }

  const handleConvene = async () => {
    if (!canConvene) return
    setPhase('convening')
    setDebate(null)
    setApiError(null)

    try {
      const res  = await fetch('/api/convene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dilemma: dilemma.trim(), activePersonas: Array.from(inSoup) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Server error')
      setDebate(data)
      setPhase('complete')
    } catch (err) {
      setApiError(err.message)
      setPhase('idle')
    }
  }

  // Dynamic loading label
  const loadingRoles = soupVials.map(v => v.role)
  const loadingLabel = loadingRoles.length <= 2
    ? loadingRoles.join(' & ')
    : loadingRoles.slice(0, -1).join(', ') + ' & ' + loadingRoles.at(-1)

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden" style={{ background: '#0a0a0a' }}>

      {/* Ambient grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(80,220,120,1) 1px, transparent 1px), linear-gradient(90deg, rgba(80,220,120,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Scanline sweep */}
      <motion.div
        className="absolute left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(80,220,120,0.15), transparent)' }}
        animate={{ top: ['-2%', '102%'] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      />

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-20">
        <p className="text-[9px] font-bold tracking-[0.3em] text-center mb-1" style={{ color: 'rgba(80,220,120,0.4)' }}>
          VIALS
        </p>

        {VIALS.map(vial => {
          const active = inSoup.has(vial.id)
          const locked = phase !== 'idle'
          return (
            <motion.button
              key={vial.id}
              className="relative flex flex-col items-center justify-center rounded-full border-2 select-none"
              style={{
                width: 68, height: 68,
                background: active ? 'rgba(255,255,255,0.03)' : `radial-gradient(circle at 35% 35%, ${vial.color}dd, ${vial.color}77)`,
                borderColor: active ? 'rgba(255,255,255,0.08)' : vial.ring,
                boxShadow: active ? 'none' : `0 0 20px 5px ${vial.glow}, inset 0 1px 0 rgba(255,255,255,0.15)`,
                opacity: active ? 0.28 : 1,
                cursor: locked ? 'default' : 'pointer',
              }}
              onClick={() => toggleVial(vial.id)}
              whileHover={!active && !locked ? { scale: 1.1 } : {}}
              whileTap={!locked ? { scale: 0.92 } : {}}
            >
              <AnimatePresence mode="wait">
                {!active ? (
                  <motion.div key="a" className="flex flex-col items-center" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.15 }}>
                    <span className="text-2xl leading-none">{vial.emoji}</span>
                    <span className="text-[8px] font-bold tracking-widest mt-1" style={{ color: 'rgba(255,255,255,0.85)' }}>{vial.abbr}</span>
                  </motion.div>
                ) : (
                  <motion.span key="e" className="text-lg opacity-40" initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}>○</motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          )
        })}

        <div className="mt-1 space-y-1.5">
          {VIALS.map(vial => (
            <div key={vial.id} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: vial.color, boxShadow: `0 0 4px ${vial.glow}` }} />
              <span className="text-[9px] leading-tight whitespace-nowrap" style={{ color: inSoup.has(vial.id) ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.22)' }}>
                {vial.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── THE SOUP ────────────────────────────────────────────────────────── */}
      {/* Wrapper lifts soup up when results are showing */}
      <motion.div
        className="relative flex items-center justify-center"
        animate={{ y: isComplete ? -80 : 0 }}
        transition={{ type: 'spring', stiffness: 110, damping: 22, delay: isComplete ? 0.3 : 0 }}
      >
        {/* Breathing outer rings — pulse faster when convening */}
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{ width: 320, height: 320, border: '1px solid rgba(80,220,120,0.08)' }}
          animate={{ scale: isConvening ? [1, 1.06, 1] : [1, 1.04, 1], opacity: isConvening ? [0.6, 1, 0.6] : [0.5, 0.8, 0.5] }}
          transition={{ duration: isConvening ? 1.2 : 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{ width: 365, height: 365, border: '1px solid rgba(80,220,120,0.04)' }}
          animate={{ scale: isConvening ? [1, 1.09, 1] : [1, 1.06, 1], opacity: isConvening ? [0.5, 0.9, 0.5] : [0.3, 0.6, 0.3] }}
          transition={{ duration: isConvening ? 1.6 : 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        />

        {/* The Soup circle — Framer Motion drives glow directly */}
        <motion.div
          className="relative rounded-full overflow-hidden"
          style={{
            width: 280, height: 280,
            background: 'radial-gradient(ellipse at 40% 35%, rgba(80,220,120,0.12) 0%, rgba(30,80,50,0.08) 50%, rgba(10,20,15,0.15) 100%)',
            border: '1.5px solid rgba(80,220,120,0.2)',
          }}
          animate={{
            scale: isConvening
              ? [1, 1.018, 0.995, 1.012, 1]
              : [1, 1.015, 0.992, 1.008, 1],
            boxShadow: isConvening
              ? [
                  '0 0 80px 28px rgba(80,220,120,0.28), inset 0 0 100px 30px rgba(80,220,120,0.1)',
                  '0 0 140px 55px rgba(80,220,120,0.55), inset 0 0 150px 55px rgba(80,220,120,0.22)',
                  '0 0 80px 28px rgba(80,220,120,0.28), inset 0 0 100px 30px rgba(80,220,120,0.1)',
                ]
              : [
                  '0 0 50px 15px rgba(80,220,120,0.1), inset 0 0 80px 20px rgba(80,220,120,0.04)',
                  '0 0 70px 25px rgba(80,220,120,0.16), inset 0 0 100px 30px rgba(80,220,120,0.07)',
                  '0 0 50px 15px rgba(80,220,120,0.1), inset 0 0 80px 20px rgba(80,220,120,0.04)',
                ],
          }}
          transition={{
            scale:     { duration: isConvening ? 1.8 : 5, repeat: Infinity, ease: 'easeInOut' },
            boxShadow: { duration: isConvening ? 1.0 : 5, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          {/* Rotating sweep — only while convening */}
          <AnimatePresence>
            {isConvening && (
              <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0%, transparent 55%, rgba(80,220,120,0.06) 70%, rgba(80,220,120,0.22) 82%, rgba(80,220,120,0.06) 94%, transparent 100%)',
                }}
                initial={{ opacity: 0 }}
                animate={{ rotate: [0, 360], opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  rotate:  { duration: 1.8, repeat: Infinity, ease: 'linear' },
                  opacity: { duration: 0.4 },
                }}
              />
            )}
          </AnimatePresence>

          {/* Ambient particles for active vials */}
          {soupVials.flatMap((vial, i) => [
            <SoupParticle key={`pa-${vial.id}`} color={vial.color} delay={i * 0.4} />,
            <SoupParticle key={`pb-${vial.id}`} color={vial.color} delay={i * 0.4 + 1.2} />,
          ])}

          {/* ── EMPTY state label ── */}
          <AnimatePresence>
            {inSoup.size === 0 && phase === 'idle' && (
              <motion.div
                className="soup-label absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}
              >
                <span className="text-[11px] font-bold tracking-[0.4em] uppercase" style={{ color: 'rgba(80,220,120,0.5)' }}>THE</span>
                <span className="text-3xl font-bold tracking-[0.25em] uppercase mt-0.5" style={{ color: 'rgba(80,220,120,0.65)' }}>SOUP</span>
                <span className="text-[9px] tracking-widest mt-2" style={{ color: 'rgba(80,220,120,0.4)' }}>add a vial to begin</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── CONVENING loading overlay ── */}
          <AnimatePresence>
            {isConvening && (
              <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
              >
                {/* Counter-rotating rings */}
                <motion.div
                  className="absolute rounded-full"
                  style={{ width: 210, height: 210, border: '1.5px solid transparent', borderTopColor: 'rgba(80,220,120,0.55)', borderRightColor: 'rgba(80,220,120,0.2)' }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                  className="absolute rounded-full"
                  style={{ width: 170, height: 170, border: '1px solid transparent', borderBottomColor: 'rgba(80,220,120,0.35)', borderLeftColor: 'rgba(80,220,120,0.15)' }}
                  animate={{ rotate: -360 }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                />
                <motion.p
                  className="text-[9px] tracking-[0.22em] text-center leading-loose"
                  style={{ color: 'rgba(80,220,120,0.75)', maxWidth: 168 }}
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                >
                  {loadingLabel}
                  <br />
                  <span style={{ color: 'rgba(80,220,120,0.4)' }}>are debating...</span>
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Vials in soup */}
          <AnimatePresence>
            {soupVials.map((vial, i) => (
              <VialInSoup
                key={vial.id}
                vial={vial}
                index={i}
                total={soupVials.length}
                onClick={() => toggleVial(vial.id)}
                isConvening={isConvening || isComplete}
                isSpeaking={speakingId === vial.id}
              />
            ))}
          </AnimatePresence>

          {/* "THE SOUP" ghost label when vials present + idle */}
          <AnimatePresence>
            {inSoup.size > 0 && phase === 'idle' && (
              <motion.span
                className="absolute bottom-3 left-0 right-0 text-center text-[8px] tracking-[0.4em] pointer-events-none"
                style={{ color: 'rgba(80,220,120,0.28)' }}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                THE SOUP
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* ── DEBATE PANEL ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isComplete && debate && (
          <motion.div
            className="absolute z-20"
            style={{ left: 152, right: 14, top: 'calc(50% + 82px)', bottom: 14, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'rgba(80,220,120,0.15) transparent' }}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ delay: 0.15, duration: 0.4, ease: 'easeOut' }}
          >
            <div
              className="rounded-2xl p-5 flex flex-col gap-4"
              style={{
                background: 'rgba(8,8,8,0.94)',
                border: '1px solid rgba(80,220,120,0.14)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
              }}
            >
              {/* Staggered debate bubbles */}
              <div className="flex flex-col gap-4">
                <AnimatePresence>
                  {(debate.debate ?? []).slice(0, revealedCount).map((entry, i) => (
                    <motion.div
                      key={entry.name}
                      initial={{ opacity: 0, x: -14, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                      transition={{ duration: 0.45, ease: 'easeOut' }}
                    >
                      <DebateBubble entry={entry} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Gold Insight Card */}
              <AnimatePresence>
                {showInsight && debate.insight && (
                  <motion.div
                    className="rounded-xl p-4"
                    style={{
                      background: 'linear-gradient(135deg, rgba(184,142,4,0.18) 0%, rgba(120,90,0,0.12) 100%)',
                      border: '1px solid rgba(212,175,55,0.45)',
                      boxShadow: '0 0 32px rgba(180,140,0,0.18), inset 0 1px 0 rgba(255,215,0,0.08)',
                    }}
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <p className="text-[9px] font-bold tracking-[0.35em] uppercase mb-2" style={{ color: 'rgba(212,175,55,0.6)' }}>
                      ✦ RESIDUAL INSIGHT
                    </p>
                    <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,220,100,0.88)' }}>
                      {debate.insight}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* DISSOLVE COUNCIL button */}
              <AnimatePresence>
                {showInsight && (
                  <motion.div
                    className="flex justify-end mt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <motion.button
                      className="px-5 py-2.5 rounded-lg text-[10px] font-bold tracking-[0.25em] uppercase"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,80,80,0.3)',
                        color: 'rgba(255,120,120,0.7)',
                        cursor: 'pointer',
                      }}
                      whileHover={{
                        background: 'rgba(255,60,60,0.1)',
                        borderColor: 'rgba(255,80,80,0.65)',
                        color: 'rgba(255,140,140,1)',
                        boxShadow: '0 0 16px rgba(255,60,60,0.15)',
                      }}
                      whileTap={{ scale: 0.97 }}
                      onClick={dissolveCouncil}
                    >
                      DISSOLVE COUNCIL
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BOTTOM INPUT BAR ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {!isComplete && (
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
            style={{ width: 'calc(100% - 180px)', maxWidth: 680 }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3 }}
          >
            {/* API error */}
            <AnimatePresence>
              {apiError && (
                <motion.div
                  className="w-full rounded-lg px-4 py-2.5 text-center"
                  style={{
                    background: 'rgba(255,60,60,0.08)',
                    border: '1px solid rgba(255,80,80,0.3)',
                  }}
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                >
                  <p className="text-[11px] font-bold tracking-wider" style={{ color: 'rgba(255,140,140,0.9)' }}>
                    The Council is currently in recess.
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,140,140,0.55)' }}>
                    Check your API Key and try again.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input row */}
            <div className="w-full flex gap-3 items-stretch">
              <input
                type="text"
                value={dilemma}
                onChange={e => setDilemma(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConvene()}
                placeholder="What is your dilemma?"
                disabled={phase !== 'idle'}
                className="flex-1 rounded-lg px-4 py-3 text-sm outline-none"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.8)',
                  caretColor: 'rgba(80,220,120,0.8)',
                  opacity: phase !== 'idle' ? 0.45 : 1,
                }}
              />

              <motion.button
                className="relative rounded-lg px-5 py-3 text-xs font-bold tracking-[0.18em] uppercase whitespace-nowrap overflow-hidden"
                style={{
                  background: canConvene ? 'linear-gradient(135deg, rgba(80,220,120,0.18), rgba(80,220,120,0.08))' : 'rgba(255,255,255,0.03)',
                  border: canConvene ? '1px solid rgba(80,220,120,0.45)' : '1px solid rgba(255,255,255,0.07)',
                  color: canConvene ? 'rgba(80,220,120,0.9)' : 'rgba(255,255,255,0.18)',
                  boxShadow: canConvene ? '0 0 20px rgba(80,220,120,0.15)' : 'none',
                  cursor: canConvene ? 'pointer' : 'not-allowed',
                  transition: 'all 0.4s ease',
                }}
                onClick={handleConvene}
                disabled={!canConvene}
                whileHover={canConvene ? { scale: 1.03 } : {}}
                whileTap={canConvene ? { scale: 0.97 } : {}}
              >
                {canConvene && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(80,220,120,0.08) 50%, transparent 70%)' }}
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                  />
                )}
                {isConvening ? (
                  <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                    CONVENING...
                  </motion.span>
                ) : 'CONVENE THE COUNCIL'}
              </motion.button>
            </div>

            {/* Status hint */}
            <motion.p
              className="text-[9px] tracking-widest text-center"
              style={{ color: 'rgba(255,255,255,0.18)' }}
              animate={{ opacity: canConvene || phase !== 'idle' ? 0 : 1 }}
            >
              {inSoup.size === 0
                ? 'ADD AT LEAST 2 VIALS & ENTER YOUR DILEMMA'
                : inSoup.size === 1 ? 'ONE MORE VIAL NEEDED'
                : !dilemma.trim() ? 'ENTER YOUR DILEMMA TO ACTIVATE'
                : ''}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TITLE ───────────────────────────────────────────────────────────── */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center pointer-events-none z-10">
        <motion.h1
          className="text-xs font-bold tracking-[0.6em] uppercase"
          style={{ color: 'rgba(80,220,120,0.35)' }}
          animate={{ opacity: [0.35, 0.5, 0.35] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          PERSONA PARTICLE ACCELERATOR
        </motion.h1>
        <motion.p
          className="text-[28px] font-bold tracking-[0.3em] mt-0.5"
          style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'Space Grotesk, sans-serif' }}
          animate={{ textShadow: ['0 0 30px rgba(80,220,120,0.2)', '0 0 40px rgba(80,220,120,0.4)', '0 0 30px rgba(80,220,120,0.2)'] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          OOZE
        </motion.p>
      </div>

      {/* ── COUNCIL READOUT (top-right) ─────────────────────────────────────── */}
      <AnimatePresence>
        {inSoup.size >= 2 && phase === 'idle' && (
          <motion.div
            className="absolute top-6 right-6 text-right z-10"
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
          >
            <p className="text-[8px] tracking-[0.35em] mb-1.5" style={{ color: 'rgba(80,220,120,0.35)' }}>COUNCIL ASSEMBLED</p>
            {soupVials.map(vial => (
              <motion.div key={vial.id} className="flex items-center gap-2 justify-end mb-1" initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }}>
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{vial.name}</span>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: vial.color, boxShadow: `0 0 5px ${vial.glow}` }} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
