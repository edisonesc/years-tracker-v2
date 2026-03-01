import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Setup from "./Setup";
import { BIRTH_DATE_KEY } from "@/constants";

// Mock useNavigate
const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return { ...actual, useNavigate: () => navigateMock };
});

function renderSetup() {
  return render(
    <MemoryRouter>
      <Setup />
    </MemoryRouter>,
  );
}

describe("Setup", () => {
  beforeEach(() => {
    localStorage.clear();
    navigateMock.mockReset();
  });

  it("renders the heading and description", () => {
    renderSetup();

    expect(screen.getByText("Life Tracker")).toBeInTheDocument();
    expect(
      screen.getByText("How many years have you lived?"),
    ).toBeInTheDocument();
  });

  it("renders the date-of-birth label", () => {
    renderSetup();

    expect(screen.getByText("Date of Birth")).toBeInTheDocument();
  });

  it("renders the Continue button", () => {
    renderSetup();

    expect(
      screen.getByRole("button", { name: /continue/i }),
    ).toBeInTheDocument();
  });

  it("disables the Continue button when no date is selected", () => {
    renderSetup();

    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("renders the date picker trigger with placeholder text", () => {
    renderSetup();

    expect(screen.getByText("Pick a date")).toBeInTheDocument();
  });

  it("shows the privacy notice", () => {
    renderSetup();

    expect(
      screen.getByText(/stored locally.*never shared/i),
    ).toBeInTheDocument();
  });

  it("shows the author tag", () => {
    renderSetup();

    expect(screen.getByText("@edisonesc")).toBeInTheDocument();
  });

  it("initializes birthdate from localStorage if available", () => {
    localStorage.setItem(BIRTH_DATE_KEY, "2000-01-15");
    renderSetup();

    // The DatePicker should display the formatted date instead of placeholder
    expect(screen.queryByText("Pick a date")).not.toBeInTheDocument();
    expect(screen.getByText(/January 15, 2000/)).toBeInTheDocument();
  });

  it("enables Continue button when a valid past date is stored", () => {
    localStorage.setItem(BIRTH_DATE_KEY, "2000-06-15");
    renderSetup();

    expect(
      screen.getByRole("button", { name: /continue/i }),
    ).not.toBeDisabled();
  });

  it("saves birthdate and navigates to /home on Continue click", async () => {
    localStorage.setItem(BIRTH_DATE_KEY, "1995-03-20");
    renderSetup();

    const button = screen.getByRole("button", { name: /continue/i });
    await userEvent.click(button);

    expect(localStorage.getItem(BIRTH_DATE_KEY)).toBe("1995-03-20");
    expect(navigateMock).toHaveBeenCalledWith("/home");
  });

  it("does not navigate when Continue is disabled", async () => {
    renderSetup();

    const button = screen.getByRole("button", { name: /continue/i });
    await userEvent.click(button);

    expect(navigateMock).not.toHaveBeenCalled();
  });
});
