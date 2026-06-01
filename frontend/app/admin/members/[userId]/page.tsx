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
import { useUser, useAdminBorrowRequests, useToys, useMembershipsByUser, useUpdateMembershipStanding, useCreateMembership, useResetUserPassword, useDeleteUser, queryKeys } from "../../../lib/queries";
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
  const deleteUser = useDeleteUser();
  const membership: MembershipRead | null = memberships?.[0] ?? null;
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmDeleteMember, setConfirmDeleteMember] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) router.replace("/");
  }, [isAuthenticated, isAdmin, router]);

  if (!isAuthenticated || !isAdmin) return <Box />;

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
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="bodyStrong">{member.name}</Typography>
                  {membership !== null ? (
                    membership.account_standing === "temporary_hold" ? (
                      <Chip label="Paused" size="small" color="warning" variant="outlined" />
                    ) : membership.account_standing === "banned" ? (
                      <Chip label="Banned" size="small" color="error" variant="outlined" />
                    ) : (
                      <Chip label="Active" size="small" color="success" variant="outlined" />
                    )
                  ) : null}
                </Stack>
                <Typography variant="body1" color="text.secondary">{member.email}</Typography>
                {member.phone !== "" ? (
                  <Typography variant="label" color="text.secondary">{member.phone}</Typography>
                ) : null}
                <Typography variant="label" color="text.secondary">
                  {member.address_line1}{member.address_line2 !== null ? `, ${member.address_line2}` : ""}, {member.city}, {member.state} {member.zip}
                </Typography>
                {isSuperadmin ? (
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
                <Stack direction="row" spacing={2} alignItems="flex-start">
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
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
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
                            <Stack direction="row" alignItems="center" spacing={2}>
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
