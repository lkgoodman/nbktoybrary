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
import { useToys, useCreateBorrowRequests, queryKeys } from "../lib/queries";
import type { Toy, ToyImage } from "../lib/types";

function getFeaturedImage(toy: Toy): ToyImage | null {
  return toy.images.find((img: ToyImage) => img.is_featured) ?? toy.images[0] ?? null;
}

export default function CartPage(): JSX.Element {
  const { token, isMember } = useAuth();
  const { cartIds, removeFromCart, clearCart } = useCart();
  const { data: allToys } = useToys();
  const createBorrowRequests = useCreateBorrowRequests();
  const queryClient = useQueryClient();
  const [submitted, setSubmitted] = useState<boolean>(false);

  const cartToys: Toy[] = (allToys ?? []).filter((toy: Toy) => cartIds.includes(toy.id));

  function handleSubmit(): void {
    if (token === null || cartIds.length === 0) return;
    createBorrowRequests.mutate(
      { toyIds: cartIds, token },
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
            Your borrow request has been received. We'll be in touch to arrange pickup.
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
                  disabled={createBorrowRequests.isPending}
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
