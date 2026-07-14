import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Space_Mono, DM_Sans } from "next/font/google";
import { AuthProvider } from "./lib/AuthContext";
import { CartProvider } from "./lib/CartContext";
import { FilterProvider } from "./lib/FilterContext";
import QueryProvider from "./lib/QueryProvider";
import ThemeRegistry from "./theme/ThemeRegistry";
import NavBar from "./components/NavBar";

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-space-mono",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "nbk toybrary",
  description: "A toy lending library",
};

type RootLayoutProps = { children: ReactNode };

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang="en" className={`${spaceMono.variable} ${dmSans.variable}`}>
      <body>
        <ThemeRegistry>
          <QueryProvider>
            <AuthProvider>
              <CartProvider>
                <FilterProvider>
                  <NavBar />
                  {children}
                </FilterProvider>
              </CartProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
