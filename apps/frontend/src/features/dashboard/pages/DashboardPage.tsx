import { useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { BalanceCard } from "../../../components/dashboard/BalanceCard";
import { DonutChart } from "../../../components/dashboard/DonutChart";
import { BarChart } from "../../../components/dashboard/BarChart";
import { getBetStats, mockRaceResults } from "../../../components/dashboard/mockData";

export function DashboardPage() {
  const { user } = useAuth();
  const [showDeposit, setShowDeposit] = useState(false);
  const betStats = getBetStats();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="border-2 border-[var(--border)]">
          <CardHeader>
            <CardTitle className="text-[var(--foreground)]">Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">Name</p>
                <p className="font-semibold text-[var(--foreground)]">{user?.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--muted-foreground)]">Email</p>
                <p className="font-semibold text-[var(--foreground)]">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <BalanceCard
          balance={user?.balance ?? 0}
          onDeposit={() => setShowDeposit(true)}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card className="border-2 border-[var(--border)]">
          <CardHeader>
            <CardTitle className="text-[var(--foreground)]">Bet History</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={betStats} />
          </CardContent>
        </Card>

        <Card className="border-2 border-[var(--border)]">
          <CardHeader>
            <CardTitle className="text-[var(--foreground)]">Race Results</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={mockRaceResults} />
          </CardContent>
        </Card>
      </div>

      {showDeposit && (
        <Card className="border-2 border-[var(--primary)]">
          <CardHeader>
            <CardTitle className="text-[var(--foreground)]">Deposit (SnailPay)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--muted-foreground)]">
              Payment form will be implemented in Milestone 3.7
            </p>
            <button
              onClick={() => setShowDeposit(false)}
              className="mt-4 rounded-full border-2 border-[var(--border)] bg-[var(--card)] px-6 py-2 text-sm font-medium text-[var(--foreground)] transition-all hover:bg-[var(--primary)] hover:text-[var(--primary-foreground)]"
            >
              Close
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
