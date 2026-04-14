import type { ReactNode } from "react";
import type { Metadata } from "next";
import ThemeRegistry from "./theme/ThemeRegistry";

export const metadata: Metadata = {
  title: "nbktoybrary",
  description: "Hello world",
};

type RootLayoutProps = { children: ReactNode };

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
