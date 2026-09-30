import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

interface BalanceCardProps {
  balance: number;
  onDeposit: () => void;
}

export function BalanceCard({ balance, onDeposit }: BalanceCardProps) {
  return (
    <Card className="border-2 border-[var(--primary)]">
      <CardHeader>
        <CardTitle className="text-[var(--foreground)]">Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-[var(--primary)]">
          ${balance.toFixed(2)}
        </p>
        <button
          onClick={onDeposit}
          className="mt-4 w-full rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-all hover:opacity-90"
        >
          Deposit
        </button>
      </CardContent>
    </Card>
  );
}
