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
import { useAgent } from "@/components/agent-context";

export default function Chat(props: CopilotChatProps) {
  const { agentType } = useAgent();

  const instructions =
    agentType === "farcaster" ? FARCASTER_CHAT_INSTRUCTIONS : MAIN_CHAT_INSTRUCTIONS;

  const labels = {
    title: agentType === "farcaster" ? FARCASTER_CHAT_TITLE : MAIN_CHAT_TITLE,
    initial: agentType === "farcaster" ? FARCASTER_INITIAL_MESSAGE : INITIAL_MESSAGE,
  };

  return (
    <CopilotChat
      key={agentType}
      instructions={instructions}
      labels={labels}
      className="h-full w-full font-noto"
      {...props}
    />
  );
}
