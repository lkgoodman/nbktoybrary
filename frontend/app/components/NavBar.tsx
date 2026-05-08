"use client";

import { useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import AppBar from "@mui/material/AppBar";
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
              sx={{ height: 112, width: 112 }}
            />
            <Typography variant="navTitle" sx={{ color: "brand.name" }}>
              North Brooklyn Community Toybrary
            </Typography>
          </Box>
        </Box>

        {isAuthenticated ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography variant="label" sx={{ color: "text.secondary" }}>
              {user?.name}
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleOpenMenu}
              sx={{ px: 4, py: 1.5, fontSize: "1.1rem", bgcolor: "brand.name", "&:hover": { bgcolor: "brand.name" } }}
            >
              Menu
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
              <MenuItem component={NextLink} href="/" onClick={handleCloseMenu}>
                Inventory
              </MenuItem>
              <MenuItem component={NextLink} href="/hours" onClick={handleCloseMenu}>
                Hours
              </MenuItem>
              {isMember ? (
                <MenuItem component={NextLink} href="/requests" onClick={handleCloseMenu}>
                  Checkout history
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
              sx={{ px: 2, py: 1.5, fontSize: "1.1rem", color: "inherit" }}
            >
              Hours
            </Button>
            <Button
              component={NextLink}
              href="/login"
              variant="contained"
              size="large"
              sx={{ px: 4, py: 1.5, fontSize: "1.1rem", bgcolor: "brand.name", "&:hover": { bgcolor: "brand.name" } }}
            >
              Sign in
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
