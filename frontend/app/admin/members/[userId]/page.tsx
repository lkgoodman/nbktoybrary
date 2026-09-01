"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../lib/AuthContext";
import { useUser, useAdminBorrowRequests, useToys, useMembershipsByUser, useUpdateMembershipStanding, useCreateMembership, useResetUserPassword, useUpdateUser, useDeleteUser, queryKeys } from "../../../lib/queries";
import type { BorrowRequestReadWithDetails, MembershipRead, Toy, ToyImage } from "../../../lib/types";

function getFeaturedImage(toy: Toy): ToyImage | null {
  return toy.images.find((img: ToyImage) => img.is_featured) ?? toy.images[0] ?? null;
}

export default function AdminMemberPage({
  params,
}: {
  params: { userId: string };
}): JSX.Element {
  const { isAdmin, isSuperadmin, isAuthenticated, token, authReady } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: member, isPending: memberPending, isError: memberError } = useUser(params.userId, token);
  const { data: allRequests, isPending: requestsPending } = useAdminBorrowRequests(token);
  const { data: toys } = useToys(token, { enabled: authReady });
  const { data: memberships } = useMembershipsByUser(params.userId, isSuperadmin ? token : null);
  const updateStanding = useUpdateMembershipStanding();
  const createMembership = useCreateMembership();
  const resetPassword = useResetUserPassword();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const membership: MembershipRead | null = memberships?.[0] ?? null;
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmDeleteMember, setConfirmDeleteMember] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<boolean>(false);

  const [editingInfo, setEditingInfo] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [addressLine1, setAddressLine1] = useState<string>("");
  const [addressLine2, setAddressLine2] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [state, setState] = useState<string>("");
  const [zip, setZip] = useState<string>("");
  const [infoError, setInfoError] = useState<string | null>(null);
  const [infoSuccess, setInfoSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) router.replace("/");
  }, [isAuthenticated, isAdmin, router]);

  useEffect(() => {
    if (member !== undefined) {
      setName(member.name);
      setPhone(member.phone);
      setAddressLine1(member.address_line1);
      setAddressLine2(member.address_line2 ?? "");
      setCity(member.city);
      setState(member.state);
      setZip(member.zip);
    }
  }, [member]);

  if (!isAuthenticated || !isAdmin) return <Box />;

  function handleStartEdit(): void {
    setInfoError(null);
    setInfoSuccess(false);
    setEditingInfo(true);
  }

  function handleCancelEdit(): void {
    if (member !== undefined) {
      setName(member.name);
      setPhone(member.phone);
      setAddressLine1(member.address_line1);
      setAddressLine2(member.address_line2 ?? "");
      setCity(member.city);
      setState(member.state);
      setZip(member.zip);
    }
    setInfoError(null);
    setEditingInfo(false);
  }

  function handleSaveInfo(): void {
    if (token === null) return;
    setInfoError(null);
    setInfoSuccess(false);
    updateUser.mutate(
      {
        id: params.userId,
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
        onSuccess: () => {
          setInfoSuccess(true);
          setEditingInfo(false);
          void queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(params.userId) });
          void queryClient.invalidateQueries({ queryKey: queryKeys.users.list() });
        },
        onError: (err) => setInfoError(err.message),
      },
    );
  }

  const memberRequests = (allRequests ?? []).filter(
    (r) => r.member_user_id === params.userId
  );

  const batches = Object.values(
    memberRequests.reduce<Record<string, BorrowRequestReadWithDetails[]>>(
      (groups, req) => {
        const k = req.batch_id;
        return { ...groups, [k]: [...(groups[k] ?? []), req] };
      },
      {},
    )
  ).sort((a, b) => new Date(b[0].created_at).getTime() - new Date(a[0].created_at).getTime());

  const toyMap = new Map((toys ?? []).map((t: Toy) => [t.id, t]));

  return (
    <Box component="main" sx={{ p: { xs: 2, md: 4 }, maxWidth: 700, mx: "auto" }}>
      <Stack spacing={4}>
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
          <Typography variant="pageTitle" component="h1">Member profile</Typography>
        </Stack>

        {memberPending ? (
          <Typography variant="body1" color="text.secondary">Loading…</Typography>
        ) : memberError ? (
          <Typography variant="body1" color="error">Failed to load member.</Typography>
        ) : member === undefined ? null : (
          <Stack spacing={4}>
            <Paper elevation={0} sx={{ p: 3 }}>
              <Stack spacing={1}>
                <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                  <Typography variant="bodyStrong">{editingInfo ? "Edit member info" : member.name}</Typography>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    {membership !== null ? (
                      membership.account_standing === "temporary_hold" ? (
                        <Chip label="Paused" size="small" color="warning" variant="outlined" />
                      ) : membership.account_standing === "banned" ? (
                        <Chip label="Banned" size="small" color="error" variant="outlined" />
                      ) : (
                        <Chip label="Active" size="small" color="success" variant="outlined" />
                      )
                    ) : null}
                    {isSuperadmin && !editingInfo ? (
                      <Button variant="outlined" size="small" onClick={handleStartEdit}>
                        Edit
                      </Button>
                    ) : null}
                  </Stack>
                </Stack>
                {editingInfo ? (
                  <Stack spacing={2} sx={{ pt: 1 }}>
                    <Typography variant="label" color="text.secondary">{member.email}</Typography>
                    <TextField
                      label="Full name"
                      size="small"
                      value={name}
                      onChange={(e) => { setName(e.target.value); setInfoError(null); }}
                    />
                    <TextField
                      label="Phone"
                      size="small"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setInfoError(null); }}
                    />
                    <TextField
                      label="Address line 1"
                      size="small"
                      value={addressLine1}
                      onChange={(e) => { setAddressLine1(e.target.value); setInfoError(null); }}
                    />
                    <TextField
                      label="Address line 2 (optional)"
                      size="small"
                      value={addressLine2}
                      onChange={(e) => { setAddressLine2(e.target.value); setInfoError(null); }}
                    />
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        label="City"
                        size="small"
                        value={city}
                        onChange={(e) => { setCity(e.target.value); setInfoError(null); }}
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        label="State"
                        size="small"
                        value={state}
                        onChange={(e) => { setState(e.target.value); setInfoError(null); }}
                        sx={{ width: { xs: "100%", sm: 80 } }}
                      />
                      <TextField
                        label="ZIP"
                        size="small"
                        value={zip}
                        onChange={(e) => { setZip(e.target.value); setInfoError(null); }}
                        sx={{ width: { xs: "100%", sm: 100 } }}
                      />
                    </Stack>
                    {infoError !== null ? (
                      <Typography variant="body1" color="error">{infoError}</Typography>
                    ) : null}
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="contained"
                        size="small"
                        disabled={updateUser.isPending || name.trim() === "" || phone.trim() === "" || addressLine1.trim() === "" || city.trim() === "" || state.trim() === "" || zip.trim() === ""}
                        onClick={handleSaveInfo}
                      >
                        {updateUser.isPending ? "Saving…" : "Save changes"}
                      </Button>
                      <Button variant="outlined" size="small" onClick={handleCancelEdit} disabled={updateUser.isPending}>
                        Cancel
                      </Button>
                    </Stack>
                  </Stack>
                ) : (
                  <>
                    <Typography variant="body1" color="text.secondary">{member.email}</Typography>
                    {member.phone !== "" ? (
                      <Typography variant="label" color="text.secondary">{member.phone}</Typography>
                    ) : null}
                    <Typography variant="label" color="text.secondary">
                      {member.address_line1}{member.address_line2 !== null ? `, ${member.address_line2}` : ""}, {member.city}, {member.state} {member.zip}
                    </Typography>
                    {infoSuccess ? (
                      <Typography variant="body1" color="success.main">Profile updated.</Typography>
                    ) : null}
                  </>
                )}
                {isSuperadmin && !editingInfo ? (
                  <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
                    {membership === null ? (
                      <Button
                        variant="outlined"
                        size="small"
                        disabled={createMembership.isPending}
                        onClick={() => {
                          if (token === null) return;
                          createMembership.mutate(
                            { userId: params.userId, token },
                            { onSuccess: () => { void queryClient.invalidateQueries({ queryKey: queryKeys.memberships.byUser(params.userId) }); void queryClient.invalidateQueries({ queryKey: queryKeys.users.list() }); } },
                          );
                        }}
                      >
                        Grant membership
                      </Button>
                    ) : (
                      <>
                        {membership.account_standing !== "temporary_hold" ? (
                          <Button
                            variant="outlined"
                            size="small"
                            color="warning"
                            disabled={updateStanding.isPending}
                            onClick={() => {
                              if (token === null) return;
                              updateStanding.mutate(
                                { id: membership.id, accountStanding: "temporary_hold", token },
                                { onSuccess: () => { void queryClient.invalidateQueries({ queryKey: queryKeys.memberships.byUser(params.userId) }); } },
                              );
                            }}
                          >
                            Pause membership
                          </Button>
                        ) : (
                          <Button
                            variant="outlined"
                            size="small"
                            color="success"
                            disabled={updateStanding.isPending}
                            onClick={() => {
                              if (token === null) return;
                              updateStanding.mutate(
                                { id: membership.id, accountStanding: "active", token },
                                { onSuccess: () => { void queryClient.invalidateQueries({ queryKey: queryKeys.memberships.byUser(params.userId) }); } },
                              );
                            }}
                          >
                            Resume membership
                          </Button>
                        )}
                        {membership.account_standing !== "banned" ? (
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            disabled={updateStanding.isPending}
                            onClick={() => {
                              if (token === null) return;
                              updateStanding.mutate(
                                { id: membership.id, accountStanding: "banned", token },
                                { onSuccess: () => { void queryClient.invalidateQueries({ queryKey: queryKeys.memberships.byUser(params.userId) }); } },
                              );
                            }}
                          >
                            Ban
                          </Button>
                        ) : (
                          <Button
                            variant="outlined"
                            size="small"
                            color="success"
                            disabled={updateStanding.isPending}
                            onClick={() => {
                              if (token === null) return;
                              updateStanding.mutate(
                                { id: membership.id, accountStanding: "active", token },
                                { onSuccess: () => { void queryClient.invalidateQueries({ queryKey: queryKeys.memberships.byUser(params.userId) }); } },
                              );
                            }}
                          >
                            Unban
                          </Button>
                        )}
                      </>
                    )}
                    {!confirmDeleteMember ? (
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        onClick={() => setConfirmDeleteMember(true)}
                      >
                        Delete member
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          disabled={deleteUser.isPending}
                          onClick={() => {
                            if (token === null) return;
                            setDeleteError(null);
                            deleteUser.mutate(
                              { id: params.userId, token },
                              {
                                onSuccess: () => {
                                  void queryClient.invalidateQueries({ queryKey: queryKeys.users.list() });
                                  router.push("/admin?tab=members");
                                },
                                onError: (err) => setDeleteError(err.message),
                              },
                            );
                          }}
                        >
                          Confirm delete
                        </Button>
                        <Button variant="outlined" size="small" onClick={() => setConfirmDeleteMember(false)}>
                          Cancel
                        </Button>
                      </>
                    )}
                  </Stack>
                ) : null}
                {deleteError !== null ? (
                  <Typography variant="body1" color="error">{deleteError}</Typography>
                ) : null}
              </Stack>
            </Paper>

            <Paper elevation={0} sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="sectionTitle" component="h2">Reset password</Typography>
                <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
                  <TextField
                    label="New password"
                    type="password"
                    size="small"
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setPasswordError(null); setPasswordSuccess(false); }}
                    sx={{ flex: 1 }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={resetPassword.isPending || newPassword.length < 8}
                    onClick={() => {
                      if (token === null) return;
                      setPasswordError(null);
                      setPasswordSuccess(false);
                      resetPassword.mutate(
                        { id: params.userId, password: newPassword, token },
                        {
                          onSuccess: () => { setNewPassword(""); setPasswordSuccess(true); },
                          onError: (err) => setPasswordError(err.message),
                        },
                      );
                    }}
                  >
                    {resetPassword.isPending ? "Saving…" : "Save"}
                  </Button>
                </Stack>
                {passwordError !== null ? (
                  <Typography variant="body1" color="error">{passwordError}</Typography>
                ) : null}
                {passwordSuccess ? (
                  <Typography variant="body1" color="success.main">Password updated.</Typography>
                ) : null}
              </Stack>
            </Paper>

            <Stack spacing={2}>
              <Typography variant="sectionTitle" component="h2">Borrowing history</Typography>
              <Divider />
              {requestsPending ? (
                <Typography variant="body1" color="text.secondary">Loading…</Typography>
              ) : batches.length === 0 ? (
                <Typography variant="body1" color="text.secondary">No borrow requests yet.</Typography>
              ) : (
                <Stack spacing={3}>
                  {batches.map((batch) => (
                    <Stack key={batch[0].batch_id} spacing={1}>
                      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
                        <Typography variant="label" color="text.secondary">
                          {new Date(batch[0].created_at).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                          {batch[0].pickup_start !== null ? ` · Pickup ${new Date(batch[0].pickup_start).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : ""}
                        </Typography>
                        <Button
                          component={NextLink}
                          href={`/admin/borrow-requests/${batch[0].batch_id}`}
                          variant="text"
                          size="small"
                        >
                          Manage
                        </Button>
                      </Stack>
                      {batch.map((req: BorrowRequestReadWithDetails) => {
                        const toy = toyMap.get(req.toy_id);
                        const image = toy !== undefined ? getFeaturedImage(toy) : null;
                        return (
                          <Paper key={req.id} elevation={0} sx={{ p: 2 }}>
                            <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                              <Box sx={{ width: 56, height: 56, flexShrink: 0, bgcolor: "grey.100", borderRadius: 1, overflow: "hidden" }}>
                                {image !== null ? (
                                  <Box component="img" src={image.image_url} alt={req.toy_name} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : null}
                              </Box>
                              <Typography variant="body1" sx={{ flex: 1 }}>{req.toy_name}</Typography>
                              {req.status === "pending" ? (
                                <Chip label="Pending" size="small" variant="outlined" />
                              ) : req.status === "approved" ? (
                                <Chip label="Approved" size="small" color="success" variant="outlined" />
                              ) : (
                                <Chip label="Denied" size="small" color="error" variant="outlined" />
                              )}
                            </Stack>
                          </Paper>
                        );
                      })}
                    </Stack>
                  ))}
                </Stack>
              )}
            </Stack>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
