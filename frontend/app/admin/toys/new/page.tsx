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
import { useCreateToy } from "../../../lib/queries";
import { queryKeys } from "../../../lib/queries";
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
  materials: [],
};

export default function NewToyPage(): JSX.Element {
  const { isAdmin, isAuthenticated, token } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const createToy = useCreateToy();
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
          router.push(`/toys/${toy.id}`);
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
        <Typography variant="pageTitle" component="h1">New toy</Typography>
        <Paper elevation={0} sx={{ p: 4 }}>
          <ToyForm
            values={values}
            onChange={setValues}
            onSubmit={handleSubmit}
            isLoading={createToy.isPending}
            error={createToy.isError ? createToy.error.message : null}
            submitLabel="Create toy"
          />
        </Paper>
      </Stack>
    </Box>
  );
}
