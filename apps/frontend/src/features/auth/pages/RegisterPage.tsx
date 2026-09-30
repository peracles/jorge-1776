import { Link } from "react-router-dom";
import { RegisterForm } from "../../../components/auth/RegisterForm";

export function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="w-full max-w-md px-4">
        <RegisterForm />
        <p className="text-center text-sm text-[var(--muted-foreground)] mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-[var(--primary)] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
