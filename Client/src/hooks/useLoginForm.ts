import { useState, type FormEvent, type ChangeEvent } from "react";
import { useAuth } from "./useAuth";

export const useLoginForm = () => {
  const { login } = useAuth();
  const [values, setValues] = useState({ email: "", password: "" });
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleChange = (field: keyof typeof values) => (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
    if (validationError) setValidationError(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!values.email || !values.email.includes("@")) {
      setValidationError("Please enter a valid email address.");
      return;
    }
    if (!values.password) {
      setValidationError("Password is required.");
      return;
    }

    login.mutate(values);
  };

  return {
    values,
    handleChange,
    handleSubmit,
    isLoading: login.isPending,
    apiError: login.error instanceof Error ? login.error.message : null,
    validationError,
  };
};