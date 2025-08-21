'use client'

import { createContext, useContext, ReactNode, useEffect } from 'react'
import type { FarcasterState } from '@/lib/types'
import { useCoAgent } from "@copilotkit/react-core";
import useLocalStorage from "@/lib/hooks/useLocalStorage";
import { useAgent } from "@/components/agent-context";

interface FarcasterContextType {
    state: FarcasterState;
    setFarcasterState: (newState: FarcasterState | ((prevState: FarcasterState) => FarcasterState)) => void
    runAgent: () => void;
}

const FarcasterContext = createContext<FarcasterContextType | undefined>(undefined)

export function FarcasterProvider({ children }: { children: ReactNode }) {
    const { agentType } = useAgent();
    const { state: coAgentState, setState: setCoAgentsState, run } = useCoAgent<FarcasterState>({
        name: agentType,
        initialState: {},
    });
    // @ts-expect-error -- force null
    const [localStorageState, setLocalStorageState] = useLocalStorage<FarcasterState>('farcaster', null);

    useEffect(() => {
        const coAgentsStateEmpty = Object.keys(coAgentState).length < 1
        const localStorageStateEmpty = localStorageState == null || Object.keys(localStorageState).length < 1
        if (!localStorageStateEmpty && coAgentsStateEmpty) {
            setCoAgentsState(localStorageState)
            return;
        }
        if (!coAgentsStateEmpty && localStorageStateEmpty) {
            setLocalStorageState(coAgentState)
            return;
        }
        if (!localStorageStateEmpty && !coAgentsStateEmpty && JSON.stringify(localStorageState) !== JSON.stringify(coAgentState)) {
            setLocalStorageState(coAgentState)
            return;
        }
    }, [coAgentState, localStorageState, setCoAgentsState, setLocalStorageState]);

    return (
        <FarcasterContext.Provider value={{ state: coAgentState, setFarcasterState: setCoAgentsState as FarcasterContextType['setFarcasterState'], runAgent: run }}>
            {children}
        </FarcasterContext.Provider>
    )
}

export function useFarcaster() {
    const context = useContext(FarcasterContext)
    if (context === undefined) {
        throw new Error('useFarcaster must be used within a FarcasterProvider')
    }
    return context
}

