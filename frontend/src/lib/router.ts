import { AgentType } from "@/components/agent-context";

let lastAgent: AgentType | null = null;

export function setLastAgent(agent: AgentType | null) {
  lastAgent = agent;
}

export interface RouteResult {
  agent: AgentType | null;
  confidence: number;
}

const FARCASTER_KEYWORDS = [
  "farcaster",
  "cast",
  "warpcast",
  "frame",
  "channel",
  "follow",
  "feed",
  "user",
  "fc",
];

const FARCASTER_PATTERNS = [
  /\bfid[:\s]*\d+\b/, // "fid 123" or "fid:123"
  /\bfarcaster\b/, // explicit farcaster mentions
  /^\d+$/ // numeric id without prefix
];

const RESEARCH_KEYWORDS = [
  "research",
  "report",
  "source",
  "outline",
  "section",
  "write",
  "paper",
  "article",
  "topic",
  "summary",
  "document",
];

export function routeAgent(query: string): RouteResult {
  const text = query.toLowerCase().trim();
  let fScore = 0;
  for (const k of FARCASTER_KEYWORDS) {
    if (text.includes(k)) fScore++;
  }
  for (const r of FARCASTER_PATTERNS) {
    if (r.test(text)) fScore++;
  }
  let rScore = 0;
  for (const k of RESEARCH_KEYWORDS) {
    if (text.includes(k)) rScore++;
  }
  if (fScore === 0 && rScore === 0) {
    return { agent: lastAgent, confidence: 0 };
  }
  if (fScore > rScore) {
    return { agent: "farcaster", confidence: fScore / (fScore + rScore) };
  }
  if (rScore > fScore) {
    return { agent: "agent", confidence: rScore / (fScore + rScore) };
  }
  return { agent: lastAgent, confidence: 0.5 };
}
