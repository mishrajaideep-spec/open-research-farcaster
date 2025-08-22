'use client'

import { CopilotChat } from "@copilotkit/react-ui";
import {
  FARCASTER_CHAT_INSTRUCTIONS,
  FARCASTER_CHAT_TITLE,
  FARCASTER_INITIAL_MESSAGE,
  INITIAL_MESSAGE,
  MAIN_CHAT_INSTRUCTIONS,
  MAIN_CHAT_TITLE,
} from "@/lib/consts";
// TODO: fix
// @ts-expect-error -- ignore
import { CopilotChatProps } from "@copilotkit/react-ui/dist/components/chat/Chat";
import { AgentType, useAgent } from "@/components/agent-context";
import { routeAgent, setLastAgent } from "@/lib/router";
import { useCallback, useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { useCopilotChat } from "@copilotkit/react-core";
import { TextMessage, Role } from "@copilotkit/runtime-client-gql";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Chat({ onSubmitMessage, ...props }: CopilotChatProps) {
  const { agentType, setAgentType } = useAgent();
  const pendingMessageRef = useRef<string | null>(null);
  const { appendMessage, setMessages } = useCopilotChat();

  const instructions =
    agentType === "farcaster" ? FARCASTER_CHAT_INSTRUCTIONS : MAIN_CHAT_INSTRUCTIONS;

  const labels = {
    title: agentType === "farcaster" ? FARCASTER_CHAT_TITLE : MAIN_CHAT_TITLE,
    initial: agentType === "farcaster" ? FARCASTER_INITIAL_MESSAGE : INITIAL_MESSAGE,
  };

  const handleSubmitMessage = useCallback(
    async (message: string) => {
      const { agent, confidence } = routeAgent(message);
      if (agent && confidence >= 0.6 && agent !== agentType) {
        pendingMessageRef.current = message;
        flushSync(() => {
          setAgentType(agent);
          setLastAgent(agent);
        });
        return;
      }
      if (onSubmitMessage) {
        await onSubmitMessage(message);
      }
    },
    [agentType, onSubmitMessage, setAgentType]
  );

  useEffect(() => {
    if (pendingMessageRef.current) {
      const msg = pendingMessageRef.current;
      pendingMessageRef.current = null;
      setMessages([]);
      void appendMessage(new TextMessage({ content: msg, role: Role.User }));
      if (onSubmitMessage) {
        void onSubmitMessage(msg);
      }
    }
  }, [agentType, appendMessage, onSubmitMessage, setMessages]);

  return (
    <div className="h-full w-full font-noto flex flex-col">
      <div className="flex justify-end p-2">
        <Select
          value={agentType}
          onValueChange={(v) => setAgentType(v as AgentType)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Select agent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="agent">Research</SelectItem>
            <SelectItem value="farcaster">Farcaster</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <CopilotChat
        key={agentType}
        instructions={instructions}
        labels={labels}
        className="h-full w-full flex-1"
        onSubmitMessage={handleSubmitMessage}
        {...props}
      />
    </div>
  );
}
