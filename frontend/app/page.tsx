"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useToys } from "./lib/queries";
import type { Toy, ToyImage } from "./lib/types";

function getFeaturedImage(toy: Toy): ToyImage | null {
  return toy.images.find((img: ToyImage) => img.is_featured) ?? toy.images[0] ?? null;
}

function formatAgeRange(toy: Toy): string | null {
  if (toy.age_min === null && toy.age_max === null) return null;
  const min: string = toy.age_min !== null ? `${toy.age_min}` : "?";
  const max: string = toy.age_max !== null ? `${toy.age_max}` : "?";
  return `Ages ${min}–${max}`;
}

export default function Page(): JSX.Element {
  const { data, isPending, isError, error } = useToys();

  return (
    <Box component="main" sx={{ p: 4 }}>
      <Stack spacing={3}>
        <Typography variant="pageTitle" component="h1">
          nbktoybrary
        </Typography>
        <Stack spacing={1}>
          <Typography variant="label" color="text.secondary">
            Toys
          </Typography>
          {isPending ? (
            <Typography variant="body1" color="text.secondary">
              Loading toys…
            </Typography>
          ) : isError ? (
            <Typography variant="body1" color="error">
              Failed to load toys: {error.message}
            </Typography>
          ) : data.length === 0 ? (
            <Typography variant="body1" color="text.secondary">
              No toys yet.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {data.map((toy: Toy) => {
                const ageRange: string | null = formatAgeRange(toy);
                const featuredImage: ToyImage | null = getFeaturedImage(toy);
                return (
                  <Paper key={toy.id} sx={{ p: 3 }} elevation={0}>
                    <Stack spacing={1}>
                      {featuredImage !== null ? (
                        <Box
                          component="img"
                          src={featuredImage.image_url}
                          alt={toy.name}
                          sx={{
                            width: "100%",
                            aspectRatio: "16/9",
                            objectFit: "cover",
                            borderRadius: 1,
                          }}
                        />
                      ) : null}
                      <Typography variant="sectionTitle" component="h2">
                        {toy.name}
                      </Typography>
                      <Typography variant="body1">{toy.description}</Typography>
                      <Stack direction="row" spacing={2}>
                        {toy.brand !== null ? (
                          <Typography variant="label" color="text.secondary">
                            {toy.brand}
                          </Typography>
                        ) : null}
                        {ageRange !== null ? (
                          <Typography variant="label" color="text.secondary">
                            {ageRange}
                          </Typography>
                        ) : null}
                        {toy.piece_count !== null ? (
                          <Typography variant="label" color="text.secondary">
                            {toy.piece_count} pieces
                          </Typography>
                        ) : null}
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}
