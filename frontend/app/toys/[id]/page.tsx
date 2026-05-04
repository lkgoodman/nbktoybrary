"use client";

import { useState } from "react";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Modal from "@mui/material/Modal";
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
  if (toy.age_min === 0) return "0+";
  if (toy.age_min < 12) return `${toy.age_min}m+`;
  return `${toy.age_min / 12}+`;
}

type Props = { params: { id: string } };

export default function ToyPage({ params }: Props): JSX.Element {
  const { data: toy, isPending, isError, error } = useToy(params.id);
  const { isAuthenticated, isMember, isAdmin } = useAuth();
  const { addToCart, removeFromCart, isInCart, cartIds } = useCart();
  const inCart = isInCart(params.id);
  const cartFull = cartIds.length >= 5;
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

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
            <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems="flex-start">
              {getFeaturedImage(toy) !== null ? (
                <Stack spacing={1} sx={{ flexShrink: 0, width: { xs: "100%", sm: 280 } }}>
                  <Box
                    component="img"
                    src={getFeaturedImage(toy)!.image_url}
                    alt={toy.name}
                    onClick={() => setLightboxIndex(toy.images.findIndex((img) => img.id === getFeaturedImage(toy)!.id))}
                    sx={{
                      width: "100%",
                      aspectRatio: "1/1",
                      objectFit: "cover",
                      borderRadius: 1,
                      cursor: "zoom-in",
                    }}
                  />
                  {getSecondaryImages(toy).length > 0 ? (
                    <Stack direction="row" spacing={1} sx={{ overflowX: "auto" }}>
                      {getSecondaryImages(toy).map((img: ToyImage) => (
                        <Box
                          key={img.id}
                          component="img"
                          src={img.image_url}
                          alt={toy.name}
                          onClick={() => setLightboxIndex(toy.images.findIndex((i) => i.id === img.id))}
                          sx={{
                            width: 72,
                            aspectRatio: "1/1",
                            objectFit: "cover",
                            borderRadius: 1,
                            flexShrink: 0,
                            cursor: "zoom-in",
                          }}
                        />
                      ))}
                    </Stack>
                  ) : null}
                </Stack>
              ) : null}

              <Stack spacing={2} sx={{ flex: 1, minWidth: 0 }}>
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
                  {toy.materials.length > 0 ? (
                    <Typography variant="body1">
                      <Typography variant="bodyStrong" component="span">Material(s): </Typography>
                      {toy.materials.join(", ")}
                    </Typography>
                  ) : null}
                {toy.battery_operated ? (
                    <Typography variant="body1">Battery operated</Typography>
                  ) : null}
                  {toy.tags.length > 0 ? (
                    <Typography variant="body1">
                      <Typography variant="bodyStrong" component="span">Tags: </Typography>
                      {toy.tags.join(", ")}
                    </Typography>
                  ) : null}
                </Stack>

                <Divider />

                <Typography variant="body1" sx={{ whiteSpace: "pre-line" }}>{toy.description}</Typography>

                {toy.link !== null && isAdmin ? (
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
                        <Button component={NextLink} href="/" variant="outlined" size="small">
                          Keep browsing
                        </Button>
                        <Button variant="outlined" size="small" color="error" onClick={() => removeFromCart(params.id)}>
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

      <Modal open={lightboxIndex !== null} onClose={() => setLightboxIndex(null)}>
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 2,
            cursor: "zoom-out",
          }}
          onClick={() => setLightboxIndex(null)}
        >
          {lightboxIndex !== null && toy !== undefined ? (
            <Box
              onClick={(e) => e.stopPropagation()}
              sx={{ position: "relative", display: "inline-flex", alignItems: "center" }}
            >
              <Box
                component="img"
                src={toy.images[lightboxIndex].image_url}
                alt=""
                onClick={() => setLightboxIndex(null)}
                sx={{
                  maxWidth: "90vw",
                  maxHeight: "90vh",
                  objectFit: "contain",
                  borderRadius: 1,
                  cursor: "zoom-out",
                }}
              />
              {toy.images.length > 1 ? (
                <>
                  <Button
                    onClick={() => setLightboxIndex((lightboxIndex - 1 + toy.images.length) % toy.images.length)}
                    sx={{
                      position: "absolute",
                      left: -48,
                      color: "white",
                      fontSize: "2rem",
                      minWidth: "auto",
                      p: 1,
                    }}
                  >
                    ‹
                  </Button>
                  <Button
                    onClick={() => setLightboxIndex((lightboxIndex + 1) % toy.images.length)}
                    sx={{
                      position: "absolute",
                      right: -48,
                      color: "white",
                      fontSize: "2rem",
                      minWidth: "auto",
                      p: 1,
                    }}
                  >
                    ›
                  </Button>
                </>
              ) : null}
            </Box>
          ) : null}
        </Box>
      </Modal>
    </Box>
  );
}
