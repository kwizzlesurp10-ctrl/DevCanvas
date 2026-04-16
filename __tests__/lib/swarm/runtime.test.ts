import { SwarmRuntime } from '@/lib/swarm/runtime';
import { SwarmTaskInput } from '@/lib/swarm/protocol';

describe('SwarmRuntime', () => {
  it('creates a queued task with deterministic assignment', () => {
    const runtime = new SwarmRuntime();
    const input: SwarmTaskInput = {
      title: 'Implement runtime queue',
      description: 'Create the queue and assign an initial owner.',
    };

    const result = runtime.createTask(input);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.task.status).toBe('queued');
    expect(result.value.task.assignedAgentId.length).toBeGreaterThan(0);
    expect(result.value.task.logs).toContainEqual(
      expect.stringMatching(/^Task queued for /)
    );
  });

  it('rejects invalid task payloads', () => {
    const runtime = new SwarmRuntime();
    const result = runtime.createTask({
      title: 'x',
      description: 'tiny',
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('runs queued tasks to completion', () => {
    const runtime = new SwarmRuntime();
    runtime.createTask({
      title: 'Harden signaling',
      description: 'Validate offer and candidate payloads.',
    });

    const runResult = runtime.runQueuedTasks();
    expect(runResult.ok).toBe(true);
    if (!runResult.ok) {
      return;
    }

    expect(runResult.value).toHaveLength(1);
    expect(runResult.value[0].status).toBe('completed');

    const state = runtime.getState();
    expect(state.tasks[0].status).toBe('completed');
    expect(state.tasks[0].logs).toContain('Execution started');
    expect(state.tasks[0].logs).toContain(
      'Execution completed with deterministic runtime'
    );
  });

  it('prevents illegal transitions', () => {
    const runtime = new SwarmRuntime();
    const createResult = runtime.createTask({
      title: 'Queue task',
      description: 'Move through valid transitions only.',
    });

    expect(createResult.ok).toBe(true);
    if (!createResult.ok) {
      return;
    }

    const invalidTransition = runtime.transitionTask(
      createResult.value.task.id,
      'completed'
    );
    expect(invalidTransition.ok).toBe(false);
    if (invalidTransition.ok) {
      return;
    }

    expect(invalidTransition.error.code).toBe('VALIDATION_ERROR');
  });
});
