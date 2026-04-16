import { randomUUID } from 'node:crypto';
import {
  DEFAULT_SWARM_AGENTS,
  SwarmRuntimeState,
  SwarmRuntimeStateSchema,
  SwarmTask,
  SwarmTaskInput,
  SwarmTaskInputSchema,
  SwarmTaskSchema,
} from '@/lib/swarm/protocol';
import { err, ok, Result, SwarmError } from '@/lib/swarm/result';

export interface SwarmTaskCreated {
  task: SwarmTask;
}

export interface SwarmTaskTransition {
  task: SwarmTask;
}

const TASK_STATUS_TRANSITIONS: Readonly<Record<SwarmTask['status'], readonly SwarmTask['status'][]>> = {
  queued: ['running', 'failed'],
  running: ['completed', 'failed'],
  completed: [],
  failed: [],
};

function makeNowIso(): string {
  return new Date().toISOString();
}

function cloneState(state: SwarmRuntimeState): SwarmRuntimeState {
  return {
    agents: [...state.agents],
    tasks: [...state.tasks],
  };
}

export class SwarmRuntime {
  private state: SwarmRuntimeState;

  public constructor(initialState?: SwarmRuntimeState) {
    const stateToValidate: SwarmRuntimeState = initialState ?? {
      agents: [...DEFAULT_SWARM_AGENTS],
      tasks: [],
    };

    this.state = SwarmRuntimeStateSchema.parse(stateToValidate);
  }

  public getState(): SwarmRuntimeState {
    return cloneState(this.state);
  }

  public createTask(input: SwarmTaskInput): Result<SwarmTaskCreated, SwarmError> {
    const parsedInput = SwarmTaskInputSchema.safeParse(input);
    if (!parsedInput.success) {
      return err({
        code: 'VALIDATION_ERROR',
        message: 'Task input is invalid.',
        cause: parsedInput.error.issues.map((issue) => issue.message).join('; '),
      });
    }

    const nextAgent = this.pickLeastLoadedAgent();
    if (!nextAgent) {
      return err({
        code: 'RUNTIME_ERROR',
        message: 'No agents are available to receive a task.',
      });
    }

    const now = makeNowIso();
    const task: SwarmTask = SwarmTaskSchema.parse({
      id: `task_${randomUUID()}`,
      title: parsedInput.data.title,
      description: parsedInput.data.description,
      status: 'queued',
      assignedAgentId: nextAgent.id,
      createdAt: now,
      updatedAt: now,
      logs: [`Task queued for ${nextAgent.name}`],
    });

    this.state = {
      ...this.state,
      tasks: [...this.state.tasks, task],
    };

    return ok({ task });
  }

  public transitionTask(
    taskId: string,
    targetStatus: SwarmTask['status'],
    logLine?: string
  ): Result<SwarmTaskTransition, SwarmError> {
    const taskIndex = this.state.tasks.findIndex((task) => task.id === taskId);
    if (taskIndex < 0) {
      return err({
        code: 'NOT_FOUND',
        message: `Task ${taskId} was not found.`,
      });
    }

    const currentTask = this.state.tasks[taskIndex];
    const allowedTargets = TASK_STATUS_TRANSITIONS[currentTask.status];
    if (!allowedTargets.includes(targetStatus)) {
      return err({
        code: 'VALIDATION_ERROR',
        message: `Cannot transition task from ${currentTask.status} to ${targetStatus}.`,
      });
    }

    const updatedTask: SwarmTask = {
      ...currentTask,
      status: targetStatus,
      updatedAt: makeNowIso(),
      logs: logLine ? [...currentTask.logs, logLine] : [...currentTask.logs],
    };

    this.state = {
      ...this.state,
      tasks: this.state.tasks.map((task, index) => (index === taskIndex ? updatedTask : task)),
    };

    return ok({ task: updatedTask });
  }

  public runQueuedTasks(): Result<SwarmTask[], SwarmError> {
    const queuedTasks = this.state.tasks.filter((task) => task.status === 'queued');
    const processedTasks: SwarmTask[] = [];

    for (const task of queuedTasks) {
      const startedResult = this.transitionTask(task.id, 'running', 'Execution started');
      if (!startedResult.ok) {
        return startedResult;
      }

      const completedResult = this.transitionTask(
        task.id,
        'completed',
        'Execution completed with deterministic runtime'
      );
      if (!completedResult.ok) {
        return completedResult;
      }

      processedTasks.push(completedResult.value.task);
    }

    return ok(processedTasks);
  }

  private pickLeastLoadedAgent() {
    const taskLoadByAgent = new Map<string, number>();
    for (const agent of this.state.agents) {
      taskLoadByAgent.set(agent.id, 0);
    }

    for (const task of this.state.tasks) {
      if (task.status === 'queued' || task.status === 'running') {
        taskLoadByAgent.set(task.assignedAgentId, (taskLoadByAgent.get(task.assignedAgentId) ?? 0) + 1);
      }
    }

    let selectedAgent = this.state.agents[0];
    let selectedLoad = taskLoadByAgent.get(selectedAgent.id) ?? 0;

    for (const agent of this.state.agents.slice(1)) {
      const load = taskLoadByAgent.get(agent.id) ?? 0;
      if (load < selectedLoad) {
        selectedAgent = agent;
        selectedLoad = load;
      }
    }

    return selectedAgent;
  }
}
