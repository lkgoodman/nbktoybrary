"use client";

import { useState } from "react";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { useToys } from "./lib/queries";
import { useCart } from "./lib/CartContext";
import type { Toy, ToyImage } from "./lib/types";

interface AgeBucket {
  label: string;
  age: number;
}

const AGE_BUCKETS: AgeBucket[] = [
  { label: "0+", age: 0 },
  { label: "1+", age: 1 },
  { label: "2+", age: 2 },
  { label: "3+", age: 3 },
  { label: "4+", age: 4 },
  { label: "5+", age: 5 },
  { label: "6+", age: 6 },
  { label: "7+", age: 7 },
];

function getFeaturedImage(toy: Toy): ToyImage | null {
  return toy.images.find((img: ToyImage) => img.is_featured) ?? toy.images[0] ?? null;
}

function formatAgeRange(toy: Toy): string | null {
  if (toy.age_min === null) return null;
  return `${toy.age_min}+`;
}

function toyMatchesAgeBucket(toy: Toy, bucket: AgeBucket): boolean {
  if (toy.age_min === null) return false;
  return toy.age_min <= bucket.age;
}

export default function Page(): JSX.Element {
  const { data, isPending, isError, error } = useToys();
  const { isInCart } = useCart();
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [activeAgeBucket, setActiveAgeBucket] = useState<AgeBucket | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const LANGUAGES: string[] = ["French", "Spanish"];

  const allTags: string[] = data
    ? [...new Set(data.flatMap((toy: Toy) => toy.tags))].sort()
    : [];

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const visibleToys: Toy[] = data
    ? data.filter((toy: Toy) => {
        const searchMatch =
          normalizedQuery === "" ||
          toy.name.toLowerCase().includes(normalizedQuery) ||
          toy.description.toLowerCase().includes(normalizedQuery);
        const tagMatch =
          activeTags.size === 0 || toy.tags.some((t: string) => activeTags.has(t));
        const ageMatch =
          activeAgeBucket === null || toyMatchesAgeBucket(toy, activeAgeBucket);
        const languageMatch =
          activeLanguage === null || toy.language === activeLanguage;
        return searchMatch && tagMatch && ageMatch && languageMatch;
      })
    : [];

  function handleTagsChange(e: SelectChangeEvent<string[]>): void {
    const val = e.target.value;
    setActiveTags(new Set(typeof val === "string" ? val.split(",") : val));
  }

  function handleAgeChange(e: SelectChangeEvent<string>): void {
    const val = e.target.value;
    setActiveAgeBucket(val === "" ? null : AGE_BUCKETS.find((b) => b.label === val) ?? null);
  }

  const hasFilters = searchQuery.trim() !== "" || activeTags.size > 0 || activeAgeBucket !== null || activeLanguage !== null;

  const sidebarContent = (
    <Stack spacing={2}>
      {hasFilters ? (
        <Chip
          label="Clear all filters"
          size="small"
          variant="outlined"
          onClick={() => {
            setSearchQuery("");
            setActiveTags(new Set());
            setActiveAgeBucket(null);
            setActiveLanguage(null);
          }}
        />
      ) : null}

      <TextField
        size="small"
        fullWidth
        label="Search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <Divider />

      <FormControl size="small" fullWidth>
        <InputLabel>Category</InputLabel>
        <Select
          multiple
          label="Category"
          value={[...activeTags]}
          onChange={handleTagsChange}
          renderValue={(selected: string[]) => selected.join(", ")}
        >
          {allTags.map((tag: string) => (
            <MenuItem key={tag} value={tag}>
              <Checkbox checked={activeTags.has(tag)} size="small" />
              <ListItemText primary={tag} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Divider />

      <FormControl size="small" fullWidth>
        <InputLabel>Age</InputLabel>
        <Select
          label="Age"
          value={activeAgeBucket?.label ?? ""}
          onChange={handleAgeChange}
        >
          <MenuItem value="">Any age</MenuItem>
          {AGE_BUCKETS.map((bucket: AgeBucket) => (
            <MenuItem key={bucket.label} value={bucket.label}>
              {bucket.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Divider />

      <FormControl size="small" fullWidth>
        <InputLabel>Language</InputLabel>
        <Select
          label="Language"
          value={activeLanguage ?? ""}
          onChange={(e) => setActiveLanguage(e.target.value === "" ? null : e.target.value)}
        >
          <MenuItem value="">Any language</MenuItem>
          {LANGUAGES.map((lang: string) => (
            <MenuItem key={lang} value={lang}>{lang}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );

  return (
    <Box component="main" sx={{ p: 4 }}>
      <Stack spacing={3}>
        <Typography variant="pageTitle" component="h1">
          nbktoybrary
        </Typography>

        {/* Mobile filter row */}
        <Stack
          spacing={2}
          sx={{ display: { xs: "flex", md: "none" } }}
        >
          <FormControl size="small" fullWidth>
            <InputLabel>Age</InputLabel>
            <Select
              label="Age"
              value={activeAgeBucket?.label ?? ""}
              onChange={handleAgeChange}
            >
              <MenuItem value="">Any age</MenuItem>
              {AGE_BUCKETS.map((bucket: AgeBucket) => (
                <MenuItem key={bucket.label} value={bucket.label}>
                  {bucket.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            fullWidth
            label="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <FormControl size="small" fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              multiple
              label="Category"
              value={[...activeTags]}
              onChange={handleTagsChange}
              renderValue={(selected: string[]) => selected.join(", ")}
            >
              {allTags.map((tag: string) => (
                <MenuItem key={tag} value={tag}>
                  <Checkbox checked={activeTags.has(tag)} size="small" />
                  <ListItemText primary={tag} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        {/* Main content: sidebar + grid */}
        <Box sx={{ display: "flex", gap: 4, alignItems: "flex-start" }}>
          {/* Desktop sidebar */}
          <Box
            sx={{
              display: { xs: "none", md: "block" },
              width: (theme) => theme.layout.sidebarWidth,
              flexShrink: 0,
            }}
          >
            {sidebarContent}
          </Box>

          {/* Toy grid */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {isPending ? (
              <Typography variant="body1" color="text.secondary">
                Loading toys…
              </Typography>
            ) : isError ? (
              <Typography variant="body1" color="error">
                Failed to load toys: {error.message}
              </Typography>
            ) : visibleToys.length === 0 ? (
              <Typography variant="body1" color="text.secondary">
                No toys match the selected filters.
              </Typography>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(1, 1fr)",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(2, 1fr)",
                    lg: "repeat(3, 1fr)",
                  },
                  gap: 2,
                }}
              >
                {visibleToys.map((toy: Toy) => {
                  const ageRange: string | null = formatAgeRange(toy);
                  const featuredImage: ToyImage | null = getFeaturedImage(toy);
                  return (
                    <Box
                      key={toy.id}
                      component={NextLink}
                      href={`/toys/${toy.id}`}
                      sx={{ textDecoration: "none", color: "inherit", display: "block" }}
                    >
                      <Paper sx={{ p: 3, height: "100%" }} elevation={0}>
                        <Stack spacing={1}>
                          {featuredImage !== null ? (
                            <Box sx={{ position: "relative" }}>
                              <Box
                                component="img"
                                src={featuredImage.image_url}
                                alt={toy.name}
                                sx={{
                                  width: "100%",
                                  aspectRatio: "16/9",
                                  objectFit: "cover",
                                  borderRadius: 1,
                                  display: "block",
                                }}
                              />
                              {(isInCart(toy.id) || !toy.is_available) ? (
                                <Box
                                  sx={{
                                    position: "absolute",
                                    inset: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: 1,
                                    bgcolor: "rgba(0,0,0,0.5)",
                                    pointerEvents: "none",
                                  }}
                                >
                                  <Typography variant="sectionTitle" sx={{ color: "white" }}>
                                    {isInCart(toy.id) ? "IN CART" : "UNAVAILABLE"}
                                  </Typography>
                                </Box>
                              ) : null}
                            </Box>
                          ) : null}
                          <Typography variant="sectionTitle" component="h2">
                            {toy.name}
                          </Typography>
                          <Typography variant="body1">{toy.description}</Typography>
                          <Stack direction="row" spacing={2} flexWrap="wrap">
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
                            {toy.brand !== null ? (
                              <Typography variant="label" color="text.secondary">
                                {toy.brand}
                              </Typography>
                            ) : null}
                          </Stack>
                        </Stack>
                      </Paper>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
