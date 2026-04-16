import TaskComposer from '@/app/swarm/TaskComposer';
import QueueRunner from '@/app/swarm/QueueRunner';
import { getSwarmRuntime } from '@/lib/swarm/registry';

export default function SwarmPage(): React.JSX.Element {
  const runtime = getSwarmRuntime();
  const state = runtime.getState();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">CursorAgentSwarmGenesis Runtime</h1>
        <p className="text-sm text-muted-foreground">
          Living agent-swarm control plane with deterministic task assignment and server-side execution.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <TaskComposer />
        <div className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Runtime controls</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Run all queued tasks through the deterministic execution pipeline.
          </p>
          <div className="mt-4">
            <QueueRunner />
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Active agents ({state.agents.length})</h2>
          <ul className="mt-3 grid gap-3">
            {state.agents.map((agent) => (
              <li key={agent.id} className="rounded-md border border-border p-3">
                <p className="text-sm font-medium">{agent.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{agent.role}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Capabilities: {agent.capabilities.join(', ')}
                </p>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Task queue ({state.tasks.length})</h2>
          {state.tasks.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No tasks yet. Queue one to activate the swarm.</p>
          ) : (
            <ul className="mt-3 grid gap-3">
              {state.tasks
                .slice()
                .reverse()
                .map((task) => (
                  <li key={task.id} className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{task.title}</p>
                      <span className="rounded-md border border-border px-2 py-0.5 text-xs uppercase tracking-wide">
                        {task.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{task.description}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Assigned to: {task.assignedAgentId}</p>
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {task.logs.map((logLine) => (
                        <li key={`${task.id}-${logLine}`}>- {logLine}</li>
                      ))}
                    </ul>
                  </li>
                ))}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
}
