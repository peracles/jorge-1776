import { useAuth } from "../../../hooks/useAuth";

export function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-4">
          <span>Hola, {user?.fullName}</span>
          <button onClick={logout} className="text-sm underline">
            Cerrar sesión
          </button>
        </div>
      </header>
      <div className="text-center text-muted-foreground">
        <p>Dashboard (placeholder)</p>
      </div>
    </div>
  );
}
