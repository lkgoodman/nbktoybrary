"use client";

import NextLink from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useAuth } from "../lib/AuthContext";
import { useBorrowRequests, useCheckouts, useToys } from "../lib/queries";
import type { BorrowRequestRead, CheckoutRead, Toy, ToyImage } from "../lib/types";

function getFeaturedImage(toy: Toy): ToyImage | null {
  return toy.images.find((img: ToyImage) => img.is_featured) ?? toy.images[0] ?? null;
}

export default function LoansPage(): JSX.Element {
  const { token, isMember } = useAuth();
  const { data: checkouts, isPending, isError } = useCheckouts(token, { returned: false });
  const { data: requests } = useBorrowRequests(token);
  const { data: toys } = useToys();

  const now = new Date();

  // Group upcoming approved requests by batch, with a future pickup date
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
            {upcomingBatches.map((batch) => {
              const toyNames = batch.map((r) => toysById.get(r.toy_id)?.name ?? "Unknown toy");
              return (
                <Paper key={batch[0].batch_id} elevation={0} sx={{ p: 3 }}>
                  <Stack spacing={1}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                      <Stack spacing={0.5}>
                        <Typography variant="bodyStrong">
                          {toyNames.join(", ")}
                        </Typography>
                        {batch[0].pickup_start !== null && batch[0].pickup_end !== null ? (
                          <Typography variant="label" color="text.secondary">
                            Pickup: {new Date(batch[0].pickup_start).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}{" "}
                            {new Date(batch[0].pickup_start).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                            {" – "}
                            {new Date(batch[0].pickup_end).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                          </Typography>
                        ) : null}
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip label="Upcoming" size="small" color="info" variant="outlined" />
                        <Button component={NextLink} href={`/requests/${batch[0].batch_id}`} variant="outlined" size="small">
                          View
                        </Button>
                      </Stack>
                    </Stack>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        ) : null}

        {upcomingBatches.length > 0 ? <Divider /> : null}

        <Stack spacing={2}>
          <Typography variant="sectionTitle" component="h2">Current</Typography>
          {isPending ? (
            <Typography variant="body1" color="text.secondary">Loading…</Typography>
          ) : isError ? (
            <Typography variant="body1" color="error">Failed to load loans.</Typography>
          ) : checkouts === undefined || checkouts.length === 0 ? (
            <Typography variant="body1" color="text.secondary">You have no toys currently checked out.</Typography>
          ) : (
            <Stack spacing={2}>
              {checkouts.map((checkout: CheckoutRead) => {
                const toy = toysById.get(checkout.toy_id);
                const image = toy !== undefined ? getFeaturedImage(toy) : null;
                return (
                  <Paper key={checkout.id} elevation={0} sx={{ p: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box sx={{ width: 64, height: 64, flexShrink: 0, bgcolor: "grey.100", borderRadius: 1, overflow: "hidden" }}>
                        {image !== null ? (
                          <Box
                            component="img"
                            src={image.image_url}
                            alt={toy?.name}
                            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : null}
                      </Box>
                      <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="bodyStrong">{checkout.toy_name}</Typography>
                        <Typography variant="label" color="text.secondary">
                          Due: {new Date(checkout.due_at).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                        </Typography>
                      </Stack>
                      {toy !== undefined ? (
                        <Button component={NextLink} href={`/toys/${toy.id}`} variant="outlined" size="small">
                          View
                        </Button>
                      ) : null}
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
