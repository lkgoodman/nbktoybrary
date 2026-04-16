"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

const LANGUAGES: string[] = ["French", "Spanish"];

import type { ToyCreate } from "../lib/types";

interface ToyFormProps {
  values: ToyCreate;
  onChange: (values: ToyCreate) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  error: string | null;
  submitLabel: string;
}

export default function ToyForm({
  values,
  onChange,
  onSubmit,
  isLoading,
  error,
  submitLabel,
}: ToyFormProps): JSX.Element {
  function set<K extends keyof ToyCreate>(key: K, value: ToyCreate[K]): void {
    onChange({ ...values, [key]: value });
  }

  function parseOptionalInt(raw: string): number | null {
    const n = parseInt(raw, 10);
    return raw.trim() === "" || isNaN(n) ? null : n;
  }

  return (
    <Stack spacing={3} component="form" onSubmit={onSubmit}>
      {error !== null ? (
        <Typography variant="body1" color="error">{error}</Typography>
      ) : null}

      <Stack spacing={2}>
        <Typography variant="label" color="text.secondary">Basic info</Typography>
        <TextField
          label="Name"
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          required
          fullWidth
        />
        <TextField
          label="Description"
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          required
          fullWidth
          multiline
          rows={3}
        />
        <TextField
          label="Brand (optional)"
          value={values.brand ?? ""}
          onChange={(e) => set("brand", e.target.value.trim() === "" ? null : e.target.value)}
          fullWidth
        />
        <FormControl fullWidth>
          <InputLabel>Language (optional)</InputLabel>
          <Select
            label="Language (optional)"
            value={values.language ?? ""}
            onChange={(e: SelectChangeEvent<string>) =>
              set("language", e.target.value === "" ? null : e.target.value)
            }
          >
            <MenuItem value="">None</MenuItem>
            {LANGUAGES.map((lang: string) => (
              <MenuItem key={lang} value={lang}>{lang}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Link (optional)"
          value={values.link ?? ""}
          onChange={(e) => set("link", e.target.value.trim() === "" ? null : e.target.value)}
          fullWidth
        />
      </Stack>

      <Divider />

      <Stack spacing={2}>
        <Typography variant="label" color="text.secondary">Details</Typography>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Min age (optional)"
            type="number"
            value={values.age_min ?? ""}
            onChange={(e) => set("age_min", parseOptionalInt(e.target.value))}
            sx={{ flex: 1 }}
            inputProps={{ min: 0 }}
          />
          <TextField
            label="Max age (optional)"
            type="number"
            value={values.age_max ?? ""}
            onChange={(e) => set("age_max", parseOptionalInt(e.target.value))}
            sx={{ flex: 1 }}
            inputProps={{ min: 0 }}
          />
          <TextField
            label="Piece count (optional)"
            type="number"
            value={values.piece_count ?? ""}
            onChange={(e) => set("piece_count", parseOptionalInt(e.target.value))}
            sx={{ flex: 1 }}
            inputProps={{ min: 0 }}
          />
        </Stack>
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={values.battery_operated}
                onChange={(e) => set("battery_operated", e.target.checked)}
              />
            }
            label="Battery operated"
          />
        </Box>
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={values.shareable}
                onChange={(e) => set("shareable", e.target.checked)}
              />
            }
            label="Shareable"
          />
        </Box>
      </Stack>

      <Button type="submit" variant="contained" disabled={isLoading}>
        {isLoading ? "Saving…" : submitLabel}
      </Button>
    </Stack>
  );
}
