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
import { useBorrowRequests, useToys } from "../lib/queries";
import type { BorrowRequestRead, Toy, ToyImage } from "../lib/types";

function getFeaturedImage(toy: Toy): ToyImage | null {
  return toy.images.find((img: ToyImage) => img.is_featured) ?? toy.images[0] ?? null;
}

export default function RequestsPage(): JSX.Element {
  const { token, isMember } = useAuth();
  const { data: requests, isPending: requestsPending, isError: requestsError } = useBorrowRequests(token);
  const { data: toys } = useToys();

  if (!isMember) {
    return (
      <Box component="main" sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
        <Typography variant="body1" color="text.secondary">
          Membership is required to view requests.
        </Typography>
      </Box>
    );
  }

  const toysById = new Map((toys ?? []).map((t: Toy) => [t.id, t]));

  const pending = (requests ?? []).filter((r: BorrowRequestRead) => r.status === "pending");
  const denied = (requests ?? []).filter((r: BorrowRequestRead) => r.status === "denied");

  function RequestCard({ req }: { req: BorrowRequestRead }): JSX.Element {
    const toy = toysById.get(req.toy_id);
    const image = toy !== undefined ? getFeaturedImage(toy) : null;
    return (
      <Paper key={req.id} elevation={0} sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          {image !== null ? (
            <Box
              component="img"
              src={image.image_url}
              alt={toy?.name}
              sx={{ width: 64, height: 64, objectFit: "cover", borderRadius: 1, flexShrink: 0 }}
            />
          ) : (
            <Box sx={{ width: 64, height: 64, borderRadius: 1, bgcolor: "grey.100", flexShrink: 0 }} />
          )}
          <Stack spacing={0.5} sx={{ flex: 1 }}>
            <Typography variant="bodyStrong">{toy?.name ?? "Unknown toy"}</Typography>
            <Typography variant="label" color="text.secondary">
              Requested {new Date(req.created_at).toLocaleDateString()}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            {req.status === "denied" ? (
              <Chip label="Denied" size="small" color="error" variant="outlined" />
            ) : null}
            {toy !== undefined ? (
              <Button component={NextLink} href={`/toys/${toy.id}`} variant="outlined" size="small">
                View
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </Paper>
    );
  }

  return (
    <Box component="main" sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
      <Stack spacing={4}>
        <Typography variant="pageTitle" component="h1">My requests</Typography>

        {requestsPending ? (
          <Typography variant="body1" color="text.secondary">Loading…</Typography>
        ) : requestsError ? (
          <Typography variant="body1" color="error">Failed to load requests.</Typography>
        ) : (requests ?? []).length === 0 ? (
          <Stack spacing={2}>
            <Typography variant="body1" color="text.secondary">You have no borrow requests.</Typography>
            <Box>
              <Button component={NextLink} href="/" variant="contained">Browse toys</Button>
            </Box>
          </Stack>
        ) : (
          <Stack spacing={3}>
            {pending.length > 0 ? (
              <Stack spacing={1}>
                {pending.map((req: BorrowRequestRead) => <RequestCard key={req.id} req={req} />)}
              </Stack>
            ) : (
              <Typography variant="body1" color="text.secondary">No pending requests.</Typography>
            )}
            {denied.length > 0 ? (
              <>
                <Divider />
                <Typography variant="label" color="text.secondary">Previously denied</Typography>
                <Stack spacing={1}>
                  {denied.map((req: BorrowRequestRead) => <RequestCard key={req.id} req={req} />)}
                </Stack>
              </>
            ) : null}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
