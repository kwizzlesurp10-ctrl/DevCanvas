'use server';

import { revalidatePath } from 'next/cache';
import { getSwarmRuntime } from '@/lib/swarm/registry';
import { Result, SwarmError } from '@/lib/swarm/result';
import { SwarmTaskInput } from '@/lib/swarm/protocol';

export interface SwarmActionResult {
  ok: boolean;
  message: string;
}

function mapResultMessage<TValue>(result: Result<TValue, SwarmError>, successMessage: string): SwarmActionResult {
  if (!result.ok) {
    return {
      ok: false,
      message: `${result.error.code}: ${result.error.message}${result.error.cause ? ` (${result.error.cause})` : ''}`,
    };
  }

  return {
    ok: true,
    message: successMessage,
  };
}

export async function enqueueSwarmTask(
  _previousState: SwarmActionResult,
  formData: FormData
): Promise<SwarmActionResult> {
  const titleValue = formData.get('title');
  const descriptionValue = formData.get('description');

  const input: SwarmTaskInput = {
    title: typeof titleValue === 'string' ? titleValue : '',
    description: typeof descriptionValue === 'string' ? descriptionValue : '',
  };

  const runtime = getSwarmRuntime();
  const createResult = runtime.createTask(input);
  const mappedResult = mapResultMessage(createResult, 'Task queued in swarm runtime.');
  revalidatePath('/swarm');
  return mappedResult;
}

export async function runSwarmQueue(): Promise<SwarmActionResult> {
  const runtime = getSwarmRuntime();
  const runResult = runtime.runQueuedTasks();
  const mappedResult = mapResultMessage(runResult, 'All queued tasks were executed.');
  revalidatePath('/swarm');
  return mappedResult;
}

export async function runSwarmQueueFromForm(
  _previousState: SwarmActionResult
): Promise<SwarmActionResult> {
  void _previousState;
  const runtime = getSwarmRuntime();
  const runResult = runtime.runQueuedTasks();
  const mappedResult = mapResultMessage(runResult, 'All queued tasks were executed.');
  revalidatePath('/swarm');
  return mappedResult;
}
