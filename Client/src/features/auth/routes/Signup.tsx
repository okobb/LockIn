import { Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useSignupForm } from "../hooks/useSignupForm";
import { Button } from "../../../shared/components/UI/Button";
import { Input } from "../../../shared/components/UI/Input";
import { Label } from "../../../shared/components/UI/Label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../shared/components/UI/Card";

export default function Signup() {
  const { googleLogin, githubLogin } = useAuth();
  const {
    values,
    handleChange,
    handleSubmit,
    isLoading,
    apiError,
    validationError,
  } = useSignupForm();

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <div className="flex flex-col items-center justify-center w-full max-w-[400px] gap-6">
        <Link
          to="/"
          className="flex items-center justify-center gap-3 w-full text-center hover:opacity-80 transition-opacity"
        >
          <img src="/Project logo.png" alt="Lock In" className="h-10 w-auto" />
          <span className="text-xl font-bold text-foreground">Lock In</span>
        </Link>

        <Card className="w-full shadow-lg">
          <CardHeader className="text-center">
            <CardTitle>Create an account</CardTitle>
            <CardDescription>
              Start saving your cognitive state today.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(apiError || validationError) && (
              <div className="bg-destructive/15 border border-destructive/50 text-destructive p-3 rounded-md mb-6 text-sm text-center">
                {validationError || apiError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={values.name}
                  onChange={handleChange("name")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={values.email}
                  onChange={handleChange("email")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={values.password}
                  onChange={handleChange("password")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm Password</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  placeholder="••••••••"
                  value={values.password_confirmation}
                  onChange={handleChange("password_confirmation")}
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-2"
                disabled={isLoading}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>

            <div className="flex items-center text-center my-6 text-muted-foreground text-xs uppercase">
              <div className="flex-1 border-b border-border"></div>
              <span className="px-3 bg-card">Or continue with</span>
              <div className="flex-1 border-b border-border"></div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => googleLogin.mutate()}
                disabled={googleLogin.isPending}
              >
                <svg
                  role="img"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-2 h-4 w-4 fill-current"
                >
                  <title>Gmail</title>
                  <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                </svg>
                {googleLogin.isPending ? "Connecting..." : "Google"}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => githubLogin.mutate()}
                disabled={githubLogin.isPending}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="mr-2 h-4 w-4 fill-current"
                >
                  <title>GitHub</title>
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
                {githubLogin.isPending ? "Connecting..." : "GitHub"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary hover:underline font-medium"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
