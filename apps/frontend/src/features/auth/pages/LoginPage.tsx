import { Link } from "react-router-dom";
import { LoginForm } from "../../../components/auth/LoginForm";

export function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="w-full max-w-md px-4">
        <LoginForm />
        <p className="text-center text-sm text-[var(--muted-foreground)] mt-4">
          Don't have an account?{" "}
          <Link to="/register" className="text-[var(--primary)] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
