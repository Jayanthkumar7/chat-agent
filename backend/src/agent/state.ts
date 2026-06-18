import { BaseMessage } from '@langchain/core/messages';

export interface AgentState {
  messages: BaseMessage[];
  userName: string | null;
  userMobile: string | null;
  sessionId: string;
  hasCollectedUserInfo: boolean;
}

export const initialState = (): AgentState => ({
  messages: [],
  userName: null,
  userMobile: null,
  sessionId: '',
  hasCollectedUserInfo: false,
});
