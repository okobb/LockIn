import { useState, type FormEvent, type ChangeEvent } from "react";
import { useAuth } from "./useAuth";

interface LoginErrors {
  email?: string;
  password?: string;
  general?: string;
}

export const useLoginForm = () => {
  const { login } = useAuth();
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<LoginErrors>({});

  const validate = (): boolean => {
    const newErrors: LoginErrors = {};

    if (!values.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!values.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange =
    (field: keyof typeof values) => (e: ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
      // Clear error for this field when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    login.mutate(values, {
      onError: (error) => {
        setErrors((prev) => ({
          ...prev,
          general: error instanceof Error ? error.message : "Login failed",
        }));
      },
    });
  };

  return {
    values,
    errors,
    handleChange,
    handleSubmit,
    isLoading: login.isPending,
  };
};
