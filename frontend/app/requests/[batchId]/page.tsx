"use client";

import NextLink from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useAuth } from "../../lib/AuthContext";
import { useBorrowRequests, useSettings, useToys } from "../../lib/queries";
import type { BorrowRequestRead, Toy, ToyImage } from "../../lib/types";

function getFeaturedImage(toy: Toy): ToyImage | null {
  return toy.images.find((img: ToyImage) => img.is_featured) ?? toy.images[0] ?? null;
}

export default function RequestBatchPage({
  params,
}: {
  params: { batchId: string };
}): JSX.Element {
  const { token, isMember } = useAuth();
  const { data: requests, isPending, isError } = useBorrowRequests(token);
  const { data: toys } = useToys();
  const { data: siteSettings } = useSettings();

  if (!isMember) {
    return (
      <Box component="main" sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
        <Typography variant="body1" color="text.secondary">
          Membership is required to view requests.
        </Typography>
      </Box>
    );
  }

  const batch = (requests ?? []).filter((r) => r.batch_id === params.batchId);
  const toysById = new Map((toys ?? []).map((t: Toy) => [t.id, t]));

  return (
    <Box component="main" sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
      <Stack spacing={4}>
        <Stack spacing={1}>
          <Button
            component={NextLink}
            href="/requests"
            variant="text"
            size="small"
            sx={{ alignSelf: "flex-start", pl: 0 }}
          >
            ← Checkout history
          </Button>
          <Typography variant="pageTitle" component="h1">Request detail</Typography>
        </Stack>

        {isPending ? (
          <Typography variant="body1" color="text.secondary">Loading…</Typography>
        ) : isError ? (
          <Typography variant="body1" color="error">Failed to load requests.</Typography>
        ) : batch.length === 0 ? (
          <Typography variant="body1" color="text.secondary">Request not found.</Typography>
        ) : (
          <Stack spacing={2}>
            {(batch[0].pickup_start !== null || batch[0].return_start !== null || batch[0].return_date !== null) ? (
              <Paper elevation={0} sx={{ p: 3 }}>
                <Stack spacing={1}>
                  {siteSettings !== undefined && siteSettings.address !== "" ? (
                    <Stack spacing={0.25}>
                      <Typography variant="label" color="text.secondary">Location</Typography>
                      <Typography variant="body1">{siteSettings.address}</Typography>
                    </Stack>
                  ) : null}
                  {batch[0].pickup_start !== null && batch[0].pickup_end !== null ? (
                    <Stack spacing={0.25}>
                      <Typography variant="label" color="text.secondary">Pickup</Typography>
                      <Typography variant="bodyStrong">
                        {new Date(batch[0].pickup_start).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                      </Typography>
                      <Typography variant="body1">
                        {new Date(batch[0].pickup_start).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                        {" – "}
                        {new Date(batch[0].pickup_end).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                      </Typography>
                    </Stack>
                  ) : null}
                  {batch[0].return_start !== null && batch[0].return_end !== null ? (
                    <Stack spacing={0.25}>
                      <Typography variant="label" color="text.secondary">Return</Typography>
                      <Typography variant="bodyStrong">
                        {new Date(batch[0].return_start).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                      </Typography>
                      <Typography variant="body1">
                        {new Date(batch[0].return_start).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                        {" – "}
                        {new Date(batch[0].return_end).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                      </Typography>
                    </Stack>
                  ) : batch[0].return_date !== null ? (
                    <Stack spacing={0.25}>
                      <Typography variant="label" color="text.secondary">Return by</Typography>
                      <Typography variant="bodyStrong">
                        {new Date(batch[0].return_date).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                      </Typography>
                    </Stack>
                  ) : null}
                </Stack>
              </Paper>
            ) : null}
            <Typography variant="label" color="text.secondary">
              Submitted {new Date(batch[0].created_at).toLocaleDateString()}
            </Typography>

            {batch.map((req: BorrowRequestRead) => {
              const toy = toysById.get(req.toy_id);
              const image = toy !== undefined ? getFeaturedImage(toy) : null;
              return (
                <Paper key={req.id} elevation={0} sx={{ p: 3 }}>
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
                      <Typography variant="bodyStrong">{toy?.name ?? "Unknown toy"}</Typography>
                      {req.status === "denied" && req.denial_note !== null ? (
                        <Typography variant="label" color="error.main">
                          Admin note: {req.denial_note}
                        </Typography>
                      ) : null}
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {req.status === "pending" ? (
                        <Chip label="Pending" size="small" variant="outlined" />
                      ) : req.status === "approved" ? (
                        <Chip label="Approved" size="small" color="success" variant="outlined" />
                      ) : (
                        <Chip label="Denied" size="small" color="error" variant="outlined" />
                      )}
                      {toy !== undefined ? (
                        <Button component={NextLink} href={`/toys/${toy.id}`} variant="outlined" size="small">
                          View
                        </Button>
                      ) : null}
                    </Stack>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
