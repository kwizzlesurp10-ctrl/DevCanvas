import {
  DEFAULT_SWARM_AGENTS,
  SwarmTaskInputSchema,
  SwarmTaskSchema,
} from '@/lib/swarm/protocol';

describe('swarm protocol schemas', () => {
  it('validates task input boundaries', () => {
    const valid = SwarmTaskInputSchema.safeParse({
      title: 'Ship full runtime',
      description: 'Execute the queued work and report deterministic results.',
    });
    expect(valid.success).toBe(true);

    const invalid = SwarmTaskInputSchema.safeParse({
      title: 'x',
      description: 'tiny',
    });
    expect(invalid.success).toBe(false);
  });

  it('defines an expanded default swarm catalog', () => {
    expect(DEFAULT_SWARM_AGENTS.length).toBeGreaterThanOrEqual(8);
    expect(DEFAULT_SWARM_AGENTS.some((agent) => agent.id === 'security-auditor')).toBe(true);
    expect(DEFAULT_SWARM_AGENTS.some((agent) => agent.id === 'release-engine')).toBe(true);
  });

  it('validates a materialized task shape', () => {
    const parsedTask = SwarmTaskSchema.safeParse({
      id: 'task_123',
      title: 'Run quality gates',
      description: 'Execute lint, tests, and build.',
      status: 'queued',
      assignedAgentId: 'ci-operator',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      logs: ['Task queued for CI Operator'],
    });

    expect(parsedTask.success).toBe(true);
  });
});
