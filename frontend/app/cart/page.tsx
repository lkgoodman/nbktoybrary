"use client";

import { useState } from "react";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../lib/AuthContext";
import { useCart } from "../lib/CartContext";
import { useToys, useCreateBorrowRequests, useTimeframes, queryKeys } from "../lib/queries";
import type { TimeframeRead, Toy, ToyImage } from "../lib/types";

function getFeaturedImage(toy: Toy): ToyImage | null {
  return toy.images.find((img: ToyImage) => img.is_featured) ?? toy.images[0] ?? null;
}

function formatTimeframeDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatTimeframeTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CartPage(): JSX.Element {
  const { token, isMember } = useAuth();
  const { cartIds, removeFromCart, clearCart } = useCart();
  const { data: allToys } = useToys();
  const { data: allTimeframes } = useTimeframes(token);
  const createBorrowRequests = useCreateBorrowRequests();
  const queryClient = useQueryClient();
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [selectedTimeframeId, setSelectedTimeframeId] = useState<string | null>(null);

  const cartToys: Toy[] = (allToys ?? []).filter((toy: Toy) => cartIds.includes(toy.id));

  const now = new Date();
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const availableTimeframes: TimeframeRead[] = (allTimeframes ?? []).filter((tf) => {
    const start = new Date(tf.start_time);
    return start > now && start <= oneWeekFromNow;
  });

  function handleSubmit(): void {
    if (token === null || cartIds.length === 0 || selectedTimeframeId === null) return;
    createBorrowRequests.mutate(
      { toyIds: cartIds, timeframeId: selectedTimeframeId, token },
      {
        onSuccess: () => {
          clearCart();
          void queryClient.invalidateQueries({ queryKey: queryKeys.borrowRequests.list() });
          setSubmitted(true);
        },
      },
    );
  }

  if (!isMember) {
    return (
      <Box component="main" sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
        <Typography variant="body1" color="text.secondary">
          Membership is required to check out toys.
        </Typography>
      </Box>
    );
  }

  if (submitted) {
    return (
      <Box component="main" sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
        <Stack spacing={3}>
          <Typography variant="pageTitle" component="h1">Request submitted</Typography>
          <Typography variant="body1" color="text.secondary">
            Your borrow request has been received.
          </Typography>
          <Box>
            <Button component={NextLink} href="/" variant="contained">Browse more toys</Button>
          </Box>
        </Stack>
      </Box>
    );
  }

  return (
    <Box component="main" sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
      <Stack spacing={4}>
        <Typography variant="pageTitle" component="h1">Your cart</Typography>

        {cartIds.length === 0 ? (
          <Stack spacing={2}>
            <Typography variant="body1" color="text.secondary">Your cart is empty.</Typography>
            <Box>
              <Button component={NextLink} href="/" variant="contained">Browse toys</Button>
            </Box>
          </Stack>
        ) : cartToys.length === 0 ? (
          <Stack spacing={2}>
            <Typography variant="body1" color="text.secondary">
              Some toys in your cart are no longer available.
            </Typography>
            <Box>
              <Button variant="outlined" color="error" onClick={clearCart}>Clear cart</Button>
            </Box>
          </Stack>
        ) : (
          <>
            <Stack spacing={2}>
              {cartToys.map((toy: Toy) => {
                const image = getFeaturedImage(toy);
                return (
                <Paper key={toy.id} elevation={0} sx={{ p: 3 }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: "64px 1fr auto", alignItems: "center", gap: 2 }}>
                    {image !== null ? (
                      <Box
                        component="img"
                        src={image.image_url}
                        alt={toy.name}
                        sx={{ width: 64, height: 64, objectFit: "cover", borderRadius: 1 }}
                      />
                    ) : <Box />}
                    <Typography variant="bodyStrong" sx={{ textAlign: "center" }}>{toy.name}</Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => removeFromCart(toy.id)}
                    >
                      Remove
                    </Button>
                  </Box>
                </Paper>
                );
              })}
            </Stack>

            <Divider />

            <Stack spacing={2}>
              <Typography variant="bodyStrong">Choose a pickup time</Typography>
              {availableTimeframes.length === 0 ? (
                <Typography variant="body1" color="text.secondary">
                  No pickup times are available in the next week. Check back soon.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {availableTimeframes.map((tf) => (
                    <Paper
                      key={tf.id}
                      elevation={0}
                      onClick={() => setSelectedTimeframeId(tf.id)}
                      sx={{
                        p: 2,
                        cursor: "pointer",
                        border: 2,
                        borderColor: selectedTimeframeId === tf.id ? "primary.main" : "transparent",
                      }}
                    >
                      <Stack spacing={0.5}>
                        <Typography variant="bodyStrong">{formatTimeframeDate(tf.start_time)}</Typography>
                        <Typography variant="body1" color="text.secondary">
                          {formatTimeframeTime(tf.start_time)} – {formatTimeframeTime(tf.end_time)}
                        </Typography>
                        {tf.notes !== null ? (
                          <Typography variant="label" color="text.secondary">{tf.notes}</Typography>
                        ) : null}
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Stack>

            <Divider />

            <Stack spacing={1}>
              <Typography variant="label" color="text.secondary">
                {cartIds.length} of 5 toys selected
              </Typography>
              {createBorrowRequests.isError ? (
                <Typography variant="body1" color="error">
                  {createBorrowRequests.error.message}
                </Typography>
              ) : null}
              <Box>
                <Button
                  variant="contained"
                  disabled={createBorrowRequests.isPending || selectedTimeframeId === null || availableTimeframes.length === 0}
                  onClick={handleSubmit}
                >
                  {createBorrowRequests.isPending ? "Submitting…" : "Submit borrow request"}
                </Button>
              </Box>
            </Stack>
          </>
        )}
      </Stack>
    </Box>
  );
}
