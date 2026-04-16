'use client';

import { useActionState, useEffect } from 'react';
import { runSwarmQueueFromForm, SwarmActionResult } from '@/app/swarm/actions';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const INITIAL_ACTION_STATE: SwarmActionResult = {
  ok: true,
  message: '',
};

export default function QueueRunner(): React.JSX.Element {
  const [state, formAction, isPending] = useActionState(runSwarmQueueFromForm, INITIAL_ACTION_STATE);

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
    <form action={formAction}>
      <Button type="submit" variant="outline" disabled={isPending}>
        {isPending ? 'Running queue...' : 'Run queued tasks'}
      </Button>
    </form>
  );
}
