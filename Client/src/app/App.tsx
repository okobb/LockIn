import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login, Signup, ProtectedRoute, AuthCallback } from "../features/auth";
import { WeeklyPlanner } from "../features/calendar";
import { Dashboard } from "../features/dashboard";
import { Settings } from "../features/settings";
import { ModalProvider } from "../shared/context/ModalContext";
import "../shared/styles/global.css";

function App() {
  return (
    <ModalProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/weekly-planner" element={<WeeklyPlanner />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ModalProvider>
  );
}

export default App;
