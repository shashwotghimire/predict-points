import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import RegisterForm from "./register-form";

const { pushMock, registerMock, startGoogleLoginMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  registerMock: vi.fn(),
  startGoogleLoginMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("../contexts/auth-context", () => ({
  useAuth: () => ({
    register: registerMock,
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

describe("RegisterForm", () => {
  beforeEach(() => {
    pushMock.mockReset();
    registerMock.mockReset();
    startGoogleLoginMock.mockReset();
  });

  it("blocks submission when the passwords do not match", async () => {
    render(<RegisterForm />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Full Name"), "A User");
    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm Password"), "different123");
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
    expect(registerMock).not.toHaveBeenCalled();
  });

  it("registers a user and routes to the dashboard on success", async () => {
    registerMock.mockResolvedValue({
      id: "user-1",
    });

    render(<RegisterForm />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Full Name"), "A User");
    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Confirm Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    expect(registerMock).toHaveBeenCalledWith(
      "user@example.com",
      "password123",
      "A User",
    );
    expect(pushMock).toHaveBeenCalledWith("/dashboard");
  });
});
