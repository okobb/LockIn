import { BrowserRouter, Routes, Route } from "react-router-dom";
import {
  Login,
  Signup,
  ProtectedRoute,
  AuthCallback,
  Landing,
  Onboarding,
} from "../features/auth";
import { WeeklyPlanner } from "../features/calendar";
import { Dashboard } from "../features/dashboard";
import FocusMode from "../features/focus/routes/FocusMode";
import {
  ContextSave,
  ContextHistory,
  ContextDetail,
} from "../features/context";
import { ResourceHub } from "../features/resources/routes/ResourceHub/ResourceHub";
import { StatsPage } from "../features/stats";
import { Settings } from "../features/settings";
import { ModalProvider } from "../shared/context/ModalContext";
import "../shared/styles/global.css";

function App() {
  return (
    <ModalProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/weekly-planner" element={<WeeklyPlanner />} />
            <Route path="/focus" element={<FocusMode />} />
            <Route path="/context-save" element={<ContextSave />} />
            <Route path="/context-history" element={<ContextHistory />} />
            <Route
              path="/context-history/:sessionId"
              element={<ContextDetail />}
            />
            <Route path="/resources" element={<ResourceHub />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ModalProvider>
  );
}

export default App;
