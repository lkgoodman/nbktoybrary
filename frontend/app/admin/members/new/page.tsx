"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { useAuth } from "../../../lib/AuthContext";
import { useRegister, useCreateMembership } from "../../../lib/queries";

export default function NewMemberPage(): JSX.Element {
  const { isAdmin, isAuthenticated, token } = useAuth();
  const router = useRouter();
  const register = useRegister();
  const createMembership = useCreateMembership();

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [addressLine1, setAddressLine1] = useState<string>("");
  const [addressLine2, setAddressLine2] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [stateName, setStateName] = useState<string>("");
  const [zip, setZip] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) router.replace("/");
  }, [isAuthenticated, isAdmin, router]);

  if (!isAuthenticated || !isAdmin) return <Box />;

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    if (token === null) return;
    setError(null);
    register.mutate(
      {
        name,
        email,
        phone,
        password,
        address_line1: addressLine1,
        address_line2: addressLine2.trim() !== "" ? addressLine2.trim() : null,
        city,
        state: stateName,
        zip,
      },
      {
        onSuccess: (user) => {
          createMembership.mutate(
            { userId: user.id, token: token },
            {
              onSuccess: () => router.push(`/admin/members/${user.id}`),
              onError: (err) => setError(err.message),
            },
          );
        },
        onError: (err) => setError(err.message),
      },
    );
  }

  const isPending = register.isPending || createMembership.isPending;

  return (
    <Box component="main" sx={{ p: { xs: 2, md: 4 }, maxWidth: 520, mx: "auto" }}>
      <Stack spacing={3}>
        <Stack spacing={1}>
          <Button
            component={NextLink}
            href="/admin?tab=members"
            variant="text"
            size="small"
            sx={{ alignSelf: "flex-start", pl: 0 }}
          >
            ← Members
          </Button>
          <Typography variant="pageTitle" component="h1">Add member</Typography>
        </Stack>

        <Paper elevation={0} sx={{ p: 3 }}>
          <Stack component="form" onSubmit={handleSubmit} spacing={2}>
            <TextField
              label="Full name"
              size="small"
              required
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              label="Email"
              type="email"
              size="small"
              required
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Phone"
              size="small"
              required
              fullWidth
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <TextField
              label="Password"
              type="password"
              size="small"
              required
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <TextField
              label="Address line 1"
              size="small"
              required
              fullWidth
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
            />
            <TextField
              label="Address line 2 (optional)"
              size="small"
              fullWidth
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="City"
                size="small"
                required
                fullWidth
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              <TextField
                label="State"
                size="small"
                required
                sx={{ width: 80 }}
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
              />
              <TextField
                label="ZIP"
                size="small"
                required
                sx={{ width: 100 }}
                value={zip}
                onChange={(e) => setZip(e.target.value)}
              />
            </Stack>

            {error !== null ? (
              <Typography variant="body1" color="error">{error}</Typography>
            ) : null}

            <Button
              type="submit"
              variant="contained"
              disabled={isPending}
              fullWidth
            >
              {isPending ? "Creating…" : "Create member"}
            </Button>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
