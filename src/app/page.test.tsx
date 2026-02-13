import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "./page";

describe("Home page", () => {
  it("renders the product title and setup hint", () => {
    render(<Home />);

    expect(screen.getByText("pnp-app")).toBeInTheDocument();
    expect(
      screen.getByText(/Passe als Nächstes/i)
    ).toBeInTheDocument();
  });

  it("renders both call-to-action labels", () => {
    render(<Home />);

    expect(
      screen.getByRole("button", { name: "Sekundär" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Primär" })
    ).toBeInTheDocument();
  });
});
