"use client";

import { useEffect, useRef } from "react";

type GoogleLoginButtonProps = {
  onClick: () => void;
  disabled?: boolean;
};

export default function GoogleLoginButton({
  onClick,
  disabled,
}: GoogleLoginButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (buttonRef.current) {
      buttonRef.current.disabled = Boolean(disabled);
    }
  }, [disabled]);

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full h-10 rounded-full border border-input bg-background hover:bg-accent transition-colors text-sm font-medium"
    >
      Continue with Google
    </button>
  );
}
