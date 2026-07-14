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
import { useToy, useToys, useUpdateToy, useUploadToyImage, useSetFeaturedImage, useDeleteToyImage, useDeleteToy, queryKeys } from "../../../../lib/queries";
import ToyForm from "../../../../components/ToyForm";
import type { ToyCreate, ToyImage } from "../../../../lib/types";

type Props = { params: { id: string } };

export default function EditToyPage({ params }: Props): JSX.Element {
  const { isAdmin, isAuthenticated, token, authReady } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: toy, isPending } = useToy(params.id, token, { enabled: authReady });
  const { data: allToys } = useToys(token, { enabled: authReady });
  const tagOptions = [...new Set((allToys ?? []).flatMap((t) => t.tags))].sort();
  const brandOptions = [...new Set((allToys ?? []).map((t) => t.brand).filter((b): b is string => b !== null))].sort();
  const updateToy = useUpdateToy();
  const uploadImage = useUploadToyImage();
  const setFeatured = useSetFeaturedImage();
  const deleteImage = useDeleteToyImage();
  const deleteToy = useDeleteToy();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<ToyCreate | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);

  function invalidateToy(): void {
    void queryClient.invalidateQueries({ queryKey: queryKeys.toys.detail(params.id) });
  }

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
                { onSuccess: () => { invalidateToy(); resolve(); }, onError: () => resolve() },
              );
            }),
        ),
      Promise.resolve(),
    );
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
        quantity: toy.quantity,
        admin_notes: toy.admin_notes,
        materials: toy.materials,
        keywords: toy.keywords,
        tags: toy.tags,
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
    <Box component="main" sx={{ p: { xs: 2, md: 4 }, maxWidth: 700, mx: "auto" }}>
      <Stack spacing={3}>
        <Box>
          <Button component={NextLink} href="/admin?tab=inventory" variant="text" size="small" sx={{ pl: 0 }}>
            ← Inventory
          </Button>
        </Box>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Typography variant="pageTitle" component="h1">Edit toy</Typography>
          {!confirmDelete ? (
            <Button variant="outlined" color="error" size="small" onClick={() => setConfirmDelete(true)}>
              Delete toy
            </Button>
          ) : (
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                color="error"
                size="small"
                disabled={deleteToy.isPending}
                onClick={() => {
                  if (token === null) return;
                  deleteToy.mutate(
                    { id: params.id, token },
                    {
                      onSuccess: () => {
                        void queryClient.invalidateQueries({ queryKey: queryKeys.toys.list() });
                        router.push("/admin");
                      },
                    },
                  );
                }}
              >
                Confirm delete
              </Button>
              <Button variant="outlined" size="small" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
            </Stack>
          )}
        </Stack>
        {deleteToy.isError ? (
          <Typography variant="body1" color="error">{deleteToy.error.message}</Typography>
        ) : null}
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
              tagOptions={tagOptions}
              brandOptions={brandOptions}
            >
              {toy !== undefined ? (
                <Stack spacing={2}>
                  <Typography variant="sectionTitle" component="h2">Photos</Typography>
                  {toy.images.length > 0 ? (
                    <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: "wrap" }}>
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
                                onClick={() =>
                                  token !== null &&
                                  setFeatured.mutate({ imageId: img.id, token }, { onSuccess: invalidateToy })
                                }
                              >
                                Set primary
                              </Button>
                            )}
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              disabled={deleteImage.isPending}
                              onClick={() =>
                                token !== null &&
                                deleteImage.mutate({ imageId: img.id, token }, { onSuccess: invalidateToy })
                              }
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
                    {uploadImage.isError ? (
                      <Typography variant="body1" color="error">{uploadImage.error.message}</Typography>
                    ) : null}
                  </Box>
                </Stack>
              ) : null}
            </ToyForm>
          )}
        </Paper>

      </Stack>
    </Box>
  );
}
