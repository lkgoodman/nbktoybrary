"use client";

import { useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

import { useAuth } from "../lib/AuthContext";
import { useCart } from "../lib/CartContext";

export default function NavBar(): JSX.Element {
  const { user, logout, isAuthenticated, isAdmin, isMember } = useAuth();
  const { cartIds } = useCart();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  function handleOpenMenu(e: React.MouseEvent<HTMLElement>): void {
    setAnchorEl(e.currentTarget);
  }

  function handleCloseMenu(): void {
    setAnchorEl(null);
  }

  function handleSignOut(): void {
    handleCloseMenu();
    sessionStorage.removeItem("welcomeName");
    sessionStorage.setItem("signedOut", "true");
    logout();
    router.push("/");
  }

  return (
    <AppBar position="static" elevation={0} sx={{ bgcolor: "header.main" }}>
      <Toolbar>
        <Box sx={{ flexGrow: 1 }}>
          <Box
            component={NextLink}
            href="/"
            sx={{ display: "inline-flex", alignItems: "center", gap: 2, textDecoration: "none", color: "inherit" }}
          >
            <Box
              component="img"
              src="/logo.png"
              alt="North Brooklyn Community Toybrary"
              sx={{ height: { xs: 96, md: 112 }, width: { xs: 96, md: 112 }, flexShrink: 0 }}
            />
            <Typography variant="navTitle" sx={{ color: "brand.name", display: { xs: "none", md: "block" } }}>
              North Brooklyn Community Toybrary
            </Typography>
          </Box>
        </Box>

        {isAuthenticated ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {cartIds.length > 0 ? (
              <IconButton component={NextLink} href="/cart" sx={{ color: "inherit" }}>
                <Badge badgeContent={cartIds.length} color="error">
                  <Box
                    component="svg"
                    viewBox="0 0 24 24"
                    sx={{ width: 24, height: 24, fill: "currentColor" }}
                  >
                    <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM5.07 4H2v2h2l3.6 7.59L6.25 15c-.16.28-.25.61-.25.95C6 17.1 6.9 18 8 18h12v-2H8.42c-.14 0-.25-.11-.25-.25l.03-.12L9.1 14h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0 0 21 5H7.21l-.27-1H5.07z" />
                  </Box>
                </Badge>
              </IconButton>
            ) : null}
            <Button
              component={NextLink}
              href="/"
              variant="text"
              size="large"
              sx={{ px: { xs: 1, md: 2 }, py: { xs: 1, md: 1.5 }, fontSize: { xs: "0.85rem", md: "1.1rem" }, color: "inherit" }}
            >
              Toys
            </Button>
            <Button
              component={NextLink}
              href="/hours"
              variant="text"
              size="large"
              sx={{ px: { xs: 1, md: 2 }, py: { xs: 1, md: 1.5 }, fontSize: { xs: "0.85rem", md: "1.1rem" }, color: "inherit" }}
            >
              Hours
            </Button>
            <Button
              variant="contained"
              size="large"
              onClick={handleOpenMenu}
              sx={{ px: { xs: 2, md: 4 }, py: { xs: 1, md: 1.5 }, fontSize: { xs: "0.85rem", md: "1.1rem" }, bgcolor: "brand.name", "&:hover": { bgcolor: "brand.name" } }}
            >
              {user?.name ?? "My account"}
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={anchorEl !== null}
              onClose={handleCloseMenu}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
            >
              {isAdmin ? (
                <MenuItem component={NextLink} href="/admin" onClick={handleCloseMenu}>
                  Admin
                </MenuItem>
              ) : null}
              {isMember ? (
                <MenuItem component={NextLink} href="/loans" onClick={handleCloseMenu}>
                  Loans
                </MenuItem>
              ) : null}
              {isMember ? (
                <MenuItem component={NextLink} href="/cart" onClick={handleCloseMenu}>
                  Cart {cartIds.length > 0 ? `(${cartIds.length})` : ""}
                </MenuItem>
              ) : null}
              <Divider />
              <MenuItem component={NextLink} href="/profile" onClick={handleCloseMenu}>
                My profile
              </MenuItem>
              <MenuItem onClick={handleSignOut}>Sign out</MenuItem>
            </Menu>
          </Box>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              component={NextLink}
              href="/hours"
              variant="text"
              size="large"
              sx={{ px: { xs: 1, md: 2 }, py: { xs: 1, md: 1.5 }, fontSize: { xs: "0.85rem", md: "1.1rem" }, color: "inherit" }}
            >
              Hours
            </Button>
            <Button
              component={NextLink}
              href="/login"
              variant="contained"
              size="large"
              sx={{ px: { xs: 2, md: 4 }, py: { xs: 1, md: 1.5 }, fontSize: { xs: "0.85rem", md: "1.1rem" }, bgcolor: "brand.name", "&:hover": { bgcolor: "brand.name" } }}
            >
              Sign in
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
