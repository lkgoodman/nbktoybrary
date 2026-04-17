"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import ListItemText from "@mui/material/ListItemText";
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

  const AGE_OPTIONS: { label: string; months: number }[] = [
    { label: "0+", months: 0 },
    { label: "3m+", months: 3 },
    { label: "6m+", months: 6 },
    { label: "9m+", months: 9 },
    { label: "1+", months: 12 },
    { label: "2+", months: 24 },
    { label: "3+", months: 36 },
    { label: "4+", months: 48 },
    { label: "5+", months: 60 },
    { label: "6+", months: 72 },
    { label: "7+", months: 84 },
  ];

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
        <FormControl fullWidth>
          <InputLabel>Materials (optional)</InputLabel>
          <Select
            multiple
            label="Materials (optional)"
            value={values.materials}
            onChange={(e: SelectChangeEvent<string[]>) => {
              const val = e.target.value;
              set("materials", typeof val === "string" ? val.split(",") : val);
            }}
            renderValue={(selected: string[]) => selected.join(", ")}
          >
            {["Wood", "Plastic", "Metal", "Paper", "Magnet"].map((m) => (
              <MenuItem key={m} value={m}>
                <Checkbox checked={values.materials.includes(m)} size="small" />
                <ListItemText primary={m} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Divider />

      <Stack spacing={2}>
        <Typography variant="label" color="text.secondary">Details</Typography>
        <Stack direction="row" spacing={2}>
          <FormControl sx={{ flex: 1 }}>
            <InputLabel>Min age (optional)</InputLabel>
            <Select
              label="Min age (optional)"
              value={values.age_min !== null ? String(values.age_min) : ""}
              onChange={(e: SelectChangeEvent<string>) =>
                set("age_min", e.target.value === "" ? null : Number(e.target.value))
              }
            >
              <MenuItem value="">None</MenuItem>
              {AGE_OPTIONS.map((opt) => (
                <MenuItem key={opt.label} value={String(opt.months)}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
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
