import { useState, useEffect, useRef } from "react";
import {
  startFocusSession,
  getSession,
  type FocusSession,
} from "../api/focusApi";
import { useSessionContext } from "../context/SessionContext";

interface FocusState {
  taskId?: number;
  title: string;
  isFreestyle?: boolean;
  sessionId?: number;
  isNewSession?: boolean;
  timer?: number;
  isPaused?: boolean;
}

export const useFocusSession = (activeState: FocusState | null) => {
  const [session, setSession] = useState<FocusSession | null>(null);
  const [loading, setLoading] = useState(false);
  const { updateSession, activeSession } = useSessionContext();

  // Track if we've already initialized to prevent duplicate session creation
  const hasInitializedRef = useRef<string | null>(null);

  useEffect(() => {
    const initSession = async () => {
      // Create a key to identify this session
      const sessionKey = activeState?.sessionId
        ? `session:${activeState.sessionId}`
        : activeState?.title
          ? `title:${activeState.title}`
          : null;

      // Skip if we've already initialized for this session
      if (sessionKey && hasInitializedRef.current === sessionKey) {
        return;
      }

      if (activeState?.sessionId) {
        // Restoring an existing session - just fetch data, don't reset timer
        hasInitializedRef.current = sessionKey;
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
        // Creating a new session
        if (activeSession?.sessionId) {
          // We have an existing session in context, don't create a new one
          hasInitializedRef.current = `session:${activeSession.sessionId}`;
          setLoading(true);
          try {
            const fullSession = await getSession(activeSession.sessionId);
            setSession(fullSession);
          } catch (err) {
            console.error("Failed to restore session from context", err);
            setSession({
              id: activeSession.sessionId,
              title: activeSession.title,
            } as FocusSession);
          } finally {
            setLoading(false);
          }
          return;
        }

        // Truly a new session - create it on the backend
        hasInitializedRef.current = sessionKey;
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
            timer: 25 * 60,
            isPaused: false,
            lastUpdated: Date.now(),
          };

          updateSession(stateToSave);
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
  }, [activeState?.title, activeState?.sessionId, activeSession?.sessionId]);

  return { session, loading, setSession };
};
