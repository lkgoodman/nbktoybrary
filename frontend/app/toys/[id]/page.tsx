"use client";

import NextLink from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useToy } from "../../lib/queries";
import { useAuth } from "../../lib/AuthContext";
import { useCart } from "../../lib/CartContext";
import type { Toy, ToyImage } from "../../lib/types";

function getFeaturedImage(toy: Toy): ToyImage | null {
  return toy.images.find((img: ToyImage) => img.is_featured) ?? toy.images[0] ?? null;
}

function getSecondaryImages(toy: Toy): ToyImage[] {
  const featured: ToyImage | null = getFeaturedImage(toy);
  if (featured === null) return toy.images;
  return toy.images.filter((img: ToyImage) => img.id !== featured.id);
}

function formatAgeRange(toy: Toy): string | null {
  if (toy.age_min === null) return null;
  return `${toy.age_min}+`;
}

type Props = { params: { id: string } };

export default function ToyPage({ params }: Props): JSX.Element {
  const { data: toy, isPending, isError, error } = useToy(params.id);
  const { isAuthenticated, isMember, isAdmin } = useAuth();
  const { addToCart, removeFromCart, isInCart, cartIds } = useCart();
  const inCart = isInCart(params.id);
  const cartFull = cartIds.length >= 5;

  return (
    <Box component="main" sx={{ p: 4, maxWidth: 800, mx: "auto" }}>
      <Stack spacing={3}>
        <Box>
          <Button
            component={NextLink}
            href="/"
            variant="text"
            size="small"
            sx={{ pl: 0 }}
          >
            ← All Toys
          </Button>
        </Box>

        {isPending ? (
          <Typography variant="body1" color="text.secondary">
            Loading…
          </Typography>
        ) : isError ? (
          <Typography variant="body1" color="error">
            Failed to load toy: {error.message}
          </Typography>
        ) : (
          <Stack spacing={3}>
            {getFeaturedImage(toy) !== null ? (
              <Box
                component="img"
                src={getFeaturedImage(toy)!.image_url}
                alt={toy.name}
                sx={{
                  width: "100%",
                  aspectRatio: "16/9",
                  objectFit: "cover",
                  borderRadius: 1,
                }}
              />
            ) : null}

            {getSecondaryImages(toy).length > 0 ? (
              <Stack direction="row" spacing={1} sx={{ overflowX: "auto" }}>
                {getSecondaryImages(toy).map((img: ToyImage) => (
                  <Box
                    key={img.id}
                    component="img"
                    src={img.image_url}
                    alt={toy.name}
                    sx={{
                      width: 120,
                      aspectRatio: "4/3",
                      objectFit: "cover",
                      borderRadius: 1,
                      flexShrink: 0,
                    }}
                  />
                ))}
              </Stack>
            ) : null}

            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="pageTitle" component="h1">
                  {toy.name}
                </Typography>
                {isAdmin ? (
                  <Button component={NextLink} href={`/admin/toys/${toy.id}/edit`} variant="outlined" size="small">
                    Edit
                  </Button>
                ) : null}
              </Stack>

              <Stack spacing={1}>
                {formatAgeRange(toy) !== null ? (
                  <Typography variant="body1">
                    <Typography variant="bodyStrong" component="span">Age: </Typography>
                    {formatAgeRange(toy)}
                  </Typography>
                ) : null}
                {toy.piece_count !== null ? (
                  <Typography variant="body1">
                    <Typography variant="bodyStrong" component="span">Pieces: </Typography>
                    {toy.piece_count}
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
                {toy.battery_operated ? (
                  <Typography variant="body1">Battery operated</Typography>
                ) : null}
              </Stack>

              <Divider />

              <Typography variant="body1">{toy.description}</Typography>

              {toy.link !== null ? (
                <Box>
                  <Button
                    component="a"
                    href={toy.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outlined"
                    size="small"
                  >
                    More info
                  </Button>
                </Box>
              ) : null}
            </Stack>

            <Paper elevation={0} sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Typography variant="sectionTitle" component="h2">
                  Borrow this toy
                </Typography>
                {isMember ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    {!toy.is_available ? (
                      <Typography variant="body1" color="text.secondary">
                        This toy is currently unavailable.
                      </Typography>
                    ) : inCart ? (
                      <>
                        <Button variant="contained" disabled>In cart</Button>
                        <Button variant="outlined" size="small" onClick={() => removeFromCart(params.id)}>
                          Remove
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="contained"
                        disabled={cartFull}
                        onClick={() => addToCart(params.id)}
                      >
                        {cartFull ? "Cart full (5 max)" : "Add to cart"}
                      </Button>
                    )}
                    {cartIds.length > 0 ? (
                      <Button component={NextLink} href="/cart" variant="outlined">
                        View cart ({cartIds.length})
                      </Button>
                    ) : null}
                  </Stack>
                ) : isAuthenticated ? (
                  <Typography variant="body1" color="text.secondary">
                    Your membership application is pending admin approval.
                  </Typography>
                ) : (
                  <>
                    <Typography variant="body1" color="text.secondary">
                      Membership is required to check out toys.
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button component={NextLink} href="/login" variant="contained">
                        Sign in
                      </Button>
                      <Button component={NextLink} href="/apply" variant="outlined">
                        Apply for membership
                      </Button>
                    </Stack>
                  </>
                )}
              </Stack>
            </Paper>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
