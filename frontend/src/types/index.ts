export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface AgentState {
  sessionId: string;
  userName?: string | null;
  userMobile?: string | null;
  hasCollectedUserInfo?: boolean;
  [key: string]: unknown;
}

export interface ChatRequest {
  message: string;
  sessionId: string;
  agentState: AgentState;
}

export interface ChatResponse {
  response: string;
  agentState: AgentState;
}
