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

import { useAuth } from "../../../lib/AuthContext";
import { useCreateToy, useUploadToyImage, useSetFeaturedImage, useToys, queryKeys } from "../../../lib/queries";
import ToyForm from "../../../components/ToyForm";
import type { ToyCreate } from "../../../lib/types";

const EMPTY: ToyCreate = {
  name: "",
  description: "",
  brand: null,
  language: null,
  link: null,
  battery_operated: false,
  shareable: true,
  age_min: null,
  age_max: null,
  piece_count: null,
  quantity: 1,
  admin_notes: null,
  materials: [],
  keywords: [],
  tags: [],
};

export default function NewToyPage(): JSX.Element {
  const { isAdmin, isAuthenticated, token, authReady } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const createToy = useCreateToy();
  const uploadImage = useUploadToyImage();
  const setFeatured = useSetFeaturedImage();
  const { data: allToys } = useToys(token, { enabled: authReady });
  const tagOptions = [...new Set((allToys ?? []).flatMap((t) => t.tags))].sort();
  const brandOptions = [...new Set((allToys ?? []).map((t) => t.brand).filter((b): b is string => b !== null))].sort();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<ToyCreate>(EMPTY);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [featuredIndex, setFeaturedIndex] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) router.replace("/");
  }, [isAuthenticated, isAdmin, router]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setPendingFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      setPreviews((prev) => [...prev, url]);
    });
    e.target.value = "";
  }

  function removeFile(index: number): void {
    URL.revokeObjectURL(previews[index]);
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setFeaturedIndex((prev) => {
      if (prev === null) return null;
      if (prev === index) return null;
      if (prev > index) return prev - 1;
      return prev;
    });
  }

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    if (token === null) return;
    setUploadError(null);
    createToy.mutate(
      { payload: values, token },
      {
        onSuccess: async (toy) => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.toys.list() });
          const uploadedIds: string[] = [];
          for (const file of pendingFiles) {
            await new Promise<void>((resolve, reject) => {
              uploadImage.mutate(
                { toyId: toy.id, file, token },
                {
                  onSuccess: (img) => { uploadedIds.push(img.id); resolve(); },
                  onError: (err) => reject(err),
                },
              );
            });
          }
          if (featuredIndex !== null && uploadedIds[featuredIndex] !== undefined) {
            await new Promise<void>((resolve) => {
              setFeatured.mutate(
                { imageId: uploadedIds[featuredIndex], token },
                { onSuccess: () => resolve(), onError: () => resolve() },
              );
            });
          }
          router.push(`/admin/toys/${toy.id}`);
        },
        onError: () => {
          setUploadError(null);
        },
      },
    );
  }

  if (!isAuthenticated || !isAdmin) return <Box />;

  const isSubmitting = createToy.isPending || uploadImage.isPending;

  return (
    <Box component="main" sx={{ p: { xs: 2, md: 4 }, maxWidth: 700, mx: "auto" }}>
      <Stack spacing={3}>
        <Box>
          <Button component={NextLink} href="/admin" variant="text" size="small" sx={{ pl: 0 }}>
            ← Inventory
          </Button>
        </Box>
        <Typography variant="pageTitle" component="h1">New toy</Typography>
        <Paper elevation={0} sx={{ p: 4 }}>
          <ToyForm
            values={values}
            onChange={setValues}
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
            error={createToy.isError ? createToy.error.message : uploadError}
            submitLabel={isSubmitting ? (uploadImage.isPending ? "Uploading photos…" : "Creating…") : "Create toy"}
            tagOptions={tagOptions}
            brandOptions={brandOptions}
          />
        </Paper>

        <Paper elevation={0} sx={{ p: 4 }}>
          <Stack spacing={2}>
            <Typography variant="sectionTitle" component="h2">Photos</Typography>
            {previews.length > 0 ? (
              <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: "wrap" }}>
                {previews.map((url, i) => {
                  const isPrimary = featuredIndex === i;
                  return (
                    <Box key={url}>
                      <Box
                        component="img"
                        src={url}
                        alt={`Photo ${i + 1}`}
                        sx={{
                          width: 120,
                          aspectRatio: "4/3",
                          objectFit: "cover",
                          borderRadius: 1,
                          border: isPrimary ? 2 : 0,
                          borderColor: "secondary.main",
                        }}
                      />
                      <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                        {isPrimary ? (
                          <Typography variant="label" color="secondary">Primary</Typography>
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={isSubmitting}
                            onClick={() => setFeaturedIndex(i)}
                          >
                            Set primary
                          </Button>
                        )}
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={() => removeFile(i)}
                          disabled={isSubmitting}
                        >
                          Remove
                        </Button>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            ) : (
              <Typography variant="body1" color="text.secondary">No photos added yet.</Typography>
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
                disabled={isSubmitting}
                onClick={() => fileInputRef.current?.click()}
              >
                Add photos
              </Button>
            </Box>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
