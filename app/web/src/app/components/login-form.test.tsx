import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import LoginForm from "./login-form";

const { pushMock, loginMock, startGoogleLoginMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  loginMock: vi.fn(),
  startGoogleLoginMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("../contexts/auth-context", () => ({
  useAuth: () => ({
    login: loginMock,
    startGoogleLogin: startGoogleLoginMock,
  }),
}));

vi.mock("./google-login-button", () => ({
  default: ({
    onClick,
    disabled,
  }: {
    onClick: () => void;
    disabled?: boolean;
  }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      Continue with Google
    </button>
  ),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    pushMock.mockReset();
    loginMock.mockReset();
    startGoogleLoginMock.mockReset();
  });

  it("routes admins to the admin dashboard after a successful login", async () => {
    loginMock.mockResolvedValue({
      role: "ADMIN",
    });

    render(<LoginForm />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email"), "admin@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith("admin@example.com", "password123");
    });
    expect(pushMock).toHaveBeenCalledWith("/admin");
  });

  it("shows the backend error message when login fails", async () => {
    loginMock.mockRejectedValue(new Error("Invalid email or password"));

    render(<LoginForm />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "bad-password");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("Invalid email or password")).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });
});
