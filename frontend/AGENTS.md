<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# TheTechX Chat Agent — Frontend UI/UX Design & Architecture Plan

This document outlines the design structure, user experience, and technical plan for implementing the frontend interface.

---

## 1. Design Aesthetics & UI Layout
We aim for a state-of-the-art, premium interface that wows the user immediately.

### Color Palette & Styling (Dark/Glassmorphic Theme)
* **Theme**: Modern dark mode with deep navy and slate accents (`#0A0E1A` background).
* **Glassmorphism**: App panels will use translucent backgrounds with micro-borders (`backdrop-filter: blur(12px)` and `border: 1px solid rgba(255,255,255,0.08)`).
* **Typography**: Modern typography utilizing the Geist font family.
* **Gradients**: Beautiful subtle gradients for active elements, hover states, and headers.

### Layout Structure
* **Layout**: Full viewport height flexbox layout (`h-screen`).
* **Header Section**:
  * Title: **TheTechX AI Assistant** (with a glowing status indicator showing connection to the backend).
  * Subtitle: Dynamic instruction status (e.g., "Ask me about courses, news, or career roadmaps").
  * Controls: A "Reset Session" button that clears conversation history and stored credentials to start fresh.
* **Chat Message Feed**:
  * A scrollable central workspace with customized scrollbars.
  * Message bubbles:
    * **User Messages**: Sleek indigo gradient bubbles placed on the right.
    * **Assistant Messages**: Dark-translucent bubbles on the left, displaying rich markdown formatting.
  * Loading state: An animated pulsing skeleton or bouncing dots typing indicator when waiting for the agent to reply.
* **Input Area**:
  * Fixed at the bottom section of the page.
  * Includes a text input with auto-focus, responsive margins, and a styled "Send" button with a modern icon.

---

## 2. Technical Architecture & State Management

### LocalStorage & Session Persistence
* **User Session Cache**:
  * The frontend will check `localStorage` for `thetechx_user_name` and `thetechx_user_mobile`.
  * If found, these are pre-populated into the initial `agentState` sent with backend requests to bypass the initial credentials collection gate.
* **History Retrieval**:
  * We will implement a history retrieval flow. When the user opens the app and their mobile number is found in `localStorage`, the frontend will query the backend to retrieve their conversation history.
  * **Backend Extension**: We will extend the Express server in `server.ts` with a `GET /api/history` endpoint that fetches history from the Notion database using `getFromNotionTool`.
  * **Frontend Proxy Route**: Create a Next.js API route [route.ts](file:///c:/Users/N%20MADHAVI/OneDrive/Documents/jayanth%20folder/study/course/chat-agent/frontend/src/app/api/history/route.ts) that forwards requests to the backend's history endpoint.
  * On load, if history exists, populate the message feed, allowing the user to seamlessly resume their chat.

### Model & API Integration (Nvidia Endpoint)
* **Model in Use**: `mistralai/mistral-medium-3.5-128b` via the NVIDIA API Integration endpoint (`https://integrate.api.nvidia.com/v1`).
* **Reasoning Capabilities**: Configured with `"reasoning_effort": "high"` to enable high-quality cognitive planning and reasoning on responses.
* **Zod Constraints**: The structured extraction schemas use `.nullable().optional()` values instead of standard `.optional()` to comply with strict JSON schema specifications enforced by the `ChatOpenAI` endpoint parser.

### Component Structure
1. **[page.tsx](file:///c:/Users/N%20MADHAVI/OneDrive/Documents/jayanth%20folder/study/course/chat-agent/frontend/src/app/page.tsx)**: Main page wrapper.
2. **[ChatInterface.tsx](file:///c:/Users/N%20MADHAVI/OneDrive/Documents/jayanth%20folder/study/course/chat-agent/frontend/src/components/ChatInterface.tsx)**: Primary container managing messages, input, connection state, loader state, and localStorage interactions.
3. **Markdown Parser**: Basic markdown support for rendering bold text, bullet points, and code snippets returned by the LLM.
