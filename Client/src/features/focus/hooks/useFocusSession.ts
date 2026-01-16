import { useState, useEffect } from "react";
import { startFocusSession, type FocusSession } from "../api/focusApi";

interface FocusState {
  taskId?: number;
  title: string;
  isFreestyle?: boolean;
  sessionId?: number;
}

export const useFocusSession = (activeState: FocusState | null) => {
  const [session, setSession] = useState<FocusSession | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initSession = async () => {
      if (activeState?.sessionId) {
        setSession({
          id: activeState.sessionId,
          title: activeState.title,
        } as FocusSession);
        return;
      }

      if (activeState?.title && !session && !loading) {
        setLoading(true);
        try {
          const newSession = await startFocusSession({
            title: activeState.title,
            task_id: activeState.taskId,
          });

          setSession(newSession);
          console.log("Started new session:", newSession);

          const stateToSave = {
            title: activeState.title,
            taskId: activeState.taskId,
            sessionId: newSession.id,
            isFreestyle: activeState.isFreestyle,
          };
          localStorage.setItem(
            "current_focus_session",
            JSON.stringify(stateToSave)
          );
        } catch (error) {
          console.error("Failed to start session", error);
        } finally {
          setLoading(false);
        }
      }
    };

    if (activeState) {
      initSession();
    }
  }, [activeState?.title, activeState?.sessionId]);

  return { session, loading, setSession };
};
