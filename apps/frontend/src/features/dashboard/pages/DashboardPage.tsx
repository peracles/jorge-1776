import { useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { BalanceCard } from "../../../components/dashboard/BalanceCard";
import { DonutChart } from "../../../components/dashboard/DonutChart";
import { BarChart } from "../../../components/dashboard/BarChart";
import { PaymentForm } from "../../../components/snailpay/PaymentForm";
import { getBetStats, mockRaceResults } from "../../../components/dashboard/mockData";

export function DashboardPage() {
  const { user } = useAuth();
  const [showPayment, setShowPayment] = useState(false);
  const betStats = getBetStats();

  function handlePaymentSuccess(amount: number) {
    setShowPayment(false);
    alert(`Payment of $${amount.toFixed(2)} approved!`);
  }

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
          onDeposit={() => setShowPayment(true)}
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

      {showPayment && (
        <PaymentForm
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  );
}
