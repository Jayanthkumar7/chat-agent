"use client";

import { useState, useRef, useEffect } from "react";
import { Message, AgentState, ChatResponse } from "@/types";

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
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [agentState, setAgentState] = useState<AgentState>({
    sessionId: "",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Initial mounting logic to check localStorage and load credentials/history
  useEffect(() => {
    const storedMobile = localStorage.getItem("thetechx_user_mobile");
    const storedName = localStorage.getItem("thetechx_user_name");
    const storedSessionId =
      localStorage.getItem("thetechx_session_id") ||
      Math.random().toString(36).substring(2, 9);

    if (storedMobile && storedName) {
      setAgentState({
        sessionId: storedSessionId,
        userName: storedName,
        userMobile: storedMobile,
        hasCollectedUserInfo: true,
      });
      fetchHistory(storedMobile);
    } else {
      setAgentState({
        sessionId: storedSessionId,
        hasCollectedUserInfo: false,
      });
    }
  }, []);

  // 2. Auto-scroll to latest messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, isHistoryLoading]);

  // 3. Fetch past conversation history from Notion DB
  const fetchHistory = async (mobile: string) => {
    setIsHistoryLoading(true);
    try {
      const res = await fetch(`/api/history?mobile=${encodeURIComponent(mobile)}`);
      if (!res.ok) throw new Error("Failed to fetch history");
      
      const data = await res.json();
      if (data.history && data.history.length > 0) {
        const mappedMessages: Message[] = data.history.map((h: any, idx: number) => ({
          id: `history-${idx}`,
          role: h.role,
          content: h.content,
          timestamp: new Date(h.time || Date.now()),
        }));
        setMessages(mappedMessages);
      } else {
        const name = localStorage.getItem("thetechx_user_name") || "Friend";
        setMessages([
          {
            id: "init-return",
            role: "assistant",
            content: `Welcome back, **${name}**! 🎉 Let's continue our conversation. How can I assist you further?`,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (err) {
      console.error("[Notion History] Fetch failed:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // 4. Send Message to Agent
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMsgText = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMsgText,
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
          message: userMsgText,
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

        // If backend returns newly identified userName/userMobile, store them in localStorage
        if (data.agentState.userName && data.agentState.userMobile) {
          localStorage.setItem("thetechx_user_name", data.agentState.userName);
          localStorage.setItem("thetechx_user_mobile", data.agentState.userMobile);
          localStorage.setItem("thetechx_session_id", data.agentState.sessionId);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "I'm having trouble connecting to the backend service. Please check if the backend is running on port 3001.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Clear Local Storage and Session (Reset Chat)
  const resetSession = () => {
    localStorage.removeItem("thetechx_user_name");
    localStorage.removeItem("thetechx_user_mobile");
    localStorage.removeItem("thetechx_session_id");

    setMessages([
      {
        id: "init-reset",
        role: "assistant",
        content: "Hello! I am the TheTechX AI Assistant. How can I help you today?",
        timestamp: new Date(),
      },
    ]);
    setAgentState({
      sessionId: Math.random().toString(36).substring(2, 9),
      hasCollectedUserInfo: false,
    });
  };

  // 6. Simple custom markdown parser for rendering bold strings & bullet items
  const renderMessageContent = (content: string) => {
    if (!content) return null;
    const lines = content.split("\n");

    return lines.map((line, lineIdx) => {
      const trimmed = line.trim();
      const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("* ");
      let targetText = line;

      if (isBullet) {
        targetText = trimmed.substring(2);
      }

      // Parse bold tags **
      const parts = targetText.split("**");
      const processedLine = parts.map((part, partIdx) => {
        if (partIdx % 2 === 1) {
          return (
            <strong key={partIdx} className="font-bold text-indigo-300">
              {part}
            </strong>
          );
        }
        return part;
      });

      if (isBullet) {
        return (
          <li key={lineIdx} className="ml-5 list-disc text-slate-300 pl-1 py-0.5 leading-relaxed text-sm animate-message">
            {processedLine}
          </li>
        );
      }

      return (
        <p key={lineIdx} className="mb-2 last:mb-0 text-slate-200 leading-relaxed text-sm animate-message">
          {processedLine}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto px-4 py-6 md:py-8 justify-between">
      {/* ────────────────────────────────────────────────────────
          Premium Glassmorphic Wrapper
          ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col h-full w-full glass-panel rounded-3xl overflow-hidden glow-border">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-slate-950/20 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 glow-point"></span>
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold tracking-tight text-white glow-text">
                TheTechX Assistant
              </h1>
              <p className="text-xs text-indigo-200/60 hidden sm:block">
                Powered by Gemini & Pinecone RAG
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {agentState.userName && (
              <span className="text-xs text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 font-medium">
                👤 {agentState.userName}
              </span>
            )}
            <button
              onClick={resetSession}
              title="Reset Chat & Clear Profile"
              className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all active:scale-95"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Message Feeds */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-slate-950/10">
          
          {/* History loading indicator */}
          {isHistoryLoading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3">
              <div className="relative w-10 h-10">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500/20 rounded-full"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-xs text-indigo-300/80 animate-pulse font-medium">
                Fetching conversation history from Notion...
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex w-full ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4.5 py-3 transition-all ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/10 border border-indigo-500/30 rounded-tr-none animate-message"
                        : "bg-slate-900/80 text-slate-200 border border-white/5 rounded-tl-none animate-message"
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      {/* Message Content */}
                      <div className="text-sm">
                        {renderMessageContent(msg.content)}
                      </div>
                      
                      {/* Timestamp */}
                      <span className="text-[10px] text-white/40 self-end mt-1 block select-none">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Bot thinking bubble */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-900/80 border border-white/5 rounded-2xl rounded-tl-none px-5 py-3.5 flex items-center gap-1.5 shadow-md">
                    <span className="bounce-dot"></span>
                    <span className="bounce-dot"></span>
                    <span className="bounce-dot"></span>
                  </div>
                </div>
              )}
            </>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 md:p-5 border-t border-white/5 bg-slate-950/20 backdrop-blur">
          <div className="flex gap-2.5 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && sendMessage()
              }
              placeholder={
                !agentState.hasCollectedUserInfo
                  ? "Enter your name and mobile..."
                  : "Type your query here..."
              }
              className="flex-1 glass-input rounded-full px-5 py-3 text-sm placeholder-slate-400/50"
              disabled={isLoading || isHistoryLoading}
              autoFocus
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || isHistoryLoading || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white h-11 w-11 flex items-center justify-center rounded-full transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer glow-border shadow-indigo-600/20"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5.5 w-5.5 transform rotate-90 pr-0.5"
              >
                <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
              </svg>
            </button>
          </div>
          
          {/* Helpful Tips bar */}
          <div className="mt-3 flex justify-between items-center text-[10px] text-slate-500 px-2 select-none">
            <span>Press Enter to send</span>
            <span className="hidden sm:inline">Supports Pinecone RAG knowledge query & Tavily web search</span>
          </div>
        </div>

      </div>
    </div>
  );
}
