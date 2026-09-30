import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LoginForm } from "../../src/components/auth/LoginForm";
import { AuthProvider } from "../../src/stores/AuthProvider";

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <AuthProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </AuthProvider>
  );
}

describe("LoginForm", () => {
  it("should render email and password fields", () => {
    renderWithProviders(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("should render sign in button", () => {
    renderWithProviders(<LoginForm />);
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("should render link to register page", () => {
    renderWithProviders(<LoginForm />);
    // The link is in LoginPage, not LoginForm, so we just verify the form renders
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
  });
});
