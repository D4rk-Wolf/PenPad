import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { mockCreate } = vi.hoisted(() => ({ mockCreate: vi.fn() }))

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = { create: mockCreate }
  },
}))

import { draftFinding, isAiConfigured } from '@/lib/ai/draft'

describe('isAiConfigured', () => {
  const original = process.env.ANTHROPIC_API_KEY
  afterEach(() => {
    if (original === undefined) delete process.env.ANTHROPIC_API_KEY
    else process.env.ANTHROPIC_API_KEY = original
  })

  it('is true when ANTHROPIC_API_KEY is set', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test'
    expect(isAiConfigured()).toBe(true)
  })

  it('is false when ANTHROPIC_API_KEY is absent', () => {
    delete process.env.ANTHROPIC_API_KEY
    expect(isAiConfigured()).toBe(false)
  })
})

describe('draftFinding', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.ANTHROPIC_API_KEY = 'sk-test'
  })

  it('returns the three sections from a tool_use response', async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'tool_use',
          name: 'emit_finding',
          input: {
            description: 'SQL injection in the login endpoint.',
            impact: 'An attacker can read or modify the database.',
            recommendation: 'Use parameterised queries.',
          },
        },
      ],
    })

    const result = await draftFinding({ title: 'SQL Injection', affectedComponent: '/login', notes: null })

    expect(result).toEqual({
      description: 'SQL injection in the login endpoint.',
      impact: 'An attacker can read or modify the database.',
      recommendation: 'Use parameterised queries.',
    })
    // model + forced tool choice are configured
    const call = mockCreate.mock.calls[0][0]
    expect(call.tool_choice).toEqual({ type: 'tool', name: 'emit_finding' })
    expect(call.thinking).toBeUndefined()
  })

  it('throws AI_NOT_CONFIGURED when no key is set', async () => {
    delete process.env.ANTHROPIC_API_KEY
    await expect(draftFinding({ title: 'X' })).rejects.toThrow('AI_NOT_CONFIGURED')
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('throws AI_BAD_OUTPUT when the tool input is malformed', async () => {
    mockCreate.mockResolvedValue({ content: [{ type: 'tool_use', name: 'emit_finding', input: { description: 'only one field' } }] })
    await expect(draftFinding({ title: 'X' })).rejects.toThrow('AI_BAD_OUTPUT')
  })
})
