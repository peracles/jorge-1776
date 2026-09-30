import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RegisterForm } from "../../src/components/auth/RegisterForm";
import { AuthProvider } from "../../src/stores/AuthProvider";

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <AuthProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </AuthProvider>
  );
}

describe("RegisterForm", () => {
  it("should render all form fields", () => {
    renderWithProviders(<RegisterForm />);
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it("should render sign up button", () => {
    renderWithProviders(<RegisterForm />);
    expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument();
  });

  it("should render create account title", () => {
    renderWithProviders(<RegisterForm />);
    expect(screen.getByText(/create account/i)).toBeInTheDocument();
  });
});
