'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export type AgentType = 'agent' | 'farcaster'

interface AgentContextType {
  agentType: AgentType
  setAgentType: (type: AgentType) => void
}

const AgentContext = createContext<AgentContextType | undefined>(undefined)

export function AgentProvider({ children }: { children: ReactNode }) {
  const [agentType, setAgentType] = useState<AgentType>('agent')
  return (
    <AgentContext.Provider value={{ agentType, setAgentType }}>
      {children}
    </AgentContext.Provider>
  )
}

export function useAgent() {
  const ctx = useContext(AgentContext)
  if (!ctx) {
    throw new Error('useAgent must be used within an AgentProvider')
  }
  return ctx
}
