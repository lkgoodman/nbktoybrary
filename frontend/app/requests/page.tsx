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
import { useBorrowRequests } from "../lib/queries";
import type { BorrowRequestRead } from "../lib/types";

export default function RequestsPage(): JSX.Element {
  const { token, isMember } = useAuth();
  const { data: requests, isPending, isError } = useBorrowRequests(token);

  if (!isMember) {
    return (
      <Box component="main" sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
        <Typography variant="body1" color="text.secondary">
          Membership is required to view requests.
        </Typography>
      </Box>
    );
  }

  const batches = Object.values(
    (requests ?? []).reduce<Record<string, BorrowRequestRead[]>>(
      (groups, req) => {
        const k = req.batch_id;
        return { ...groups, [k]: [...(groups[k] ?? []), req] };
      },
      {},
    )
  ).sort((a, b) => new Date(b[0].created_at).getTime() - new Date(a[0].created_at).getTime());

  const pendingBatches = batches.filter((b) => b.some((r) => r.status === "pending"));
  const resolvedBatches = batches.filter((b) => b.every((r) => r.status !== "pending"));

  function batchStatusChip(batch: BorrowRequestRead[]): JSX.Element {
    const hasPending = batch.some((r) => r.status === "pending");
    const allApproved = batch.every((r) => r.status === "approved");
    const allDenied = batch.every((r) => r.status === "denied");
    if (hasPending) return <Chip label="Pending review" size="small" variant="outlined" />;
    if (allApproved) return <Chip label="Approved" size="small" color="success" variant="outlined" />;
    if (allDenied) return <Chip label="Denied" size="small" color="error" variant="outlined" />;
    return <Chip label="Partially approved" size="small" color="warning" variant="outlined" />;
  }

  function BatchCard({ batch }: { batch: BorrowRequestRead[] }): JSX.Element {
    return (
      <Paper elevation={0} sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="bodyStrong">
              {batch.length} {batch.length === 1 ? "toy" : "toys"} requested
            </Typography>
            <Typography variant="label" color="text.secondary">
              Submitted {new Date(batch[0].created_at).toLocaleDateString()}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            {batchStatusChip(batch)}
            <Button
              component={NextLink}
              href={`/requests/${batch[0].batch_id}`}
              variant="outlined"
              size="small"
            >
              View
            </Button>
          </Stack>
        </Stack>
      </Paper>
    );
  }

  return (
    <Box component="main" sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
      <Stack spacing={4}>
        <Typography variant="pageTitle" component="h1">Checkout history</Typography>

        {isPending ? (
          <Typography variant="body1" color="text.secondary">Loading…</Typography>
        ) : isError ? (
          <Typography variant="body1" color="error">Failed to load requests.</Typography>
        ) : batches.length === 0 ? (
          <Stack spacing={2}>
            <Typography variant="body1" color="text.secondary">You have no borrow requests.</Typography>
            <Box>
              <Button component={NextLink} href="/" variant="contained">Browse toys</Button>
            </Box>
          </Stack>
        ) : (
          <Stack spacing={3}>
            {pendingBatches.length > 0 ? (
              <Stack spacing={1}>
                {pendingBatches.map((batch) => <BatchCard key={batch[0].batch_id} batch={batch} />)}
              </Stack>
            ) : (
              <Typography variant="body1" color="text.secondary">No pending requests.</Typography>
            )}
            {resolvedBatches.length > 0 ? (
              <>
                <Divider />
                <Typography variant="label" color="text.secondary">Resolved</Typography>
                <Stack spacing={1}>
                  {resolvedBatches.map((batch) => <BatchCard key={batch[0].batch_id} batch={batch} />)}
                </Stack>
              </>
            ) : null}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
