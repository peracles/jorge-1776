import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/button";

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b bg-[var(--card)]">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-[var(--foreground)]">🐌 Snail Racing</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[var(--muted-foreground)]">
            Hola, <span className="font-medium text-[var(--foreground)]">{user?.fullName}</span>
          </span>
          <span className="text-sm font-semibold text-[var(--primary)]">
            ${user?.balance.toFixed(2) ?? "0.00"}
          </span>
          <Button variant="outline" size="sm" onClick={logout}>
            Cerrar sesión
          </Button>
        </div>
      </div>
    </header>
  );
}
