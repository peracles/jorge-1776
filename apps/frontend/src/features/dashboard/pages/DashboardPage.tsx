import { useAuth } from "../../../hooks/useAuth";

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Bienvenido, {user?.fullName}
      </h2>
      <div className="text-center text-muted-foreground">
        <p>Dashboard (placeholder)</p>
      </div>
    </div>
  );
}
