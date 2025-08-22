import { render, waitFor } from '@testing-library/react';
import React from 'react';
import Chat from './chat';
import { AgentProvider } from './agent-context';
import { vi } from 'vitest';

const mockAppendMessage = vi.fn();
let capturedOnSubmit: ((msg: string) => Promise<void> | void) | undefined;

vi.mock('@copilotkit/react-ui', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  CopilotChat: (props: any) => {
    capturedOnSubmit = props.onSubmitMessage;
    return null;
  },
}));

vi.mock('@copilotkit/react-core', () => ({
  useCopilotChat: () => ({
    appendMessage: mockAppendMessage,
    setMessages: vi.fn(),
    visibleMessages: [],
    reloadMessages: vi.fn(),
    stopGeneration: vi.fn(),
    reset: vi.fn(),
    deleteMessage: vi.fn(),
    runChatCompletion: vi.fn(),
    isLoading: false,
  }),
}));

vi.mock('@/lib/router', () => ({
  routeAgent: () => ({ agent: 'farcaster', confidence: 0.9 }),
  setLastAgent: vi.fn(),
}));

describe('Chat', () => {
  it('resends message after agent switch', async () => {
    render(
      <AgentProvider>
        <Chat />
      </AgentProvider>
    );
    if (capturedOnSubmit) {
      await capturedOnSubmit('hello');
    }
    await waitFor(() => expect(mockAppendMessage).toHaveBeenCalled());
    expect(mockAppendMessage.mock.calls[0][0].content).toBe('hello');
  });
});
