import { useState, type FormEvent, type ChangeEvent } from "react";
import { useAuth } from "./useAuth";

export const useSignupForm = () => {
  const { register } = useAuth();
  const [values, setValues] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
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

    if (values.password !== values.password_confirmation) {
      setValidationError("Passwords do not match.");
      return;
    }
    if (values.password.length < 8) {
      setValidationError("Password must be at least 8 characters.");
      return;
    }

    register.mutate(values);
  };

  return {
    values,
    handleChange,
    handleSubmit,
    isLoading: register.isPending,
    apiError: register.error instanceof Error ? register.error.message : null,
    validationError,
  };
};