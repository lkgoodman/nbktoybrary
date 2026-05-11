"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useQueryClient } from "@tanstack/react-query";

import NextLink from "next/link";
import { useAuth } from "../../../lib/AuthContext";
import { useAdminBorrowRequests, useUpdateBorrowRequest, useToys, useCheckouts, useCreateCheckout, useCheckinCheckout, queryKeys } from "../../../lib/queries";
import type { BorrowRequestReadWithDetails, CheckoutRead, Toy, ToyImage } from "../../../lib/types";

export default function BorrowRequestDetailPage({
  params,
}: {
  params: { batchId: string };
}): JSX.Element {
  const { isAdmin, token, isAuthenticated, authReady } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const backHref = searchParams.get("from") === "schedule" ? "/admin?tab=schedule" : "/admin?tab=borrow";
  const queryClient = useQueryClient();

  const { data: allRequests, isPending, isError } = useAdminBorrowRequests(token);
  const { data: toys } = useToys(token, { enabled: authReady });
  const updateBorrowRequest = useUpdateBorrowRequest();
  const { data: activeCheckouts } = useCheckouts(token, { returned: false });
  const createCheckout = useCreateCheckout();
  const checkinCheckout = useCheckinCheckout();
  const [denyingId, setDenyingId] = useState<string | null>(null);
  const [denyNote, setDenyNote] = useState<string>("");

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      router.replace("/");
    }
  }, [isAuthenticated, isAdmin, router]);

  if (!isAuthenticated || !isAdmin) return <Box />;

  const batch: BorrowRequestReadWithDetails[] =
    (allRequests ?? []).filter((r) => r.batch_id === params.batchId);

  const toyMap = new Map<string, Toy>((toys ?? []).map((t) => [t.id, t]));

  function getFeaturedImage(toyId: string): string | null {
    const toy = toyMap.get(toyId);
    if (toy == null) return null;
    const featured = toy.images.find((img: ToyImage) => img.is_featured);
    return featured?.image_url ?? toy.images[0]?.image_url ?? null;
  }

  function handleDeny(id: string, note: string): void {
    if (token === null) return;
    updateBorrowRequest.mutate(
      { id, status: "denied", token, denialNote: note.trim() || undefined },
      {
        onSuccess: () => {
          setDenyingId(null);
          setDenyNote("");
          void queryClient.invalidateQueries({ queryKey: queryKeys.borrowRequests.adminList() });
          void queryClient.invalidateQueries({ queryKey: queryKeys.toys.list() });
        },
      },
    );
  }

  function handleApprove(id: string): void {
    if (token === null) return;
    updateBorrowRequest.mutate(
      { id, status: "approved", token },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.borrowRequests.adminList() });
          void queryClient.invalidateQueries({ queryKey: queryKeys.toys.list() });
        },
      },
    );
  }

  function handleCheckout(requestId: string): void {
    if (token === null) return;
    createCheckout.mutate(
      { requestId, token },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.checkouts.list({ returned: false }) });
          void queryClient.invalidateQueries({ queryKey: queryKeys.toys.list() });
        },
      },
    );
  }

  function handleCheckin(checkoutId: string): void {
    if (token === null) return;
    checkinCheckout.mutate(
      { id: checkoutId, token },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.checkouts.list({ returned: false }) });
          void queryClient.invalidateQueries({ queryKey: queryKeys.toys.list() });
        },
      },
    );
  }

  function handleDenyAll(): void {
    if (token === null) return;
    batch.filter((r) => r.status === "pending").forEach((req) => handleDeny(req.id, ""));
  }

  function handleApproveAll(): void {
    if (token === null) return;
    batch.filter((r) => r.status === "pending").forEach((req) => handleApprove(req.id));
  }

  const pending = batch.filter((r) => r.status === "pending");
  const approved = batch.filter((r) => r.status === "approved");
  const denied = batch.filter((r) => r.status === "denied");

  const pickupStart = batch[0]?.pickup_start ?? null;
  const pickupEnd = batch[0]?.pickup_end ?? null;

  function formatPickup(start: string, end: string): string {
    const s = new Date(start);
    const e = new Date(end);
    const date = s.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
    const startTime = s.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    const endTime = e.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    return `${date}, ${startTime} – ${endTime}`;
  }

  return (
    <Box component="main" sx={{ p: { xs: 2, md: 4 }, maxWidth: 800, mx: "auto" }}>
      <Stack spacing={4}>
        <Stack spacing={1}>
          <Button
            component={NextLink}
            href={backHref}
            variant="text"
            size="small"
            sx={{ alignSelf: "flex-start", pl: 0 }}
          >
            {searchParams.get("from") === "schedule" ? "← Schedule" : "← Borrow requests"}
          </Button>
          <Typography variant="pageTitle" component="h1">
            Borrow request
          </Typography>
        </Stack>

        {isPending ? (
          <Typography variant="body1" color="text.secondary">Loading…</Typography>
        ) : isError ? (
          <Typography variant="body1" color="error">Failed to load request.</Typography>
        ) : batch.length === 0 ? (
          <Typography variant="body1" color="text.secondary">Request not found.</Typography>
        ) : (
          <Stack spacing={3}>
            <Stack spacing={0.5}>
              <Typography variant="bodyStrong">{batch[0].member_name}</Typography>
              <Typography variant="label" color="text.secondary">
                Submitted {new Date(batch[0].created_at).toLocaleDateString()}
              </Typography>
              {pickupStart !== null && pickupEnd !== null ? (
                <Typography variant="label" color="text.secondary">
                  Pickup: {formatPickup(pickupStart, pickupEnd)}
                </Typography>
              ) : null}
              {batch[0].return_start !== null && batch[0].return_end !== null ? (
                <Typography variant="label" color="text.secondary">
                  Return: {new Date(batch[0].return_start).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}{" "}
                  {new Date(batch[0].return_start).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                  {" – "}
                  {new Date(batch[0].return_end).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                </Typography>
              ) : batch[0].return_date !== null ? (
                <Typography variant="label" color="text.secondary">
                  Return by: {new Date(batch[0].return_date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                </Typography>
              ) : null}
            </Stack>

            <Divider />

            {pending.length > 0 ? (
              <Stack spacing={1}>
                <Typography variant="label" color="text.secondary">Pending</Typography>
                {pending.map((req) => {
                  const imageUrl = getFeaturedImage(req.toy_id);
                  return (
                    <Paper key={req.id} elevation={0} sx={{ p: 2 }}>
                      <Stack spacing={1}>
                        <Stack direction="row" alignItems="center" spacing={2} justifyContent="space-between">
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Box sx={{ width: 64, height: 64, flexShrink: 0, bgcolor: "grey.100", borderRadius: 1, overflow: "hidden" }}>
                              {imageUrl !== null ? (
                                <Box component="img" src={imageUrl} alt={req.toy_name} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              ) : null}
                            </Box>
                            <Typography variant="body1">{req.toy_name}</Typography>
                          </Stack>
                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              disabled={updateBorrowRequest.isPending}
                              onClick={() => handleApprove(req.id)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              disabled={updateBorrowRequest.isPending}
                              onClick={() => {
                                setDenyingId(req.id);
                                setDenyNote("");
                              }}
                            >
                              Deny
                            </Button>
                          </Stack>
                        </Stack>
                        {denyingId === req.id ? (
                          <Stack spacing={1}>
                            <TextField
                              size="small"
                              fullWidth
                              multiline
                              rows={2}
                              label="Note to member (optional)"
                              value={denyNote}
                              onChange={(e) => setDenyNote(e.target.value)}
                              autoFocus
                            />
                            <Stack direction="row" spacing={1}>
                              <Button
                                size="small"
                                variant="contained"
                                color="error"
                                disabled={updateBorrowRequest.isPending}
                                onClick={() => handleDeny(req.id, denyNote)}
                              >
                                Confirm deny
                              </Button>
                              <Button
                                size="small"
                                variant="text"
                                onClick={() => { setDenyingId(null); setDenyNote(""); }}
                              >
                                Cancel
                              </Button>
                            </Stack>
                          </Stack>
                        ) : null}
                      </Stack>
                    </Paper>
                  );
                })}
                {pending.length > 1 ? (
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      color="success"
                      size="small"
                      disabled={updateBorrowRequest.isPending}
                      onClick={handleApproveAll}
                    >
                      Approve all
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      disabled={updateBorrowRequest.isPending}
                      onClick={handleDenyAll}
                    >
                      Deny all
                    </Button>
                  </Stack>
                ) : null}
              </Stack>
            ) : null}

            {approved.length > 0 ? (
              <Stack spacing={1}>
                <Typography variant="label" color="text.secondary">Approved</Typography>
                {approved.map((req) => {
                  const imageUrl = getFeaturedImage(req.toy_id);
                  const checkout: CheckoutRead | undefined = (activeCheckouts ?? []).find((c) => c.request_id === req.id);
                  const isCheckedOut = checkout !== undefined;
                  return (
                    <Paper key={req.id} elevation={0} sx={{ p: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={2} justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Box sx={{ width: 64, height: 64, flexShrink: 0, bgcolor: "grey.100", borderRadius: 1, overflow: "hidden" }}>
                            {imageUrl !== null ? (
                              <Box component="img" src={imageUrl} alt={req.toy_name} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : null}
                          </Box>
                          <Stack spacing={0.25}>
                            <Typography variant="body1">{req.toy_name}</Typography>
                            {isCheckedOut ? (
                              <Typography variant="label" color="text.secondary">
                                Checked out {new Date(checkout.checked_out_at).toLocaleDateString()}
                              </Typography>
                            ) : null}
                          </Stack>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {isCheckedOut ? (
                            <>
                              <Chip label="Checked out" size="small" color="warning" variant="outlined" />
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                disabled={checkinCheckout.isPending}
                                onClick={() => handleCheckin(checkout.id)}
                              >
                                Check in
                              </Button>
                            </>
                          ) : (
                            <>
                              <Chip label="Approved" size="small" color="success" variant="outlined" />
                              <Button
                                size="small"
                                variant="outlined"
                                disabled={createCheckout.isPending}
                                onClick={() => handleCheckout(req.id)}
                              >
                                Check out
                              </Button>
                            </>
                          )}
                        </Stack>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            ) : null}

            {denied.length > 0 ? (
              <Stack spacing={1}>
                <Typography variant="label" color="text.secondary">Denied</Typography>
                {denied.map((req) => {
                  const imageUrl = getFeaturedImage(req.toy_id);
                  return (
                    <Paper key={req.id} elevation={0} sx={{ p: 2, opacity: 0.6 }}>
                      <Stack direction="row" alignItems="center" spacing={2} justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Box sx={{ width: 64, height: 64, flexShrink: 0, bgcolor: "grey.100", borderRadius: 1, overflow: "hidden" }}>
                            {imageUrl !== null ? (
                              <Box component="img" src={imageUrl} alt={req.toy_name} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : null}
                          </Box>
                          <Typography variant="body1">{req.toy_name}</Typography>
                        </Stack>
                        <Chip label="Denied" size="small" color="error" variant="outlined" />
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            ) : null}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
