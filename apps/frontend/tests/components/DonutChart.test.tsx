import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { DonutChart } from "../../src/components/dashboard/DonutChart";

describe("DonutChart", () => {
  const mockData = [
    { name: "Won", value: 3 },
    { name: "Lost", value: 3 },
  ];

  it("should render without crashing", () => {
    const { container } = render(<DonutChart data={mockData} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("should render responsive container", () => {
    const { container } = render(<DonutChart data={mockData} />);
    expect(container.querySelector(".recharts-responsive-container")).toBeInTheDocument();
  });

  it("should render with empty data", () => {
    const { container } = render(<DonutChart data={[]} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
