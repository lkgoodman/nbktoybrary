"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { useRegister } from "../lib/queries";

export default function ApplyPage(): JSX.Element {
  const register = useRegister();
  const router = useRouter();

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [addressLine1, setAddressLine1] = useState<string>("");
  const [addressLine2, setAddressLine2] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [state, setState] = useState<string>("");
  const [zip, setZip] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    register.mutate(
      {
        name,
        email,
        phone,
        password,
        address_line1: addressLine1,
        address_line2: addressLine2.length > 0 ? addressLine2 : null,
        city,
        state,
        zip,
      },
      {
        onSuccess: () => setSubmitted(true),
      },
    );
  }

  if (submitted) {
    return (
      <Box component="main" sx={{ p: 4, maxWidth: 480, mx: "auto" }}>
        <Paper elevation={0} sx={{ p: 4 }}>
          <Stack spacing={2}>
            <Typography variant="pageTitle" component="h1">
              Application submitted
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Your membership application is under review. We will be in touch with more information soon.
            </Typography>
            <Button component={NextLink} href="/login" variant="contained">
              Go to sign in
            </Button>
          </Stack>
        </Paper>
      </Box>
    );
  }

  return (
    <Box component="main" sx={{ p: 4, maxWidth: 480, mx: "auto" }}>
      <Paper elevation={0} sx={{ p: 4 }}>
        <Stack spacing={3} component="form" onSubmit={handleSubmit}>
          <Typography variant="pageTitle" component="h1">
            Apply for membership
          </Typography>

          {register.isError ? (
            <Typography variant="body1" color="error">
              {register.error.message}
            </Typography>
          ) : null}

          <Typography variant="label" color="text.secondary">
            Personal info
          </Typography>
          <TextField
            label="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            fullWidth
          />
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
            label="Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            fullWidth
            autoComplete="tel"
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            inputProps={{ minLength: 8 }}
            autoComplete="new-password"
          />

          <Divider />

          <Typography variant="label" color="text.secondary">
            Address
          </Typography>
          <TextField
            label="Address line 1"
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
            required
            fullWidth
            autoComplete="address-line1"
          />
          <TextField
            label="Address line 2 (optional)"
            value={addressLine2}
            onChange={(e) => setAddressLine2(e.target.value)}
            fullWidth
            autoComplete="address-line2"
          />
          <Stack direction="row" spacing={2}>
            <TextField
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              fullWidth
              autoComplete="address-level2"
            />
            <TextField
              label="State"
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
              sx={{ width: 100 }}
              autoComplete="address-level1"
            />
            <TextField
              label="ZIP"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              required
              sx={{ width: 120 }}
              autoComplete="postal-code"
            />
          </Stack>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={register.isPending}
          >
            {register.isPending ? "Submitting…" : "Submit application"}
          </Button>

          <Typography variant="body1" color="text.secondary" textAlign="center">
            Already a member?{" "}
            <Box component={NextLink} href="/login" sx={{ color: "secondary.main" }}>
              Sign in
            </Box>
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
