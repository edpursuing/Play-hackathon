import OpenAI from 'openai'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProd = process.env.NODE_ENV === 'production'

const app = express()
app.use(cors({
  origin: isProd
    ? (process.env.ALLOWED_ORIGIN || false)
    : ['http://localhost:5173', 'http://localhost:5174'],
}))
app.use(express.json())

const openai = new OpenAI() // reads OPENAI_API_KEY from env

const PERSONAS = {
  tony: {
    label: 'Tony Soprano',
    role: 'The "Enforcer."',
    voice: 'Focuses on respect, "family" loyalty, and ruthless pragmatism. Language is blunt, aggressive, and uses mob metaphors.',
    shortName: 'Tony',
    color: '#7f1d1d',
  },
  dave: {
    label: 'Dave Chappelle',
    role: 'The "Truth-Teller."',
    voice: "Focuses on social absurdity and 'keeping it real.' Uses observational humor and cynical real talk to dismantle the others' points.",
    shortName: 'Dave',
    color: '#b45309',
  },
  elle: {
    label: 'Elle Woods',
    role: 'The "Strategist."',
    voice: 'Focuses on "signature moves," aesthetic presentation, and the power of being underestimated. Uses bubbly, high-energy legal/fashion jargon.',
    shortName: 'Elle',
    color: '#f472b6',
  },
  sonia: {
    label: 'Sonia Sotomayor',
    role: 'The "Justice."',
    voice: 'Focuses on ethics, personal history, and the long-term "precedent" of the decision. Language is measured and judicial.',
    shortName: 'Sonia',
    color: '#1e3a8a',
  },
}

app.post('/api/convene', async (req, res) => {
  const { dilemma, activePersonas } = req.body

  if (!dilemma?.trim() || !activePersonas?.length || activePersonas.length < 2) {
    return res.status(400).json({ error: 'Need a dilemma and at least 2 personas.' })
  }

  const personas = activePersonas.map(id => PERSONAS[id]).filter(Boolean)
  if (personas.length < 2) {
    return res.status(400).json({ error: 'Unrecognised persona IDs.' })
  }

  const personaBlock = personas
    .map(p => `${p.label}: ${p.role}\n${p.voice}`)
    .join('\n\n')

  const debateSlots = personas
    .map(p => `    { "name": "${p.shortName}", "text": "...", "color": "${p.color}" }`)
    .join(',\n')

  const systemMessage = `You are a high-stakes decision council. Based on the user's dilemma, write a debate between these specific personas. They MUST disagree with and undercut each other's logic:

${personaBlock}

Return ONLY a valid JSON object in exactly this structure:
{
  "debate": [
${debateSlots}
  ],
  "insight": "A single, actionable Residual Insight that synthesises these conflicting perspectives into one clear recommendation."
}

Rules:
- Each "text" must be 1-2 punchy sentences in that persona's unmistakable voice.
- Each persona must directly or implicitly refute at least one other's reasoning.
- The "insight" is concrete, specific, and actionable — never a platitude.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: `My dilemma: ${dilemma.trim()}` },
      ],
      max_tokens: 2048,
    })

    const data = JSON.parse(completion.choices[0].message.content)
    res.json(data)
  } catch (err) {
    console.error('[/api/convene]', err.message)
    res.status(500).json({ error: err.message })
  }
})

if (isProd) {
  app.use(express.static(path.join(__dirname, 'dist')))
  app.use((_req, res) => res.sendFile(path.join(__dirname, 'dist', 'index.html')))
}

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Council API  →  http://localhost:${PORT}`)
})
