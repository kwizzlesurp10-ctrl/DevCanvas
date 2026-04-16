'use client';

import { useActionState, useEffect } from 'react';
import { enqueueSwarmTask, SwarmActionResult } from '@/app/swarm/actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const INITIAL_ACTION_STATE: SwarmActionResult = {
  ok: true,
  message: '',
};

export default function TaskComposer(): React.JSX.Element {
  const [state, formAction, isPending] = useActionState(enqueueSwarmTask, INITIAL_ACTION_STATE);

  useEffect(() => {
    if (!state.message) {
      return;
    }

    if (state.ok) {
      toast.success(state.message);
      return;
    }

    toast.error(state.message);
  }, [state]);

  return (
    <form action={formAction} className="grid gap-3 rounded-lg border border-border bg-card p-4">
      <div className="grid gap-2">
        <label htmlFor="swarm-task-title" className="text-sm font-medium">
          Task title
        </label>
        <Input
          id="swarm-task-title"
          name="title"
          placeholder="Harden realtime channel validation"
          maxLength={120}
          required
        />
      </div>
      <div className="grid gap-2">
        <label htmlFor="swarm-task-description" className="text-sm font-medium">
          Task description
        </label>
        <textarea
          id="swarm-task-description"
          name="description"
          placeholder="Describe the intended implementation scope and quality bar."
          className="min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          maxLength={5000}
          required
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Queueing task...' : 'Queue task'}
      </Button>
    </form>
  );
}
