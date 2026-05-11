"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../../lib/AuthContext";
import { useToy, useAdminBorrowRequests, useCheckouts, useCreateCheckout, useCheckinCheckout, useUploadToyImage, useSetFeaturedImage, useDeleteToyImage, queryKeys } from "../../../lib/queries";
import type { BorrowRequestReadWithDetails, CheckoutRead, Toy, ToyImage } from "../../../lib/types";

function getFeaturedImage(toy: Toy): ToyImage | null {
  return toy.images.find((img: ToyImage) => img.is_featured) ?? toy.images[0] ?? null;
}

function formatAgeRange(toy: Toy): string | null {
  if (toy.age_min === null) return null;
  if (toy.age_min === 0) return "0+";
  if (toy.age_min < 12) return `${toy.age_min}m+`;
  return `${toy.age_min / 12}+`;
}

function formatDatetime(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}, ${d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}`;
}

export default function AdminToyDetailPage({
  params,
}: {
  params: { id: string };
}): JSX.Element {
  const { isAdmin, token, isAuthenticated } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: toy, isPending: toyPending, isError: toyError } = useToy(params.id);
  const { data: allRequests } = useAdminBorrowRequests(token);
  const { data: activeCheckouts, isPending: checkoutsPending } = useCheckouts(token, { toyId: params.id, returned: false });
  const createCheckout = useCreateCheckout();
  const checkinCheckout = useCheckinCheckout();
  const uploadImage = useUploadToyImage();
  const setFeatured = useSetFeaturedImage();
  const deleteImage = useDeleteToyImage();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0 || token === null) return;
    e.target.value = "";
    files.reduce<Promise<void>>(
      (chain, file) =>
        chain.then(
          () =>
            new Promise<void>((resolve) => {
              uploadImage.mutate(
                { toyId: params.id, file, token },
                {
                  onSuccess: () => {
                    void queryClient.invalidateQueries({ queryKey: queryKeys.toys.detail(params.id) });
                    resolve();
                  },
                  onError: () => resolve(),
                },
              );
            }),
        ),
      Promise.resolve(),
    );
  }

  function handleSetFeatured(imageId: string): void {
    if (token === null) return;
    setFeatured.mutate(
      { imageId, token },
      { onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.toys.detail(params.id) }) },
    );
  }

  function handleDeleteImage(imageId: string): void {
    if (token === null) return;
    deleteImage.mutate(
      { imageId, token },
      { onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.toys.detail(params.id) }) },
    );
  }

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      router.replace("/");
    }
  }, [isAuthenticated, isAdmin, router]);

  if (!isAuthenticated || !isAdmin) return <Box />;

  const activeCheckout: CheckoutRead | null = (activeCheckouts ?? [])[0] ?? null;
  const isCheckedOut = activeCheckout !== null;

  // Approved requests for this toy that don't yet have an active checkout
  const readyToCheckOut: BorrowRequestReadWithDetails[] = (allRequests ?? []).filter(
    (r) => r.toy_id === params.id && r.status === "approved",
  );

  function handleCheckout(requestId: string): void {
    if (token === null) return;
    createCheckout.mutate(
      { requestId, token },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.checkouts.list({ toyId: params.id, returned: false }) });
          void queryClient.invalidateQueries({ queryKey: queryKeys.toys.list() });
          void queryClient.invalidateQueries({ queryKey: queryKeys.toys.detail(params.id) });
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
          void queryClient.invalidateQueries({ queryKey: queryKeys.checkouts.list({ toyId: params.id, returned: false }) });
          void queryClient.invalidateQueries({ queryKey: queryKeys.toys.list() });
          void queryClient.invalidateQueries({ queryKey: queryKeys.toys.detail(params.id) });
        },
      },
    );
  }

  return (
    <Box component="main" sx={{ p: { xs: 2, md: 4 }, maxWidth: 800, mx: "auto" }}>
      <Stack spacing={3}>
        <Button
          component={NextLink}
          href="/admin"
          variant="text"
          size="small"
          sx={{ alignSelf: "flex-start", pl: 0 }}
        >
          ← Inventory
        </Button>

        {toyPending ? (
          <Typography variant="body1" color="text.secondary">Loading…</Typography>
        ) : toyError ? (
          <Typography variant="body1" color="error">Failed to load toy.</Typography>
        ) : (
          <Stack spacing={3}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems="flex-start">
              {getFeaturedImage(toy) !== null ? (
                <Box
                  component="img"
                  src={getFeaturedImage(toy)!.image_url}
                  alt={toy.name}
                  sx={{ width: { xs: "100%", sm: 220 }, aspectRatio: "1/1", objectFit: "cover", borderRadius: 1, flexShrink: 0 }}
                />
              ) : (
                <Box sx={{ width: { xs: "100%", sm: 220 }, aspectRatio: "1/1", bgcolor: "grey.100", borderRadius: 1, flexShrink: 0 }} />
              )}

              <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                  <Typography variant="pageTitle" component="h1">{toy.name}</Typography>
                  <Button
                    component={NextLink}
                    href={`/admin/toys/${toy.id}/edit`}
                    variant="outlined"
                    size="small"
                    sx={{ flexShrink: 0 }}
                  >
                    Edit
                  </Button>
                </Stack>

                <Stack spacing={0.5}>
                  {formatAgeRange(toy) !== null ? (
                    <Typography variant="body1">
                      <Typography variant="bodyStrong" component="span">Age: </Typography>
                      {formatAgeRange(toy)}
                    </Typography>
                  ) : null}
                  {toy.piece_count !== null ? (
                    <Typography variant="body1">
                      <Typography variant="bodyStrong" component="span">Pieces: </Typography>
                      {toy.piece_count > 99 ? "100+" : toy.piece_count}
                    </Typography>
                  ) : null}
                  {toy.brand !== null ? (
                    <Typography variant="body1">
                      <Typography variant="bodyStrong" component="span">Brand: </Typography>
                      {toy.brand}
                    </Typography>
                  ) : null}
                  {toy.language !== null ? (
                    <Typography variant="body1">
                      <Typography variant="bodyStrong" component="span">Language: </Typography>
                      {toy.language}
                    </Typography>
                  ) : null}
                </Stack>

                {toy.description.trim().length > 0 ? (
                  <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>{toy.description}</Typography>
                ) : null}
              </Stack>
            </Stack>

            <Divider />

            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="bodyStrong">Status</Typography>
                {isCheckedOut ? (
                  <Chip label="Checked out" size="small" color="warning" variant="outlined" />
                ) : (
                  <Chip label="Available" size="small" color="success" variant="outlined" />
                )}
              </Stack>

              {checkoutsPending ? (
                <Typography variant="body1" color="text.secondary">Loading…</Typography>
              ) : isCheckedOut ? (
                <Paper elevation={0} sx={{ p: 2 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                    <Stack spacing={0.25}>
                      <Typography variant="bodyStrong">{activeCheckout.member_name}</Typography>
                      <Typography variant="label" color="text.secondary">
                        Checked out {formatDatetime(activeCheckout.checked_out_at)}
                      </Typography>
                      <Typography variant="label" color="text.secondary">
                        Due back {formatDatetime(activeCheckout.due_at)}
                      </Typography>
                      {activeCheckout.request_id !== null ? (
                        <Button
                          component={NextLink}
                          href={`/admin/borrow-requests/${(allRequests ?? []).find((r) => r.id === activeCheckout.request_id)?.batch_id ?? activeCheckout.request_id}`}
                          variant="text"
                          size="small"
                          sx={{ alignSelf: "flex-start", pl: 0 }}
                        >
                          View request →
                        </Button>
                      ) : null}
                    </Stack>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      disabled={checkinCheckout.isPending}
                      onClick={() => handleCheckin(activeCheckout.id)}
                    >
                      Check in
                    </Button>
                  </Stack>
                </Paper>
              ) : readyToCheckOut.length > 0 ? (
                <Stack spacing={1}>
                  <Typography variant="label" color="text.secondary">Approved requests ready for pickup</Typography>
                  {readyToCheckOut.map((req) => (
                    <Paper key={req.id} elevation={0} sx={{ p: 2 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                        <Stack spacing={0.25}>
                          <Typography variant="bodyStrong">{req.member_name}</Typography>
                          {req.return_start !== null && req.return_end !== null ? (
                            <Typography variant="label" color="text.secondary">
                              Due back {formatDatetime(req.return_start)}
                            </Typography>
                          ) : req.return_date !== null ? (
                            <Typography variant="label" color="text.secondary">
                              Due back {new Date(req.return_date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                            </Typography>
                          ) : null}
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Button
                            component={NextLink}
                            href={`/admin/borrow-requests/${req.batch_id}`}
                            variant="outlined"
                            size="small"
                          >
                            View request
                          </Button>
                          <Button
                            variant="contained"
                            size="small"
                            disabled={createCheckout.isPending}
                            onClick={() => handleCheckout(req.id)}
                          >
                            Check out
                          </Button>
                        </Stack>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  This toy is not currently checked out.
                </Typography>
              )}

              {createCheckout.isError ? (
                <Typography variant="body1" color="error">{createCheckout.error.message}</Typography>
              ) : null}
              {checkinCheckout.isError ? (
                <Typography variant="body1" color="error">{checkinCheckout.error.message}</Typography>
              ) : null}
            </Stack>

            <Divider />

            <Stack spacing={2}>
              <Typography variant="bodyStrong">Photos</Typography>
              {toy.images.length > 0 ? (
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                  {toy.images.map((img: ToyImage) => (
                    <Box key={img.id}>
                      <Box
                        component="img"
                        src={img.image_url}
                        alt={toy.name}
                        sx={{
                          width: 120,
                          aspectRatio: "4/3",
                          objectFit: "cover",
                          borderRadius: 1,
                          border: img.is_featured ? 2 : 0,
                          borderColor: "secondary.main",
                          display: "block",
                        }}
                      />
                      <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                        {img.is_featured ? (
                          <Typography variant="label" color="secondary">Primary</Typography>
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={setFeatured.isPending}
                            onClick={() => handleSetFeatured(img.id)}
                          >
                            Set primary
                          </Button>
                        )}
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          disabled={deleteImage.isPending}
                          onClick={() => handleDeleteImage(img.id)}
                        >
                          Remove
                        </Button>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body1" color="text.secondary">No photos yet.</Typography>
              )}
              <Box>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <Button
                  variant="outlined"
                  disabled={uploadImage.isPending}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadImage.isPending ? "Uploading…" : "Add photos"}
                </Button>
              </Box>
              {uploadImage.isError ? (
                <Typography variant="body1" color="error">{uploadImage.error.message}</Typography>
              ) : null}
            </Stack>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
