"use client";

import { useState } from "react";
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

import { useAuth } from "../lib/AuthContext";
import { useBorrowRequests, useCheckouts, useUpdateCheckoutDueDate, useToys, queryKeys } from "../lib/queries";
import type { BorrowRequestRead, CheckoutRead, Toy, ToyImage } from "../lib/types";

function getFeaturedImage(toy: Toy): ToyImage | null {
  return toy.images.find((img: ToyImage) => img.is_featured) ?? toy.images[0] ?? null;
}

function toDateString(iso: string): string {
  return new Date(iso).toISOString().split("T")[0];
}

interface ToyRowProps {
  checkout: CheckoutRead;
  toy: Toy | undefined;
  token: string | null;
}

function ToyRow({ checkout, toy, token }: ToyRowProps): JSX.Element {
  const image = toy !== undefined ? getFeaturedImage(toy) : null;
  const queryClient = useQueryClient();
  const updateDueDate = useUpdateCheckoutDueDate();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const currentDueDateStr = toDateString(checkout.due_at);
  const [selectedDate, setSelectedDate] = useState<string>(currentDueDateStr);

  const todayStr = toDateString(new Date().toISOString());
  const maxDueDateStr = toDateString(
    new Date(new Date(checkout.checked_out_at).getTime() + 28 * 24 * 60 * 60 * 1000).toISOString()
  );

  function startEditing(): void {
    setSelectedDate(currentDueDateStr);
    setIsEditing(true);
  }

  function handleSave(): void {
    if (token === null) return;
    updateDueDate.mutate(
      { id: checkout.id, dueAt: `${selectedDate}T00:00:00.000Z`, token },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.checkouts.list({ returned: false }) });
          setIsEditing(false);
        },
      },
    );
  }

  return (
    <Paper elevation={0} sx={{ p: 3 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
        <Box sx={{ width: 64, height: 64, flexShrink: 0, bgcolor: "grey.100", borderRadius: 1, overflow: "hidden" }}>
          {image !== null ? (
            <Box component="img" src={image.image_url} alt={toy?.name} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : null}
        </Box>
        <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="bodyStrong">{checkout.toy_name}</Typography>
          {checkout.returned_at !== null ? (
            <Typography variant="label" color="text.secondary">
              Returned {new Date(checkout.returned_at).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
            </Typography>
          ) : isEditing ? (
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <TextField
                  type="date"
                  size="small"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  slotProps={{ htmlInput: { min: todayStr, max: maxDueDateStr } }}
                  sx={{ width: 170 }}
                />
                <Button size="small" variant="contained" onClick={handleSave} disabled={updateDueDate.isPending}>
                  Save
                </Button>
                <Button size="small" variant="outlined" onClick={() => setIsEditing(false)} disabled={updateDueDate.isPending}>
                  Cancel
                </Button>
              </Stack>
              {updateDueDate.isError ? (
                <Typography variant="label" color="error">{updateDueDate.error.message}</Typography>
              ) : null}
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Typography variant="label" color="text.secondary">
                Due: {new Date(checkout.due_at).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </Typography>
              <Button size="small" variant="text" sx={{ p: 0, minWidth: 0, fontSize: "inherit" }} onClick={startEditing}>
                Change
              </Button>
            </Stack>
          )}
        </Stack>
        {toy !== undefined ? (
          <Button component={NextLink} href={`/toys/${toy.id}`} variant="outlined" size="small">
            View
          </Button>
        ) : null}
      </Stack>
    </Paper>
  );
}

export default function LoansPage(): JSX.Element {
  const { token, isMember } = useAuth();
  const { data: activeCheckouts, isPending, isError } = useCheckouts(token, { returned: false });
  const { data: pastCheckouts } = useCheckouts(token, { returned: true });
  const { data: requests } = useBorrowRequests(token);
  const { data: toys } = useToys();

  const now = new Date();

  const upcomingBatches: BorrowRequestRead[][] = Object.values(
    (requests ?? []).reduce<Record<string, BorrowRequestRead[]>>(
      (groups, req) => {
        const k = req.batch_id;
        return { ...groups, [k]: [...(groups[k] ?? []), req] };
      },
      {},
    )
  ).filter(
    (b) =>
      b.every((r) => r.status === "approved") &&
      b[0].pickup_start !== null &&
      b[0].pickup_start !== undefined &&
      new Date(b[0].pickup_start) > now,
  ).sort((a, b) => new Date(a[0].pickup_start!).getTime() - new Date(b[0].pickup_start!).getTime());

  if (!isMember) {
    return (
      <Box component="main" sx={{ p: { xs: 2, md: 4 }, maxWidth: 600, mx: "auto" }}>
        <Typography variant="body1" color="text.secondary">
          Membership is required to view loans.
        </Typography>
      </Box>
    );
  }

  const toysById = new Map((toys ?? []).map((t: Toy) => [t.id, t]));

  return (
    <Box component="main" sx={{ p: { xs: 2, md: 4 }, maxWidth: 600, mx: "auto" }}>
      <Stack spacing={4}>
        <Typography variant="pageTitle" component="h1">Loans</Typography>

        {upcomingBatches.length > 0 ? (
          <Stack spacing={2}>
            <Typography variant="sectionTitle" component="h2">Upcoming</Typography>
            {upcomingBatches.map((batch) => (
              <Paper key={batch[0].batch_id} elevation={0} sx={{ p: 3 }}>
                <Stack spacing={2}>
                  {batch[0].pickup_start !== null && batch[0].pickup_end !== null ? (
                    <Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                      <Typography variant="label" color="text.secondary">
                        Pickup: {new Date(batch[0].pickup_start).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}{" "}
                        {new Date(batch[0].pickup_start).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                        {" – "}
                        {new Date(batch[0].pickup_end).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                        <Chip label="Upcoming" size="small" color="info" variant="outlined" />
                        <Button component={NextLink} href={`/requests/${batch[0].batch_id}`} variant="outlined" size="small">
                          View
                        </Button>
                      </Stack>
                    </Stack>
                  ) : null}
                  {batch.map((req: BorrowRequestRead) => {
                    const toy = toysById.get(req.toy_id);
                    const image = toy !== undefined ? getFeaturedImage(toy) : null;
                    return (
                      <Stack key={req.id} direction="row" spacing={2} sx={{ alignItems: "center" }}>
                        <Box sx={{ width: 64, height: 64, flexShrink: 0, bgcolor: "grey.100", borderRadius: 1, overflow: "hidden" }}>
                          {image !== null ? (
                            <Box component="img" src={image.image_url} alt={toy?.name} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : null}
                        </Box>
                        <Typography variant="bodyStrong" sx={{ flex: 1, minWidth: 0 }}>{toy?.name ?? "Unknown toy"}</Typography>
                      </Stack>
                    );
                  })}
                </Stack>
              </Paper>
            ))}
          </Stack>
        ) : null}

        {upcomingBatches.length > 0 ? <Divider /> : null}

        <Stack spacing={2}>
          <Typography variant="sectionTitle" component="h2">Current</Typography>
          {isPending ? (
            <Typography variant="body1" color="text.secondary">Loading…</Typography>
          ) : isError ? (
            <Typography variant="body1" color="error">Failed to load loans.</Typography>
          ) : (activeCheckouts ?? []).length === 0 ? (
            <Typography variant="body1" color="text.secondary">You have no toys currently checked out.</Typography>
          ) : (
            <Stack spacing={2}>
              {(activeCheckouts ?? []).map((c: CheckoutRead) => (
                <ToyRow key={c.id} checkout={c} toy={toysById.get(c.toy_id)} token={token} />
              ))}
            </Stack>
          )}
        </Stack>

        {(pastCheckouts ?? []).length > 0 ? (
          <>
            <Divider />
            <Stack spacing={2}>
              <Typography variant="sectionTitle" component="h2">History</Typography>
              <Stack spacing={2}>
                {(pastCheckouts ?? []).map((c: CheckoutRead) => (
                  <ToyRow key={c.id} checkout={c} toy={toysById.get(c.toy_id)} token={token} />
                ))}
              </Stack>
            </Stack>
          </>
        ) : null}
      </Stack>
    </Box>
  );
}
