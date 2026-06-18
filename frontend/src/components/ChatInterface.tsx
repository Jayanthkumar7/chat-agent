"use client";

import { useState, useRef, useEffect } from "react";
import { Message, AgentState, ChatResponse } from "@/types";

// ══════════════════════════════════════════════════════════════════
//  ChatInterface — Base Component
// ══════════════════════════════════════════════════════════════════
//
//  This is a working base. You are expected to improve it:
//  - Better styling / UI design
//  - Loading skeleton or typing indicator
//  - Auto-scroll to the latest message
//  - Mobile responsiveness
//  - Error states and retry logic
//  - Markdown rendering for agent responses
//
//  The agent state is passed back and forth with every request so
//  the backend can maintain conversation context (name, mobile, etc.)
// ══════════════════════════════════════════════════════════════════

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "assistant",
      content:
        "Hello! I am the TheTechX AI Assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>({
    sessionId: Math.random().toString(36).substring(2, 9),
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // TODO: Implement auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input.trim(),
          sessionId: agentState.sessionId,
          agentState,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: ChatResponse = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        },
      ]);

      if (data.agentState) {
        setAgentState(data.agentState);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "Error connecting to the agent. Is the backend running on port 3001?",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      {/* Header */}
      <div className="mb-4 border-b pb-3">
        <h1 className="text-2xl font-bold text-gray-900">
          TheTechX AI Assistant
        </h1>
        <p className="text-sm text-gray-500">
          Ask me about TheTechX, tech news, or career roadmaps
        </p>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`rounded-2xl px-4 py-2 max-w-[75%] text-sm ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-500 rounded-2xl px-4 py-2 text-sm">
              {/* TODO: Replace with a proper typing indicator */}
              Thinking...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Type your message..."
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
}
