import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

const DEFAULT_MODEL = 'claude-sonnet-4-6'

const SYSTEM_PROMPT =
  'You are a senior penetration tester writing a professional, client-ready security finding. ' +
  'Given the vulnerability title and optional context, write three sections — Description (what it is ' +
  'and where), Impact (business/technical consequence), Recommendation (concrete remediation steps). ' +
  'Be accurate and concise; do not invent specifics (versions, endpoints, data) that are not given. ' +
  'Plain professional prose, no markdown headers.'

const DraftOutputSchema = z.object({
  description: z.string(),
  impact: z.string(),
  recommendation: z.string(),
})

export type DraftOutput = z.infer<typeof DraftOutputSchema>

export interface DraftInput {
  title: string
  affectedComponent?: string | null
  notes?: string | null
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

export async function draftFinding(input: DraftInput): Promise<DraftOutput> {
  if (!isAiConfigured()) throw new Error('AI_NOT_CONFIGURED')

  // Instantiate lazily so importing isAiConfigured() never constructs a client
  // (the SDK constructor reads ANTHROPIC_API_KEY from env).
  const client = new Anthropic()
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL

  const userParts = [`Vulnerability title: ${input.title}`]
  if (input.affectedComponent) userParts.push(`Affected component: ${input.affectedComponent}`)
  if (input.notes) userParts.push(`Additional context from the tester:\n${input.notes}`)

  // Typed array assignment gives the tool literal its contextual type, so
  // `type: 'object'` is accepted without `as const`.
  const tools: Anthropic.Tool[] = [
    {
      name: 'emit_finding',
      description: 'Return the three written sections of a security finding.',
      input_schema: {
        type: 'object',
        properties: {
          description: { type: 'string', description: 'What the vulnerability is and where it occurs.' },
          impact: { type: 'string', description: 'The business and technical consequence if exploited.' },
          recommendation: { type: 'string', description: 'Concrete, actionable remediation steps.' },
        },
        required: ['description', 'impact', 'recommendation'],
      },
    },
  ]

  const response = await client.messages.create({
    model,
    max_tokens: 1200,
    system: SYSTEM_PROMPT,
    tools,
    tool_choice: { type: 'tool', name: 'emit_finding' },
    messages: [{ role: 'user', content: userParts.join('\n\n') }],
  })

  const block = response.content.find(b => b.type === 'tool_use')
  if (!block || block.type !== 'tool_use') throw new Error('AI_BAD_OUTPUT')

  const parsed = DraftOutputSchema.safeParse(block.input)
  if (!parsed.success) throw new Error('AI_BAD_OUTPUT')
  return parsed.data
}
