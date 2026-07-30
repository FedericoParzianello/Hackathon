"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import type { AgentRun } from "@/lib/agent-activity";

type LiveAgentRun = Omit<AgentRun, "id" | "minutesAgo">;

interface AgentActivityContextValue {
  liveEvents: AgentRun[];
  logEvent: (event: LiveAgentRun) => void;
}

const AgentActivityContext = createContext<AgentActivityContextValue | null>(null);

let liveEventCounter = 0;

export function AgentActivityProvider({ children }: { children: ReactNode }) {
  const [liveEvents, setLiveEvents] = useState<AgentRun[]>([]);

  const logEvent = useCallback((event: LiveAgentRun) => {
    liveEventCounter += 1;
    setLiveEvents((prev) => [
      { ...event, id: `live-${liveEventCounter}`, minutesAgo: 0 },
      ...prev,
    ]);
  }, []);

  return (
    <AgentActivityContext.Provider value={{ liveEvents, logEvent }}>
      {children}
    </AgentActivityContext.Provider>
  );
}

/** Lets any page log a live event (e.g. a detected competitor threat) into the shared Agent Activity feed. */
export function useAgentActivity(): AgentActivityContextValue {
  const ctx = useContext(AgentActivityContext);
  if (!ctx) {
    throw new Error("useAgentActivity must be used within an AgentActivityProvider");
  }
  return ctx;
}
