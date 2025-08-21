'use client'

import Chat from "@/components/chat";
import { useEffect, useRef, useState } from "react";
import { GripVertical } from "lucide-react";
import { useCoAgentStateRender, useLangGraphInterrupt, useCopilotContext } from "@copilotkit/react-core";

import { ResearchState, FarcasterState } from "@/lib/types";
import { Progress } from "@/components/progress";
import SourcesModal from "@/components/resource-modal";
import { useResearch } from "@/components/research-context";
import { useFarcaster } from "@/components/farcaster-context";
import { DocumentsView } from "@/components/documents-view";
import { useStreamingContent } from '@/lib/hooks/useStreamingContent';
import { ProposalViewer } from "@/components/structure-proposal-viewer";
import { useAgent } from "@/components/agent-context";

const CHAT_MIN_WIDTH = 30;
const CHAT_MAX_WIDTH = 50;

export default function HomePage() {
    const [chatWidth, setChatWidth] = useState(50) // Initial chat width in percentage
    const dividerRef = useRef<HTMLDivElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const { state: researchState, setResearchState } = useResearch()
    const { state: farcasterState, setFarcasterState } = useFarcaster()
    const { agentType } = useAgent()
    const { setAgentSession } = useCopilotContext()

    // Handle all "logs" - The loading states that show what the agent is doing
    const activeState = agentType === 'farcaster' ? farcasterState : researchState
    useCoAgentStateRender<ResearchState | FarcasterState>({
        name: agentType,
        render: ({ state }) => {
            const logs = (state as ResearchState | FarcasterState).logs;
            if (logs?.length > 0) {
                return <Progress logs={logs} />;
            }
            return null;
        },
    }, [activeState, agentType]);

    useEffect(() => {
        setAgentSession({ agentName: agentType })
    }, [agentType, setAgentSession])

    useLangGraphInterrupt({
        render: ({ resolve, event }) => {
            return <ProposalViewer
                // @ts-expect-error Expected runtime type is correct
                proposal={event.value}
                onSubmit={(approved, proposal) => resolve(
                    JSON.stringify({
                        ...proposal,
                        approved,
                    })
                )}
            />
        }
    })

    const streamingSection = useStreamingContent(researchState);

    useEffect(() => {
        const divider = dividerRef.current
        const container = containerRef.current
        let isDragging = false

        const startDragging = () => {
            isDragging = true
            document.addEventListener('mousemove', onDrag)
            document.addEventListener('mouseup', stopDragging)
        }

        const onDrag = (e: MouseEvent) => {
            if (!isDragging) return
            const containerRect = container!.getBoundingClientRect()
            const newChatWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100
            setChatWidth(Math.max(CHAT_MIN_WIDTH, Math.min(CHAT_MAX_WIDTH, newChatWidth))) // Limit chat width between 20% and 80%
        }

        const stopDragging = () => {
            isDragging = false
            document.removeEventListener('mousemove', onDrag)
            document.removeEventListener('mouseup', stopDragging)
        }

        divider?.addEventListener('mousedown', startDragging)

        return () => {
            divider?.removeEventListener('mousedown', startDragging)
            document.removeEventListener('mousemove', onDrag)
            document.removeEventListener('mouseup', stopDragging)
        }
    }, [])
    const {
        sections,
    } = researchState

    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

    return (
        <div
            className="h-screen bg-[#FAF9F6] text-[#3D2B1F] font-lato px-8 2xl:px-[8vw]">
            <div className="h-full border-black/10 border-y-0">
                {/* Main Chat Window */}
                <div className="flex h-full overflow-hidden flex-1" ref={containerRef}>
                    <div style={{width: `${chatWidth}%`}}>
                        <Chat
                            onSubmitMessage={async () => {
                                // clear the logs before starting the new research
                                if (agentType === 'farcaster') {
                                    setFarcasterState({ ...farcasterState, logs: [] });
                                } else {
                                    setResearchState({ ...researchState, logs: [] });
                                }
                                await new Promise((resolve) => setTimeout(resolve, 30));
                            }}
                        />
                    </div>

                    <div
                        ref={dividerRef}
                        className="w-1 bg-[var(--border)] hover:bg-[var(--primary)] cursor-col-resize flex items-center justify-center"
                    >
                        <GripVertical className="h-6 w-6 text-[var(--primary)]"/>
                    </div>

                    {/* Document Viewer */}
                    <DocumentsView
                        sections={sections ?? []}
                        streamingSection={streamingSection}
                        selectedSection={sections?.find(s => s.id === selectedSectionId)}
                        onSelectSection={setSelectedSectionId}
                    />
                </div>
            </div>
            <SourcesModal />
        </div>
    );
}
