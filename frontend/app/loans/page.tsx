"use client";

import NextLink from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useAuth } from "../lib/AuthContext";
import { useCheckouts, useToys } from "../lib/queries";
import type { CheckoutRead, Toy, ToyImage } from "../lib/types";

function getFeaturedImage(toy: Toy): ToyImage | null {
  return toy.images.find((img: ToyImage) => img.is_featured) ?? toy.images[0] ?? null;
}

export default function LoansPage(): JSX.Element {
  const { token, isMember } = useAuth();
  const { data: checkouts, isPending, isError } = useCheckouts(token, { returned: false });
  const { data: toys } = useToys();

  if (!isMember) {
    return (
      <Box component="main" sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
        <Typography variant="body1" color="text.secondary">
          Membership is required to view loans.
        </Typography>
      </Box>
    );
  }

  const toysById = new Map((toys ?? []).map((t: Toy) => [t.id, t]));

  return (
    <Box component="main" sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
      <Stack spacing={4}>
        <Typography variant="pageTitle" component="h1">Current loans</Typography>

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
    </Box>
  );
}
