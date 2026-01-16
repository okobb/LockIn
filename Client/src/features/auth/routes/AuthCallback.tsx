import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground bg-grid-white/[0.02]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
          <img
            src="/Project logo.png"
            alt="Lock In"
            className="h-16 w-auto relative z-10 animate-pulse"
          />
        </div>
        <div className="flex items-center gap-2 text-primary font-medium">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Authenticating...</span>
        </div>
      </div>
    </div>
  );
}
