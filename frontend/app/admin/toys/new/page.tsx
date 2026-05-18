"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../../../lib/AuthContext";
import { useCreateToy, useToys, queryKeys } from "../../../lib/queries";
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
  const { data: allToys } = useToys(token, { enabled: authReady });
  const tagOptions = [...new Set((allToys ?? []).flatMap((t) => t.tags))].sort();
  const brandOptions = [...new Set((allToys ?? []).map((t) => t.brand).filter((b): b is string => b !== null))].sort();
  const [values, setValues] = useState<ToyCreate>(EMPTY);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) router.replace("/");
  }, [isAuthenticated, isAdmin, router]);

  function handleSubmit(e: React.FormEvent): void {
    e.preventDefault();
    if (token === null) return;
    createToy.mutate(
      { payload: values, token },
      {
        onSuccess: (toy) => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.toys.list() });
          router.push(`/admin/toys/${toy.id}`);
        },
      },
    );
  }

  if (!isAuthenticated || !isAdmin) return <Box />;

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
            isLoading={createToy.isPending}
            error={createToy.isError ? createToy.error.message : null}
            submitLabel={createToy.isPending ? "Creating…" : "Create toy"}
            tagOptions={tagOptions}
            brandOptions={brandOptions}
          />
        </Paper>
      </Stack>
    </Box>
  );
}
