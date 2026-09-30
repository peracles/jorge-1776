export const SNAILS = [
  { id: 1, name: "Turbo", color: "#FF6B6B" },
  { id: 2, name: "Flash", color: "#4ECDC4" },
  { id: 3, name: "Rayo", color: "#45B7D1" },
  { id: 4, name: "Veloz", color: "#96CEB4" },
  { id: 5, name: "Bolt", color: "#FFEAA7" },
  { id: 6, name: "Speedy", color: "#DDA0DD" },
];

export const mockBetHistory = [
  { id: "1", snailId: 1, amount: 50, won: true, date: "2026-09-29" },
  { id: "2", snailId: 2, amount: 30, won: false, date: "2026-09-29" },
  { id: "3", snailId: 3, amount: 40, won: true, date: "2026-09-29" },
  { id: "4", snailId: 4, amount: 20, won: false, date: "2026-09-29" },
  { id: "5", snailId: 5, amount: 60, won: true, date: "2026-09-29" },
  { id: "6", snailId: 6, amount: 25, won: false, date: "2026-09-29" },
];

export const mockRaceResults = [
  { name: "Turbo", victories: 2, color: "#FF6B6B" },
  { name: "Flash", victories: 1, color: "#4ECDC4" },
  { name: "Rayo", victories: 7, color: "#45B7D1" },
  { name: "Veloz", victories: 2, color: "#96CEB4" },
  { name: "Bolt", victories: 1, color: "#FFEAA7" },
  { name: "Speedy", victories: 3, color: "#DDA0DD" },
];

export function getBetStats() {
  const won = mockBetHistory.filter((b) => b.won).length;
  const lost = mockBetHistory.filter((b) => !b.won).length;
  return [
    { name: "Won", value: won },
    { name: "Lost", value: lost },
  ];
}
