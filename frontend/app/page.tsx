"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import NextLink from "next/link";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useQueryClient } from "@tanstack/react-query";

import { useToys, useFavorites, useAddFavorite, useRemoveFavorite } from "./lib/queries";
import { queryKeys } from "./lib/queries";
import { useCart } from "./lib/CartContext";
import { useAuth } from "./lib/AuthContext";
import type { Toy, ToyImage } from "./lib/types";

interface AgeBucket {
  label: string;
  age: number;
}

const AGE_BUCKETS: AgeBucket[] = [
  { label: "0+", age: 0 },
  { label: "3m+", age: 3 },
  { label: "6m+", age: 6 },
  { label: "9m+", age: 9 },
  { label: "1+", age: 12 },
  { label: "2+", age: 24 },
  { label: "3+", age: 36 },
  { label: "4+", age: 48 },
  { label: "5+", age: 60 },
  { label: "6+", age: 72 },
  { label: "7+", age: 84 },
];

function getFeaturedImage(toy: Toy): ToyImage | null {
  return toy.images.find((img: ToyImage) => img.is_featured) ?? toy.images[0] ?? null;
}

function formatAgeMonths(months: number): string {
  if (months === 0) return "0+";
  if (months < 12) return `${months}m+`;
  return `${months / 12}+`;
}

function formatAgeRange(toy: Toy): string | null {
  if (toy.age_min === null) return null;
  return formatAgeMonths(toy.age_min);
}

function toyMatchesAgeBucket(toy: Toy, bucket: AgeBucket): boolean {
  if (toy.age_min === null) return false;
  return toy.age_min <= bucket.age;
}

export default function Page(): JSX.Element {
  const { data, isPending, isError, error } = useToys();
  const { isInCart, addToCart, removeFromCart, cartIds } = useCart();
  const { isAuthenticated, isMember, token } = useAuth();
  const queryClient = useQueryClient();
  const { data: favorites } = useFavorites(isMember ? token : null);
  const addFavoriteMut = useAddFavorite();
  const removeFavoriteMut = useRemoveFavorite();
  const favoriteIds = useMemo(() => new Set((favorites ?? []).map((f) => f.toy_id)), [favorites]);
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [welcomeName, setWelcomeName] = useState<string | null>(null);
  const [signedOut, setSignedOut] = useState<boolean>(false);
  const prevAuthRef = useRef<boolean>(isAuthenticated);
  useEffect(() => {
    const name = sessionStorage.getItem("welcomeName");
    if (name !== null) {
      sessionStorage.removeItem("welcomeName");
      setWelcomeName(name);
    }
    const flag = sessionStorage.getItem("signedOut");
    if (flag !== null) {
      sessionStorage.removeItem("signedOut");
      setSignedOut(true);
    }
  }, []);
  useEffect(() => {
    if (prevAuthRef.current && !isAuthenticated) {
      setWelcomeName(null);
      setSignedOut(true);
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated]);
  const [activeAgeBucket, setActiveAgeBucket] = useState<AgeBucket | null>(null);
  const [activeLanguage, setActiveLanguage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [availableOnly, setAvailableOnly] = useState<boolean>(false);

  const LANGUAGES: string[] = ["French", "Spanish"];

  const toys: Toy[] = useMemo(() => {
    if (!data) return [];
    if (isAuthenticated) return data;
    const shuffled = [...data];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [data, isAuthenticated]);

  const allTags: string[] = useMemo(
    () => [...new Set(toys.flatMap((toy: Toy) => toy.tags))].sort(),
    [toys],
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const visibleToys: Toy[] = toys
    ? toys.filter((toy: Toy) => {
        const searchMatch =
          normalizedQuery === "" ||
          toy.name.toLowerCase().includes(normalizedQuery) ||
          toy.description.toLowerCase().includes(normalizedQuery) ||
          toy.keywords.some((k) => k.includes(normalizedQuery));
        const tagMatch =
          activeTags.size === 0 || toy.tags.some((t: string) => activeTags.has(t));
        const ageMatch =
          activeAgeBucket === null || toyMatchesAgeBucket(toy, activeAgeBucket);
        const languageMatch =
          activeLanguage === null || toy.language === activeLanguage;
        const availabilityMatch = !availableOnly || toy.is_available;
        const favoriteMatch = !favoritesOnly || favoriteIds.has(toy.id);
        return searchMatch && tagMatch && ageMatch && languageMatch && availabilityMatch && favoriteMatch;
      })
      .sort((a, b) => Number(a.is_available ? 0 : 1) - Number(b.is_available ? 0 : 1))
    : [];

  function handleTagsChange(e: SelectChangeEvent<string[]>): void {
    const val = e.target.value;
    setActiveTags(new Set(typeof val === "string" ? val.split(",") : val));
  }

  function handleAgeChange(e: SelectChangeEvent<string>): void {
    const val = e.target.value;
    setActiveAgeBucket(val === "" ? null : AGE_BUCKETS.find((b) => b.label === val) ?? null);
  }

  function handleToggleFavorite(e: React.MouseEvent, toyId: string): void {
    e.preventDefault();
    e.stopPropagation();
    if (token === null) return;
    if (favoriteIds.has(toyId)) {
      removeFavoriteMut.mutate(
        { toyId, token },
        { onSuccess: () => { void queryClient.invalidateQueries({ queryKey: queryKeys.favorites.list() }); } },
      );
    } else {
      addFavoriteMut.mutate(
        { toyId, token },
        { onSuccess: () => { void queryClient.invalidateQueries({ queryKey: queryKeys.favorites.list() }); } },
      );
    }
  }

  const hasFilters = searchQuery.trim() !== "" || activeTags.size > 0 || activeAgeBucket !== null || activeLanguage !== null || availableOnly || favoritesOnly;

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
            setAvailableOnly(false);
            setFavoritesOnly(false);
          }}
        />
      ) : null}

      <TextField
        size="small"
        fullWidth
        label="Search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        slotProps={{ input: { sx: { bgcolor: "background.default" } } }}
      />

      {isMember ? (
        <FormControlLabel
          control={
            <Checkbox
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              size="small"
            />
          }
          label={
            <Typography variant="body1">Available only</Typography>
          }
        />
      ) : null}

      {isMember ? (
        <FormControlLabel
          control={
            <Checkbox
              checked={favoritesOnly}
              onChange={(e) => setFavoritesOnly(e.target.checked)}
              size="small"
            />
          }
          label={
            <Typography variant="body1">Favorites only</Typography>
          }
        />
      ) : null}

      <Divider />

      <FormControl size="small" fullWidth>
        <InputLabel>Category</InputLabel>
        <Select
          multiple
          label="Category"
          value={[...activeTags]}
          onChange={handleTagsChange}
          renderValue={(selected: string[]) => selected.join(", ")}
          sx={{ bgcolor: "background.default" }}
        >
          <MenuItem
            onClick={() => setActiveTags(new Set())}
            sx={{ fontStyle: activeTags.size === 0 ? "normal" : "normal" }}
          >
            <Checkbox checked={activeTags.size === 0} size="small" />
            <ListItemText primary="All" />
          </MenuItem>
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
          sx={{ bgcolor: "background.default" }}
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
          sx={{ bgcolor: "background.default" }}
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
    <Box component="main" sx={{ p: { xs: 2, md: 4 } }}>
      <Stack spacing={3}>
        {welcomeName !== null ? (
          <Alert severity="success" onClose={() => setWelcomeName(null)}>
            Welcome, {welcomeName}!
          </Alert>
        ) : null}
        {signedOut ? (
          <Alert severity="info" onClose={() => setSignedOut(false)}>
            Signed out.
          </Alert>
        ) : null}

        <Stack spacing={0.5} sx={{ alignItems: "center" }}>
          <Typography variant="pageTitle" component="h1" sx={{ textAlign: "center" }}>
            OUR TOYS
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: "center" }}>
            Everyone can browse, only members can borrow.
          </Typography>
        </Stack>

        {/* Mobile filter row */}
        <Stack
          spacing={2}
          sx={{ display: { xs: "flex", md: "none" }, bgcolor: "filterBar.main", p: 2, borderRadius: 1 }}
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
        <Box sx={{ display: "flex", gap: 4, alignItems: "stretch" }}>
          {/* Desktop sidebar */}
          <Box
            sx={{
              display: { xs: "none", md: "block" },
              width: (theme) => theme.layout.sidebarWidth,
              flexShrink: 0,
              bgcolor: "filterBar.main",
              p: 2,
              borderRadius: 1,
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
                      <Paper sx={{ p: 3, height: "100%", bgcolor: "toyCard.main", position: "relative" }} elevation={0}>
                        {isMember ? (
                          <IconButton
                            size="small"
                            onClick={(e) => handleToggleFavorite(e, toy.id)}
                            sx={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              zIndex: 1,
                              color: favoriteIds.has(toy.id) ? "error.main" : "text.disabled",
                              bgcolor: "background.paper",
                              "&:hover": { bgcolor: "background.paper" },
                              fontSize: "1.1rem",
                              lineHeight: 1,
                            }}
                          >
                            {favoriteIds.has(toy.id) ? "♥" : "♡"}
                          </IconButton>
                        ) : null}
                        <Stack spacing={1}>
                          {featuredImage !== null ? (
                            <Box sx={{ position: "relative" }}>
                              <Box
                                component="img"
                                src={featuredImage.image_url}
                                alt={toy.name}
                                sx={{
                                  width: "100%",
                                  aspectRatio: "1/1",
                                  objectFit: "cover",
                                  borderRadius: 1,
                                  display: "block",
                                }}
                              />
                              {isAuthenticated && (isInCart(toy.id) || !toy.is_available) ? (
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
                          {isMember && toy.is_available ? (
                            <Box onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} sx={{ display: "flex", justifyContent: "center" }}>
                              {isInCart(toy.id) ? (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={() => removeFromCart(toy.id)}
                                >
                                  Remove from cart
                                </Button>
                              ) : (
                                <Button
                                  size="small"
                                  variant="contained"
                                  disabled={cartIds.length >= 3}
                                  onClick={() => addToCart(toy.id)}
                                  sx={{ bgcolor: "cartAction.main", color: "cartAction.contrastText", "&:hover": { bgcolor: "cartAction.main" } }}
                                >
                                  {cartIds.length >= 3 ? "Cart full" : "Add to cart"}
                                </Button>
                              )}
                            </Box>
                          ) : null}
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
