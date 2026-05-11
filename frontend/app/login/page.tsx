"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { useAuth } from "../lib/AuthContext";
import type { UserRead } from "../lib/types";

export default function LoginPage(): JSX.Element {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const user: UserRead = await login(email, password);
      const isAdmin = user.roles.includes("admin") || user.roles.includes("superadmin");
      sessionStorage.setItem("welcomeName", user.name);
      router.push(isAdmin ? "/admin" : "/");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Box component="main" sx={{ p: { xs: 2, md: 4 }, maxWidth: 480, mx: "auto" }}>
      <Paper elevation={0} sx={{ p: 4 }}>
        <Stack spacing={3} component="form" onSubmit={handleSubmit}>
          <Typography variant="pageTitle" component="h1">
            Sign in
          </Typography>

          {error !== null ? (
            <Typography variant="body1" color="error">
              {error}
            </Typography>
          ) : null}

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            autoComplete="email"
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            autoComplete="current-password"
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isLoading}
          >
            {isLoading ? "Signing in…" : "Sign in"}
          </Button>

          <Typography variant="body1" color="text.secondary" textAlign="center">
            Don&apos;t have an account?{" "}
            <Box component="a" href="https://nbktoybrary.org/membership-application" target="_blank" rel="noopener noreferrer" sx={{ color: "secondary.main" }}>
              Apply for membership
            </Box>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
