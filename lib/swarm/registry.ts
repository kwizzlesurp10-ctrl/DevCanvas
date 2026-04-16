import { SwarmRuntime } from '@/lib/swarm/runtime';

declare global {
  var __devCanvasSwarmRuntime: SwarmRuntime | undefined;
}

export function getSwarmRuntime(): SwarmRuntime {
  if (!globalThis.__devCanvasSwarmRuntime) {
    globalThis.__devCanvasSwarmRuntime = new SwarmRuntime();
  }

  return globalThis.__devCanvasSwarmRuntime;
}
