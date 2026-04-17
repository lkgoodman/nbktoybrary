"use client";

import NextLink from "next/link";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";

import { useAuth } from "../lib/AuthContext";
import { useCart } from "../lib/CartContext";

export default function NavBar(): JSX.Element {
  const { user, logout, isAuthenticated, isAdmin, isMember } = useAuth();
  const { cartIds } = useCart();

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
            {isAdmin ? (
              <Button component={NextLink} href="/admin" variant="text" size="small">
                Admin
              </Button>
            ) : null}
            {isMember ? (
              <>
                <Button component={NextLink} href="/requests" variant="text" size="small">
                  My requests
                </Button>
                <Button component={NextLink} href="/cart" variant="text" size="small">
                  Cart {cartIds.length > 0 ? `(${cartIds.length})` : ""}
                </Button>
              </>
            ) : null}
            <Typography variant="label" sx={{ color: "text.secondary" }}>
              {user?.name}
            </Typography>
            <Button variant="contained" size="large" onClick={logout} sx={{ px: 4, py: 1.5, fontSize: "1.1rem", bgcolor: "brand.name", "&:hover": { bgcolor: "brand.name" } }}>
              Sign out
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button component={NextLink} href="/login" variant="contained" size="large" sx={{ px: 4, py: 1.5, fontSize: "1.1rem", bgcolor: "brand.name", "&:hover": { bgcolor: "brand.name" } }}>
              Sign in
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}
