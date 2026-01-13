import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthContext();

  useEffect(() => {
    const token = searchParams.get("token");
    const userStr = searchParams.get("user");
    const error = searchParams.get("error");

    if (error) {
      console.error("Auth callback error:", error);
      navigate("/login");
      return;
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setAuth(user, token);
        navigate("/dashboard");
      } catch (e) {
        console.error("Failed to parse user data", e);
        navigate("/login");
      }
    } else {
      // If we're here without params, something went wrong
      navigate("/login");
    }
  }, [searchParams, navigate, setAuth]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
      }}
    >
      <p>Authenticating...</p>
    </div>
  );
}
