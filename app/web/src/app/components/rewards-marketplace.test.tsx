import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import RewardsMarketplace from "./rewards-marketplace";

const { useAuthMock, useRewardsCatalogMock, useRedeemRewardMock, mutateMock } =
  vi.hoisted(() => ({
    useAuthMock: vi.fn(),
    useRewardsCatalogMock: vi.fn(),
    useRedeemRewardMock: vi.fn(),
    mutateMock: vi.fn(),
  }));

vi.mock("../contexts/auth-context", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/hooks/use-api", () => ({
  useRewardsCatalog: (...args: unknown[]) => useRewardsCatalogMock(...args),
  useRedeemReward: () => useRedeemRewardMock(),
}));

describe("RewardsMarketplace", () => {
  beforeEach(() => {
    mutateMock.mockReset();
    useAuthMock.mockReset();
    useRewardsCatalogMock.mockReset();
    useRedeemRewardMock.mockReset();

    useAuthMock.mockReturnValue({
      user: {
        id: "user-1",
      },
    });
    useRedeemRewardMock.mockReturnValue({
      mutate: mutateMock,
      isPending: false,
    });
  });

  it("requires reward-specific input before enabling redemption", () => {
    useRewardsCatalogMock.mockReturnValue({
      data: {
        items: [
          {
            id: "reward-1",
            name: "Mobile Topup",
            description: "Get mobile credit",
            type: "TOPUP",
            pointsRequired: 100,
            iconKey: "smartphone",
            isActive: true,
            createdAt: "2026-03-27T00:00:00.000Z",
            updatedAt: "2026-03-27T00:00:00.000Z",
          },
        ],
      },
      isLoading: false,
      isError: false,
    });

    render(<RewardsMarketplace userPoints={500} />);

    expect(screen.getByRole("button", { name: "Fill Required Info" })).toBeDisabled();
  });

  it("submits trimmed redemption details and clears the form on success", async () => {
    useRewardsCatalogMock.mockReturnValue({
      data: {
        items: [
          {
            id: "reward-1",
            name: "Gift Card",
            description: "Digital gift card",
            type: "GIFT_CARD",
            pointsRequired: 200,
            iconKey: "gift",
            isActive: true,
            createdAt: "2026-03-27T00:00:00.000Z",
            updatedAt: "2026-03-27T00:00:00.000Z",
          },
        ],
      },
      isLoading: false,
      isError: false,
    });
    mutateMock.mockImplementation((payload, options) => {
      options?.onSuccess?.();
      return payload;
    });

    render(<RewardsMarketplace userPoints={500} />);

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("Email"), "  Winner@Example.com ");
    await user.type(screen.getByPlaceholderText("Optional note"), "  Send today ");
    await user.click(screen.getByRole("button", { name: "Redeem Now" }));

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalled();
    });
    expect(mutateMock).toHaveBeenCalledWith(
      {
        rewardId: "reward-1",
        email: "Winner@Example.com",
        note: "Send today",
        fullName: undefined,
        phoneNumber: undefined,
      },
      expect.objectContaining({
        onError: expect.any(Function),
        onSuccess: expect.any(Function),
      }),
    );
    expect(screen.getByText("Redeemed Gift Card.")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email")).toHaveValue("");
    expect(screen.getByPlaceholderText("Optional note")).toHaveValue("");
  });
});
