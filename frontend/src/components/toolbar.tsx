import { FileText, RefreshCcw } from "lucide-react";
import { useResearch } from "@/components/research-context";
import { LucideIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AgentType, useAgent } from "@/components/agent-context";

interface NavButtonProps {
    icon: LucideIcon;
    onClick?: () => void;
    disabled?: boolean;
}

function NavButton({ icon: Icon, onClick, disabled }: NavButtonProps) {
    return (
        <button onClick={onClick} disabled={disabled}>
            <Icon className={`h-6 w-6 ${disabled ? 'text-[#8B4513]/40' : 'text-[#8B4513]'}`} />
        </button>
    );
}

export default function Toolbar() {
    const { setSourcesModalOpen, state } = useResearch();
    const { agentType, setAgentType } = useAgent();

    return (
        <div
            className="flex h-full flex-col items-center justify-between bg-[#F5F0EA] p-4 shadow-md my-auto">
            <div className="space-y-6 flex flex-col">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <NavButton icon={RefreshCcw} />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Restart</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <NavButton
                            icon={FileText}
                            disabled={!Object.keys(state.sources ?? {}).length}
                            onClick={() => setSourcesModalOpen(true)}
                        />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>View Sources</p>
                    </TooltipContent>
                </Tooltip>
            </div>
            <div className="space-y-2">
                {[{ label: 'Research', type: 'agent' as AgentType }, { label: 'Farcaster', type: 'farcaster' as AgentType }].map((opt) => (
                    <button
                        key={opt.type}
                        onClick={() => setAgentType(opt.type)}
                        className={`text-sm ${agentType === opt.type ? 'font-bold' : ''}`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
            {/*<Avatar className="border-2 border-[#8B4513]/20">*/}
            {/*    <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn"/>*/}
            {/*    <AvatarFallback>CN</AvatarFallback>*/}
            {/*</Avatar>*/}
        </div>
    )
}