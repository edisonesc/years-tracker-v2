import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Home from "./Home";
import {
  BIRTH_DATE_KEY,
  TARGET_DATE_KEY,
  DEFAULT_TARGET_YEAR,
} from "@/constants";

// Mock useNavigate & Navigate
const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom",
  );
  return {
    ...actual,
    useNavigate: () => navigateMock,
    Navigate: ({ to }: { to: string }) => (
      <div data-testid="navigate" data-to={to} />
    ),
  };
});

// Mock NumberFlow — renders value as plain text
vi.mock("@number-flow/react", () => ({
  default: ({ value }: { value: number }) => <span>{value}</span>,
}));

// Mock GridProgress — just render a stub so tests stay focused on Home logic
vi.mock("@/components/GridProgress", () => ({
  GridProgress: ({ unit }: { unit: string }) => (
    <div data-testid={`grid-${unit}`} />
  ),
}));

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );
}

describe("Home", () => {
  beforeEach(() => {
    localStorage.clear();
    navigateMock.mockReset();
  });

  // ── Redirect guard ──────────────────────────────────────────────────────────

  it("redirects to /setup when no birthdate is in localStorage", () => {
    renderHome();

    const nav = screen.getByTestId("navigate");
    expect(nav).toHaveAttribute("data-to", "/setup");
  });

  // ── Header ──────────────────────────────────────────────────────────────────

  it("renders the page heading", () => {
    localStorage.setItem(BIRTH_DATE_KEY, "2000-01-15");
    renderHome();

    expect(screen.getByText("Your Life in Numbers")).toBeInTheDocument();
    expect(screen.getByText("Life Tracker")).toBeInTheDocument();
  });

  it("displays the formatted birthdate", () => {
    localStorage.setItem(BIRTH_DATE_KEY, "1995-08-22");
    renderHome();

    expect(screen.getByText("Aug 22, 1995")).toBeInTheDocument();
  });

  it("shows the Born label", () => {
    localStorage.setItem(BIRTH_DATE_KEY, "2000-01-15");
    renderHome();

    expect(screen.getByText("Born")).toBeInTheDocument();
  });

  // ── Target age ──────────────────────────────────────────────────────────────

  it("displays the default target age when none is stored", async () => {
    localStorage.setItem(BIRTH_DATE_KEY, "2000-01-15");
    renderHome();

    expect(screen.getByText("Target")).toBeInTheDocument();
    expect(
      await screen.findByText(String(DEFAULT_TARGET_YEAR)),
    ).toBeInTheDocument();
    expect(screen.getByText("yrs")).toBeInTheDocument();
  });

  it("displays a custom target age from localStorage", async () => {
    localStorage.setItem(BIRTH_DATE_KEY, "2000-01-15");
    localStorage.setItem(TARGET_DATE_KEY, "90");
    renderHome();

    expect(await screen.findByText("90")).toBeInTheDocument();
  });

  // ── Carousel tabs ──────────────────────────────────────────────────────────

  it("renders all four unit tabs", () => {
    localStorage.setItem(BIRTH_DATE_KEY, "2000-01-15");
    renderHome();

    expect(screen.getByText("Years")).toBeInTheDocument();
    expect(screen.getByText("Months")).toBeInTheDocument();
    expect(screen.getByText("Weeks")).toBeInTheDocument();
    expect(screen.getByText("Days")).toBeInTheDocument();
  });

  // ── Settings popover ───────────────────────────────────────────────────────

  it("opens settings popover and shows target age input", async () => {
    localStorage.setItem(BIRTH_DATE_KEY, "2000-01-15");
    renderHome();

    // Click the settings gear button
    const settingsButtons = screen.getAllByRole("button");
    // The settings button contains the Settings2 icon, find it
    const settingsBtn = settingsButtons.find((btn) =>
      btn.querySelector(".lucide-settings-2"),
    );
    expect(settingsBtn).toBeDefined();
    await userEvent.click(settingsBtn!);

    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Target age")).toBeInTheDocument();
    expect(screen.getByRole("spinbutton")).toBeInTheDocument();
  });

  it("updates target age via settings input", async () => {
    localStorage.setItem(BIRTH_DATE_KEY, "2000-01-15");
    renderHome();

    // Open settings
    const settingsBtn = screen
      .getAllByRole("button")
      .find((btn) => btn.querySelector(".lucide-settings-2"));
    await userEvent.click(settingsBtn!);

    const input = screen.getByRole("spinbutton");
    await userEvent.clear(input);
    await userEvent.type(input, "90");

    expect(localStorage.getItem(TARGET_DATE_KEY)).toBe("90");
  });

  it("navigates to /setup when Setup button in settings is clicked", async () => {
    localStorage.setItem(BIRTH_DATE_KEY, "2000-01-15");
    renderHome();

    // Open settings
    const settingsBtn = screen
      .getAllByRole("button")
      .find((btn) => btn.querySelector(".lucide-settings-2"));
    await userEvent.click(settingsBtn!);

    // Click the "Setup" link button inside the popover
    await userEvent.click(screen.getByRole("button", { name: /setup/i }));

    expect(navigateMock).toHaveBeenCalledWith("/setup");
  });

  // ── GridProgress integration ───────────────────────────────────────────────

  it("renders the years grid by default (first carousel item)", () => {
    localStorage.setItem(BIRTH_DATE_KEY, "2000-01-15");
    renderHome();

    expect(screen.getByTestId("grid-years")).toBeInTheDocument();
  });
});
