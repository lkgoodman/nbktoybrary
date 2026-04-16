"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useQueryClient } from "@tanstack/react-query";

import NextLink from "next/link";
import { useAuth } from "../lib/AuthContext";
import { useMembershipRequests, useUpdateMembershipRequest, useToys, useAdminBorrowRequests, useDeleteBorrowRequest, queryKeys } from "../lib/queries";
import type { BorrowRequestReadWithDetails, MembershipRequestRead, Toy } from "../lib/types";

export default function AdminPage(): JSX.Element {
  const { isAdmin, token, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<number>(searchParams.get("tab") === "inventory" ? 1 : 0);
  const [inventorySearch, setInventorySearch] = useState<string>("");
  const [inventoryTags, setInventoryTags] = useState<Set<string>>(new Set());
  const [inventoryAge, setInventoryAge] = useState<number | null>(null);
  const [inventoryLanguage, setInventoryLanguage] = useState<string | null>(null);

  const AGE_BUCKETS = [0, 1, 2, 3, 4, 5, 6, 7];
  const LANGUAGES: string[] = ["French", "Spanish"];

  function handleInventoryTagsChange(e: SelectChangeEvent<string[]>): void {
    const val = e.target.value;
    setInventoryTags(new Set(typeof val === "string" ? val.split(",") : val));
  }

  function handleInventoryAgeChange(e: SelectChangeEvent<string>): void {
    const val = e.target.value;
    setInventoryAge(val === "" ? null : Number(val));
  }

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      router.replace("/");
    }
  }, [isAuthenticated, isAdmin, router]);

  const { data: requests, isPending: requestsPending, isError: requestsError } = useMembershipRequests(token);
  const updateRequest = useUpdateMembershipRequest();
  const { data: toys, isPending: toysPending, isError: toysError } = useToys();
  const { data: borrowRequests, isPending: borrowPending, isError: borrowError } = useAdminBorrowRequests(token);
  const deleteBorrowRequest = useDeleteBorrowRequest();

  const allTags: string[] = toys
    ? [...new Set(toys.flatMap((toy: Toy) => toy.tags))].sort()
    : [];

  const normalizedInventorySearch = inventorySearch.trim().toLowerCase();
  const filteredToys: Toy[] = (toys ?? []).filter((toy: Toy) => {
    const searchMatch =
      normalizedInventorySearch === "" ||
      toy.name.toLowerCase().includes(normalizedInventorySearch) ||
      toy.description.toLowerCase().includes(normalizedInventorySearch);
    const tagMatch =
      inventoryTags.size === 0 || toy.tags.some((t: string) => inventoryTags.has(t));
    const ageMatch =
      inventoryAge === null || (toy.age_min !== null && toy.age_min <= inventoryAge);
    const languageMatch =
      inventoryLanguage === null || toy.language === inventoryLanguage;
    return searchMatch && tagMatch && ageMatch && languageMatch;
  });

  const pending = requests?.filter((r: MembershipRequestRead) => r.status === "pending") ?? [];
  const reviewed = requests?.filter((r: MembershipRequestRead) => r.status !== "pending") ?? [];

  function handleReview(id: string, status: "approved" | "denied"): void {
    if (token === null) return;
    updateRequest.mutate(
      { id, status, token },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.membershipRequests.list() });
        },
      },
    );
  }

  if (!isAuthenticated || !isAdmin) return <Box />;

  return (
    <Box component="main" sx={{ p: 4, maxWidth: 800, mx: "auto" }}>
      <Stack spacing={4}>
        <Typography variant="pageTitle" component="h1">
          Admin
        </Typography>

        <Tabs value={tab} onChange={(_e, v: number) => setTab(v)}>
          <Tab label="Membership requests" />
          <Tab label="Inventory" />
          <Tab label="Borrow requests" />
        </Tabs>

        {tab === 0 ? (
          <Stack spacing={2}>
            {requestsPending ? (
              <Typography variant="body1" color="text.secondary">Loading…</Typography>
            ) : requestsError ? (
              <Typography variant="body1" color="error">Failed to load requests.</Typography>
            ) : pending.length === 0 ? (
              <Typography variant="body1" color="text.secondary">No pending requests.</Typography>
            ) : (
              <Stack spacing={2}>
                {pending.map((req: MembershipRequestRead) => (
                  <Paper key={req.id} elevation={0} sx={{ p: 3 }}>
                    <Stack spacing={1}>
                      <Typography variant="bodyStrong">{req.user.name}</Typography>
                      <Typography variant="body1" color="text.secondary">{req.user.email}</Typography>
                      <Typography variant="label" color="text.secondary">
                        {req.user.address_line1}, {req.user.city}, {req.user.state} {req.user.zip}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
                        <Button
                          variant="contained"
                          size="small"
                          disabled={updateRequest.isPending}
                          onClick={() => handleReview(req.id, "approved")}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          disabled={updateRequest.isPending}
                          onClick={() => handleReview(req.id, "denied")}
                        >
                          Deny
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}

            {reviewed.length > 0 ? (
              <>
                <Divider />
                <Typography variant="label" color="text.secondary">Previously reviewed</Typography>
                <Stack spacing={2}>
                  {reviewed.map((req: MembershipRequestRead) => (
                    <Paper key={req.id} elevation={0} sx={{ p: 3 }}>
                      <Stack spacing={0.5}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Typography variant="bodyStrong">{req.user.name}</Typography>
                          <Typography
                            variant="label"
                            color={req.status === "approved" ? "success.main" : "error.main"}
                          >
                            {req.status}
                          </Typography>
                        </Stack>
                        <Typography variant="body1" color="text.secondary">{req.user.email}</Typography>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </>
            ) : null}
          </Stack>
        ) : tab === 1 ? (
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
              <TextField
                label="Search"
                size="small"
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                sx={{ flex: 1, minWidth: 160 }}
              />
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  multiple
                  label="Category"
                  value={[...inventoryTags]}
                  onChange={handleInventoryTagsChange}
                  renderValue={(selected: string[]) => selected.join(", ")}
                >
                  {allTags.map((tag: string) => (
                    <MenuItem key={tag} value={tag}>
                      <Checkbox checked={inventoryTags.has(tag)} size="small" />
                      <ListItemText primary={tag} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 100 }}>
                <InputLabel>Age</InputLabel>
                <Select
                  label="Age"
                  value={inventoryAge !== null ? String(inventoryAge) : ""}
                  onChange={handleInventoryAgeChange}
                >
                  <MenuItem value="">Any</MenuItem>
                  {AGE_BUCKETS.map((age: number) => (
                    <MenuItem key={age} value={String(age)}>{age}+</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Language</InputLabel>
                <Select
                  label="Language"
                  value={inventoryLanguage ?? ""}
                  onChange={(e) => setInventoryLanguage(e.target.value === "" ? null : e.target.value)}
                >
                  <MenuItem value="">Any</MenuItem>
                  {LANGUAGES.map((lang: string) => (
                    <MenuItem key={lang} value={lang}>{lang}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button component={NextLink} href="/admin/toys/new" variant="contained">
                Create toy
              </Button>
            </Stack>
            {toysPending ? (
              <Typography variant="body1" color="text.secondary">Loading…</Typography>
            ) : toysError ? (
              <Typography variant="body1" color="error">Failed to load toys.</Typography>
            ) : filteredToys.length === 0 ? (
              <Typography variant="body1" color="text.secondary">No toys match the selected filters.</Typography>
            ) : (
              <Stack spacing={1}>
                {filteredToys.map((toy: Toy) => (
                    <Paper key={toy.id} elevation={0} sx={{ p: 3 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                        <Stack spacing={0.5}>
                          <Typography variant="bodyStrong">{toy.name}</Typography>
                          {toy.brand !== null ? (
                            <Typography variant="body1" color="text.secondary">{toy.brand}</Typography>
                          ) : null}
                        </Stack>
                        <Button
                          component={NextLink}
                          href={`/admin/toys/${toy.id}/edit`}
                          variant="outlined"
                          size="small"
                        >
                          Edit
                        </Button>
                      </Stack>
                    </Paper>
                  ))}
              </Stack>
            )}
          </Stack>
        ) : (
          <Stack spacing={2}>
            {borrowPending ? (
              <Typography variant="body1" color="text.secondary">Loading…</Typography>
            ) : borrowError ? (
              <Typography variant="body1" color="error">Failed to load borrow requests.</Typography>
            ) : (borrowRequests ?? []).length === 0 ? (
              <Typography variant="body1" color="text.secondary">No pending borrow requests.</Typography>
            ) : (
              <Stack spacing={2}>
                {(borrowRequests ?? []).map((req: BorrowRequestReadWithDetails) => (
                  <Paper key={req.id} elevation={0} sx={{ p: 3 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                      <Stack spacing={0.5}>
                        <Typography variant="bodyStrong">{req.toy_name}</Typography>
                        <Typography variant="body1" color="text.secondary">Requested by {req.member_name}</Typography>
                        <Typography variant="label" color="text.secondary">
                          {new Date(req.created_at).toLocaleDateString()}
                        </Typography>
                      </Stack>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        disabled={deleteBorrowRequest.isPending}
                        onClick={() =>
                          token !== null &&
                          deleteBorrowRequest.mutate(
                            { id: req.id, token },
                            {
                              onSuccess: () => {
                                void queryClient.invalidateQueries({ queryKey: queryKeys.borrowRequests.adminList() });
                                void queryClient.invalidateQueries({ queryKey: queryKeys.toys.list() });
                              },
                            },
                          )
                        }
                      >
                        Deny
                      </Button>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
