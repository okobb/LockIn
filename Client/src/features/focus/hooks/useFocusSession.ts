import { useState, useEffect } from "react";
import {
  startFocusSession,
  getSession,
  type FocusSession,
} from "../api/focusApi";

interface FocusState {
  taskId?: number;
  title: string;
  isFreestyle?: boolean;
  sessionId?: number;
  isNewSession?: boolean; 
}

export const useFocusSession = (activeState: FocusState | null) => {
  const [session, setSession] = useState<FocusSession | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initSession = async () => {
      if (activeState?.sessionId) {
        setLoading(true);
        try {
          const fullSession = await getSession(activeState.sessionId);
          setSession(fullSession);
        } catch (err) {
          console.error("Failed to restore session", err);
          setSession({
            id: activeState.sessionId,
            title: activeState.title,
          } as FocusSession);
        } finally {
          setLoading(false);
        }
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
          const existingStored = localStorage.getItem("current_focus_session");
          let existingData = {};
          try {
            if (existingStored) {
              existingData = JSON.parse(existingStored);
            }
          } catch (e) {
            console.error("Failed to parse existing session for merge", e);
          }

          localStorage.setItem(
            "current_focus_session",
            JSON.stringify({ ...existingData, ...stateToSave })
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
