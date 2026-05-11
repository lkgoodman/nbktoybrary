"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../lib/AuthContext";
import { useMembershipsByUser, useUpdateUser, queryKeys } from "../lib/queries";
import type { MembershipRead } from "../lib/types";

export default function ProfilePage(): JSX.Element {
  const { user, token, isAuthenticated, authReady, updateStoredUser } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: memberships } = useMembershipsByUser(user?.id ?? "", token);
  const membership: MembershipRead | null = memberships?.[0] ?? null;

  const updateUser = useUpdateUser();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");

  const [infoSaved, setInfoSaved] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (authReady && !isAuthenticated) {
      void router.replace("/login");
    }
  }, [authReady, isAuthenticated, router]);

  useEffect(() => {
    if (user !== null) {
      setName(user.name);
      setPhone(user.phone);
      setAddressLine1(user.address_line1);
      setAddressLine2(user.address_line2 ?? "");
      setCity(user.city);
      setState(user.state);
      setZip(user.zip);
    }
  }, [user]);

  if (!authReady || !isAuthenticated || user === null) return <Box />;

  function handleSaveInfo(): void {
    if (token === null || user === null) return;
    setInfoError(null);
    setInfoSaved(false);
    updateUser.mutate(
      {
        id: user.id,
        payload: {
          name,
          phone,
          address_line1: addressLine1,
          address_line2: addressLine2 !== "" ? addressLine2 : null,
          city,
          state,
          zip,
        },
        token,
      },
      {
        onSuccess: (updated) => {
          setInfoSaved(true);
          updateStoredUser(updated);
          void queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(user.id) });
        },
        onError: (err) => setInfoError(err.message),
      },
    );
  }

  function handleSavePassword(): void {
    if (token === null || user === null) return;
    setPasswordError(null);
    setPasswordSaved(false);
    updateUser.mutate(
      { id: user.id, payload: { password: newPassword }, token },
      {
        onSuccess: () => { setNewPassword(""); setPasswordSaved(true); },
        onError: (err) => setPasswordError(err.message),
      },
    );
  }

  return (
    <Box component="main" sx={{ p: { xs: 2, md: 4 }, maxWidth: 600, mx: "auto" }}>
      <Stack spacing={4}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="pageTitle" component="h1">My profile</Typography>
          {membership !== null ? (
            membership.account_standing === "temporary_hold" ? (
              <Chip label="Membership paused" size="small" color="warning" variant="outlined" />
            ) : membership.account_standing === "banned" ? (
              <Chip label="Membership banned" size="small" color="error" variant="outlined" />
            ) : (
              <Chip label="Active member" size="small" color="success" variant="outlined" />
            )
          ) : null}
        </Stack>

        <Paper elevation={0} sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="sectionTitle" component="h2">Personal info</Typography>
            <Typography variant="label" color="text.secondary">{user.email}</Typography>
            <TextField
              label="Full name"
              size="small"
              value={name}
              onChange={(e) => { setName(e.target.value); setInfoSaved(false); setInfoError(null); }}
            />
            <TextField
              label="Phone"
              size="small"
              value={phone}
              onChange={(e) => { setPhone(e.target.value); setInfoSaved(false); setInfoError(null); }}
            />
            <TextField
              label="Address line 1"
              size="small"
              value={addressLine1}
              onChange={(e) => { setAddressLine1(e.target.value); setInfoSaved(false); setInfoError(null); }}
            />
            <TextField
              label="Address line 2 (optional)"
              size="small"
              value={addressLine2}
              onChange={(e) => { setAddressLine2(e.target.value); setInfoSaved(false); setInfoError(null); }}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="City"
                size="small"
                value={city}
                onChange={(e) => { setCity(e.target.value); setInfoSaved(false); setInfoError(null); }}
                sx={{ flex: 1 }}
              />
              <TextField
                label="State"
                size="small"
                value={state}
                onChange={(e) => { setState(e.target.value); setInfoSaved(false); setInfoError(null); }}
                sx={{ width: { xs: "100%", sm: 80 } }}
              />
              <TextField
                label="ZIP"
                size="small"
                value={zip}
                onChange={(e) => { setZip(e.target.value); setInfoSaved(false); setInfoError(null); }}
                sx={{ width: { xs: "100%", sm: 100 } }}
              />
            </Stack>
            {infoError !== null ? (
              <Typography variant="body1" color="error">{infoError}</Typography>
            ) : null}
            {infoSaved ? (
              <Typography variant="body1" color="success.main">Profile updated.</Typography>
            ) : null}
            <Box>
              <Button
                variant="contained"
                size="small"
                disabled={updateUser.isPending || name.trim() === "" || phone.trim() === "" || addressLine1.trim() === "" || city.trim() === "" || state.trim() === "" || zip.trim() === ""}
                onClick={handleSaveInfo}
              >
                {updateUser.isPending ? "Saving…" : "Save changes"}
              </Button>
            </Box>
          </Stack>
        </Paper>

        <Divider />

        <Paper elevation={0} sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="sectionTitle" component="h2">Change password</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "flex-start" }}>
              <TextField
                label="New password"
                type="password"
                size="small"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setPasswordSaved(false); setPasswordError(null); }}
                sx={{ flex: 1 }}
              />
              <Button
                variant="outlined"
                size="small"
                disabled={updateUser.isPending || newPassword.length < 8}
                onClick={handleSavePassword}
              >
                {updateUser.isPending ? "Saving…" : "Save"}
              </Button>
            </Stack>
            {passwordError !== null ? (
              <Typography variant="body1" color="error">{passwordError}</Typography>
            ) : null}
            {passwordSaved ? (
              <Typography variant="body1" color="success.main">Password updated.</Typography>
            ) : null}
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
