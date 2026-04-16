import type { AgentCapability } from '@/lib/swarm/protocol';

export interface SwarmAgentBlueprint {
  id: string;
  name: string;
  role: string;
  tools: readonly string[];
  capabilities: readonly AgentCapability[];
  communicationProtocol: string;
}

export const SWARM_AGENT_BLUEPRINTS: readonly SwarmAgentBlueprint[] = [
  {
    id: 'architect-prime',
    name: 'Architect Prime',
    role: 'Owns system boundaries and dependency architecture',
    tools: ['ReadFile', 'rg', 'Glob'],
    capabilities: ['analysis', 'planning'],
    communicationProtocol: 'Publishes architecture briefs to swarm-memory bus',
  },
  {
    id: 'forge-runner',
    name: 'Forge Runner',
    role: 'Implements scoped backend/frontend code updates',
    tools: ['ApplyPatch', 'ReadFile'],
    capabilities: ['filesystem', 'analysis'],
    communicationProtocol: 'Consumes implementation tickets and emits diffs',
  },
  {
    id: 'signal-warden',
    name: 'Signal Warden',
    role: 'Hardens realtime signaling and transport reliability',
    tools: ['ReadFile', 'ApplyPatch', 'Shell'],
    capabilities: ['analysis', 'testing'],
    communicationProtocol: 'Subscribes to transport events and reports regressions',
  },
  {
    id: 'security-auditor',
    name: 'Security Auditor',
    role: 'Enforces input validation and zero-trust defaults',
    tools: ['ReadFile', 'rg'],
    capabilities: ['analysis', 'security'],
    communicationProtocol: 'Attaches risk annotations to queue tasks',
  },
  {
    id: 'ci-operator',
    name: 'CI Operator',
    role: 'Executes lint/test/build gates and reports health',
    tools: ['Shell'],
    capabilities: ['terminal', 'testing'],
    communicationProtocol: 'Writes validation outcomes to task logs',
  },
  {
    id: 'memory-curator',
    name: 'Memory Curator',
    role: 'Maintains durable task snapshots and telemetry summaries',
    tools: ['ReadFile', 'ApplyPatch'],
    capabilities: ['analysis', 'planning'],
    communicationProtocol: 'Compacts swarm history into decision artifacts',
  },
  {
    id: 'ux-assembler',
    name: 'UX Assembler',
    role: 'Shapes interaction flows and accessibility behavior',
    tools: ['ReadFile', 'ApplyPatch'],
    capabilities: ['filesystem', 'analysis'],
    communicationProtocol: 'Emits UI contracts to implementers',
  },
  {
    id: 'data-guardian',
    name: 'Data Guardian',
    role: 'Aligns persistence schema and migration safety',
    tools: ['ReadFile', 'Shell'],
    capabilities: ['analysis', 'security'],
    communicationProtocol: 'Publishes migration advisories to runtime',
  },
  {
    id: 'release-engine',
    name: 'Release Engine',
    role: 'Builds deployment bundles and rollout plans',
    tools: ['Shell', 'ReadFile'],
    capabilities: ['terminal', 'planning'],
    communicationProtocol: 'Pushes release notes into execution queue',
  },
] as const;
