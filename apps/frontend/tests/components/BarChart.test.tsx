import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { BarChart } from "../../src/components/dashboard/BarChart";

describe("BarChart", () => {
  const mockData = [
    { name: "Turbo", victories: 2, color: "#FF6B6B" },
    { name: "Flash", victories: 1, color: "#4ECDC4" },
    { name: "Rayo", victories: 2, color: "#45B7D1" },
  ];

  it("should render without crashing", () => {
    const { container } = render(<BarChart data={mockData} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("should render responsive container", () => {
    const { container } = render(<BarChart data={mockData} />);
    expect(container.querySelector(".recharts-responsive-container")).toBeInTheDocument();
  });

  it("should render with empty data", () => {
    const { container } = render(<BarChart data={[]} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
