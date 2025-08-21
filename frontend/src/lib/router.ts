import { AgentType } from "@/components/agent-context";

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
  const text = query.toLowerCase();
  let fScore = 0;
  for (const k of FARCASTER_KEYWORDS) {
    if (text.includes(k)) fScore++;
  }
  let rScore = 0;
  for (const k of RESEARCH_KEYWORDS) {
    if (text.includes(k)) rScore++;
  }
  if (fScore === 0 && rScore === 0) {
    return { agent: null, confidence: 0 };
  }
  if (fScore > rScore) {
    return { agent: "farcaster", confidence: fScore / (fScore + rScore) };
  }
  if (rScore > fScore) {
    return { agent: "agent", confidence: rScore / (fScore + rScore) };
  }
  return { agent: null, confidence: 0.5 };
}
