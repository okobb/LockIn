import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { auth } from "../api/auth";
import { useAuthContext } from "../context/AuthContext";

export const useAuth = () => {
  const navigate = useNavigate();
  const { setAuth, logout, user, isAuthenticated } = useAuthContext();

  const handleAuthSuccess = (data: { data: { user: any; token: string } }) => {
    setAuth(data.data.user, data.data.token);
    navigate("/"); 
  };

  const loginMutation = useMutation({
    mutationFn: auth.login,
    onSuccess: handleAuthSuccess,
  });

  const registerMutation = useMutation({
    mutationFn: auth.register,
    onSuccess: handleAuthSuccess,
  });

  const googleLoginMutation = useMutation({
    mutationFn: auth.getGoogleRedirect,
    onSuccess: (data) => {
      if (data.data?.redirect_url) {
        window.location.href = data.data.redirect_url;
      }
    },
  });

  const githubLoginMutation = useMutation({
    mutationFn: auth.getGithubRedirect,
    onSuccess: (data) => {
      if (data.data?.redirect_url) {
        window.location.href = data.data.redirect_url;
      }
    },
  });

  return {
    user,
    isAuthenticated,
    login: loginMutation,
    register: registerMutation,
    googleLogin: googleLoginMutation,
    githubLogin: githubLoginMutation,
    logout: () => {
      logout();
      navigate("/login");
    },
  };
};