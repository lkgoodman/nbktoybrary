"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../lib/AuthContext";
import { useBorrowRequests, useCancelBorrowRequest, useSettings, useToys, queryKeys } from "../../lib/queries";
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: requests, isPending, isError } = useBorrowRequests(token);
  const { data: toys } = useToys();
  const { data: siteSettings } = useSettings();
  const cancelRequest = useCancelBorrowRequest();
  const [confirmCancel, setConfirmCancel] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  if (!isMember) {
    return (
      <Box component="main" sx={{ p: { xs: 2, md: 4 }, maxWidth: 600, mx: "auto" }}>
        <Typography variant="body1" color="text.secondary">
          Membership is required to view requests.
        </Typography>
      </Box>
    );
  }

  const batch = (requests ?? []).filter((r) => r.batch_id === params.batchId);
  const toysById = new Map((toys ?? []).map((t: Toy) => [t.id, t]));

  return (
    <Box component="main" sx={{ p: { xs: 2, md: 4 }, maxWidth: 600, mx: "auto" }}>
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
            {(() => {
              const cancellable = batch.some((r) => r.status === "pending" || r.status === "approved");
              const pickupStart = batch[0].pickup_start;
              const withinDeadline =
                pickupStart !== null &&
                pickupStart !== undefined &&
                new Date(pickupStart).getTime() - Date.now() < 24 * 60 * 60 * 1000 &&
                new Date(pickupStart).getTime() > Date.now();
              if (!cancellable) return null;
              return (
                <Paper elevation={0} sx={{ p: 3 }}>
                  <Stack spacing={1}>
                    <Typography variant="bodyStrong">Cancel this request</Typography>
                    {withinDeadline ? (
                      <Typography variant="body1" color="text.secondary">
                        Your pickup is within 24 hours. To cancel, email{" "}
                        <Box component="a" href="mailto:nbktoybrary@gmail.com" sx={{ color: "primary.main" }}>
                          nbktoybrary@gmail.com
                        </Box>.
                      </Typography>
                    ) : !confirmCancel ? (
                      <Box>
                        <Button variant="outlined" color="error" size="small" onClick={() => { setConfirmCancel(true); setCancelError(null); }}>
                          Cancel request
                        </Button>
                      </Box>
                    ) : (
                      <Stack spacing={1}>
                        <Typography variant="body1" color="text.secondary">Are you sure you want to cancel all toys in this request?</Typography>
                        <Stack direction="row" spacing={1}>
                          <Button
                            variant="contained"
                            color="error"
                            size="small"
                            disabled={cancelRequest.isPending}
                            onClick={() => {
                              if (token === null) return;
                              const cancelable = batch.filter((r) => r.status === "pending" || r.status === "approved");
                              let chain = Promise.resolve();
                              cancelable.forEach((r) => {
                                chain = chain.then(
                                  () =>
                                    new Promise<void>((resolve, reject) => {
                                      cancelRequest.mutate(
                                        { id: r.id, token },
                                        { onSuccess: () => resolve(), onError: (err) => reject(err) },
                                      );
                                    }),
                                );
                              });
                              chain
                                .then(() => {
                                  void queryClient.invalidateQueries({ queryKey: queryKeys.borrowRequests.list() });
                                  router.push("/requests");
                                })
                                .catch((err: unknown) => {
                                  setCancelError(err instanceof Error ? err.message : "Failed to cancel request.");
                                  setConfirmCancel(false);
                                });
                            }}
                          >
                            Yes, cancel
                          </Button>
                          <Button variant="outlined" size="small" onClick={() => setConfirmCancel(false)}>
                            Keep request
                          </Button>
                        </Stack>
                        {cancelError !== null ? (
                          <Typography variant="body1" color="error">{cancelError}</Typography>
                        ) : null}
                      </Stack>
                    )}
                  </Stack>
                </Paper>
              );
            })()}
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

            {batch.map((req: BorrowRequestRead) => {
              const toy = toysById.get(req.toy_id);
              const image = toy !== undefined ? getFeaturedImage(toy) : null;
              return (
                <Paper key={req.id} elevation={0} sx={{ p: 3 }}>
                  <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
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
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
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
