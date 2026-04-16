"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../../../lib/AuthContext";
import { useToy, useUpdateToy, useUploadToyImage, useSetFeaturedImage, useDeleteToyImage, queryKeys } from "../../../../lib/queries";
import ToyForm from "../../../../components/ToyForm";
import type { ToyCreate, ToyImage } from "../../../../lib/types";

type Props = { params: { id: string } };

export default function EditToyPage({ params }: Props): JSX.Element {
  const { isAdmin, isAuthenticated, token } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: toy, isPending } = useToy(params.id);
  const updateToy = useUpdateToy();
  const uploadImage = useUploadToyImage();
  const setFeatured = useSetFeaturedImage();
  const deleteImage = useDeleteToyImage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<ToyCreate | null>(null);

  function invalidateToy(): void {
    void queryClient.invalidateQueries({ queryKey: queryKeys.toys.detail(params.id) });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0];
    if (file === undefined || token === null) return;
    uploadImage.mutate(
      { toyId: params.id, file, token },
      { onSuccess: invalidateToy },
    );
    e.target.value = "";
  }

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) router.replace("/");
  }, [isAuthenticated, isAdmin, router]);

  useEffect(() => {
    if (toy !== undefined && values === null) {
      setValues({
        name: toy.name,
        description: toy.description,
        brand: toy.brand,
        language: toy.language,
        link: toy.link,
        battery_operated: toy.battery_operated,
        shareable: toy.shareable,
        age_min: toy.age_min,
        age_max: toy.age_max,
        piece_count: toy.piece_count,
      });
    }
  }, [toy, values]);

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    if (token === null || values === null) return;
    updateToy.mutate(
      { id: params.id, payload: values, token },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.toys.detail(params.id) });
          void queryClient.invalidateQueries({ queryKey: queryKeys.toys.list() });
          router.push(`/toys/${params.id}`);
        },
      },
    );
  }

  if (!isAuthenticated || !isAdmin) return <Box />;

  return (
    <Box component="main" sx={{ p: 4, maxWidth: 700, mx: "auto" }}>
      <Stack spacing={3}>
        <Box>
          <Button component={NextLink} href="/admin?tab=inventory" variant="text" size="small" sx={{ pl: 0 }}>
            ← Inventory
          </Button>
        </Box>
        <Typography variant="pageTitle" component="h1">Edit toy</Typography>
        <Paper elevation={0} sx={{ p: 4 }}>
          {isPending || values === null ? (
            <Typography variant="body1" color="text.secondary">Loading…</Typography>
          ) : (
            <ToyForm
              values={values}
              onChange={setValues}
              onSubmit={handleSubmit}
              isLoading={updateToy.isPending}
              error={updateToy.isError ? updateToy.error.message : null}
              submitLabel="Save changes"
            />
          )}
        </Paper>

        {toy !== undefined ? (
          <Paper elevation={0} sx={{ p: 4 }}>
            <Stack spacing={2}>
              <Typography variant="sectionTitle" component="h2">
                Manage photos
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap">
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
                      }}
                    />
                    <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                      {!img.is_featured ? (
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={setFeatured.isPending}
                          onClick={() =>
                            token !== null &&
                            setFeatured.mutate(
                              { imageId: img.id, token },
                              { onSuccess: invalidateToy },
                            )
                          }
                        >
                          Set featured
                        </Button>
                      ) : (
                        <Typography variant="label" color="secondary">
                          Featured
                        </Typography>
                      )}
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        disabled={deleteImage.isPending}
                        onClick={() =>
                          token !== null &&
                          deleteImage.mutate(
                            { imageId: img.id, token },
                            { onSuccess: invalidateToy },
                          )
                        }
                      >
                        Delete
                      </Button>
                    </Stack>
                  </Box>
                ))}
              </Stack>
              <Box>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <Button
                  variant="contained"
                  disabled={uploadImage.isPending}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadImage.isPending ? "Uploading…" : "Add photo"}
                </Button>
              </Box>
            </Stack>
          </Paper>
        ) : null}
      </Stack>
    </Box>
  );
}
