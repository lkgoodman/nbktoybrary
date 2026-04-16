import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AuthProvider } from "./lib/AuthContext";
import { CartProvider } from "./lib/CartContext";
import QueryProvider from "./lib/QueryProvider";
import ThemeRegistry from "./theme/ThemeRegistry";
import NavBar from "./components/NavBar";

export const metadata: Metadata = {
  title: "nbktoybrary",
  description: "A toy lending library",
};

type RootLayoutProps = { children: ReactNode };

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <QueryProvider>
            <AuthProvider>
              <CartProvider>
                <NavBar />
                {children}
              </CartProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
