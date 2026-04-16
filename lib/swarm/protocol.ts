import { z } from 'zod';

export const AgentCapabilitySchema = z.enum([
  'filesystem',
  'terminal',
  'analysis',
  'planning',
  'testing',
  'security',
]);

export type AgentCapability = z.infer<typeof AgentCapabilitySchema>;

export const SwarmAgentSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  capabilities: z.array(AgentCapabilitySchema).min(1),
});

export type SwarmAgent = z.infer<typeof SwarmAgentSchema>;

export const SwarmTaskStatusSchema = z.enum([
  'queued',
  'running',
  'completed',
  'failed',
]);

export type SwarmTaskStatus = z.infer<typeof SwarmTaskStatusSchema>;

export const SwarmTaskInputSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(5).max(5000),
});

export type SwarmTaskInput = z.infer<typeof SwarmTaskInputSchema>;

export const SwarmTaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(3).max(120),
  description: z.string().min(5).max(5000),
  status: SwarmTaskStatusSchema,
  assignedAgentId: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  logs: z.array(z.string()),
});

export type SwarmTask = z.infer<typeof SwarmTaskSchema>;

export const SwarmRuntimeStateSchema = z.object({
  agents: z.array(SwarmAgentSchema).min(1),
  tasks: z.array(SwarmTaskSchema),
});

export type SwarmRuntimeState = z.infer<typeof SwarmRuntimeStateSchema>;

export const DEFAULT_SWARM_AGENTS: readonly SwarmAgent[] = [
  {
    id: 'architect-prime',
    name: 'Architect Prime',
    role: 'System architecture and dependency graph design',
    capabilities: ['analysis', 'planning'],
  },
  {
    id: 'forge-runner',
    name: 'Forge Runner',
    role: 'Implements scoped feature code changes',
    capabilities: ['filesystem', 'analysis'],
  },
  {
    id: 'signal-warden',
    name: 'Signal Warden',
    role: 'Validates realtime and messaging reliability',
    capabilities: ['analysis', 'testing'],
  },
  {
    id: 'security-auditor',
    name: 'Security Auditor',
    role: 'Performs input validation and hardening checks',
    capabilities: ['analysis', 'security'],
  },
  {
    id: 'ci-operator',
    name: 'CI Operator',
    role: 'Runs lint/test/build and reports failures',
    capabilities: ['terminal', 'testing'],
  },
  {
    id: 'memory-curator',
    name: 'Memory Curator',
    role: 'Maintains durable task snapshots and telemetry summaries',
    capabilities: ['analysis', 'planning'],
  },
  {
    id: 'ux-assembler',
    name: 'UX Assembler',
    role: 'Shapes interaction flows and accessibility behavior',
    capabilities: ['filesystem', 'analysis'],
  },
  {
    id: 'data-guardian',
    name: 'Data Guardian',
    role: 'Aligns persistence schema and migration safety',
    capabilities: ['analysis', 'security'],
  },
  {
    id: 'release-engine',
    name: 'Release Engine',
    role: 'Builds deployment bundles and rollout plans',
    capabilities: ['terminal', 'planning'],
  },
] as const;

