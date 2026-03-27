import type React from "react";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { RealtimeSync } from "./components/realtime-sync";
import { AuthProvider } from "./contexts/auth-context";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "PredictPoints - Forecast Events, Earn Points",
  description:
    "Gamified prediction platform with points-based rewards. No money involved.",
  generator: "v0.app",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const analyticsEnabled =
    process.env.NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS === "true";

  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <Providers>
          <AuthProvider>
            {children}
            <RealtimeSync />
            {analyticsEnabled ? <Analytics /> : null}
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
