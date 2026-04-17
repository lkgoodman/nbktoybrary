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
import { useMembershipRequests, useUpdateMembershipRequest, useToys, useAdminBorrowRequests, useTimeframes, useCreateTimeframe, useDeleteTimeframe, useUsers, queryKeys } from "../lib/queries";
import type { BorrowRequestReadWithDetails, MembershipRequestRead, TimeframeRead, Toy, ToyImage, UserRead } from "../lib/types";

export default function AdminPage(): JSX.Element {
  const { isAdmin, token, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<number>(
    searchParams.get("tab") === "borrow" ? 1 : searchParams.get("tab") === "membership" ? 2 : searchParams.get("tab") === "members" ? 3 : searchParams.get("tab") === "pickup" ? 4 : 0
  );
  const [inventorySearch, setInventorySearch] = useState<string>("");
  const [inventoryTags, setInventoryTags] = useState<Set<string>>(new Set());
  const [inventoryAge, setInventoryAge] = useState<number | null>(null);
  const [inventoryLanguage, setInventoryLanguage] = useState<string | null>(null);
  const [inventoryAvailability, setInventoryAvailability] = useState<"available" | "checked_out" | null>(null);
  const [newTfDate, setNewTfDate] = useState<string>("");
  const [newTfStartHour, setNewTfStartHour] = useState<string>("");
  const [newTfEndHour, setNewTfEndHour] = useState<string>("");
  const [newTfNotes, setNewTfNotes] = useState<string>("");
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<{ year: number; month: number; day: number } | null>(null);

  const AGE_BUCKETS: { label: string; age: number }[] = [
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
  const LANGUAGES: string[] = ["French", "Spanish"];

  function handleInventoryTagsChange(e: SelectChangeEvent<string[]>): void {
    const val = e.target.value;
    setInventoryTags(new Set(typeof val === "string" ? val.split(",") : val));
  }

  function handleInventoryAgeChange(e: SelectChangeEvent<string>): void {
    const val = e.target.value;
    setInventoryAge(val === "" ? null : AGE_BUCKETS.find((b) => b.label === val)?.age ?? null);
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
  const { data: timeframes, isPending: timeframesPending, isError: timeframesError } = useTimeframes(token);
  const { data: users, isPending: usersPending, isError: usersError } = useUsers(token);
  const createTimeframe = useCreateTimeframe();
  const deleteTimeframe = useDeleteTimeframe();

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
    const availabilityMatch =
      inventoryAvailability === null ||
      (inventoryAvailability === "available" && toy.is_available) ||
      (inventoryAvailability === "checked_out" && !toy.is_available);
    return searchMatch && tagMatch && ageMatch && languageMatch && availabilityMatch;
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
    <Box component="main" sx={{ p: 4, maxWidth: 1100, mx: "auto" }}>
      <Stack spacing={4}>
        <Typography variant="pageTitle" component="h1">
          Admin
        </Typography>

        <Stack direction="row" spacing={4} alignItems="flex-start">
          <Tabs
            value={tab}
            onChange={(_e, v: number) => setTab(v)}
            orientation="vertical"
            sx={{ borderRight: 1, borderColor: "divider", minWidth: 180, flexShrink: 0 }}
          >
            <Tab label="Inventory" sx={{ alignItems: "flex-start" }} />
            <Tab label="Borrow requests" sx={{ alignItems: "flex-start" }} />
            <Tab label="Membership requests" sx={{ alignItems: "flex-start" }} />
            <Tab label="Members" sx={{ alignItems: "flex-start" }} />
            <Tab label="Open hours" sx={{ alignItems: "flex-start" }} />
          </Tabs>
          <Box sx={{ flex: 1, minWidth: 0 }}>

        {tab === 2 ? (
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
        ) : tab === 0 ? (
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
                  value={inventoryAge !== null ? (AGE_BUCKETS.find((b) => b.age === inventoryAge)?.label ?? "") : ""}
                  onChange={handleInventoryAgeChange}
                >
                  <MenuItem value="">Any</MenuItem>
                  {AGE_BUCKETS.map((b) => (
                    <MenuItem key={b.label} value={b.label}>{b.label}</MenuItem>
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
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Availability</InputLabel>
                <Select
                  label="Availability"
                  value={inventoryAvailability ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setInventoryAvailability(val === "" ? null : val as "available" | "checked_out");
                  }}
                >
                  <MenuItem value="">Any</MenuItem>
                  <MenuItem value="available">Available</MenuItem>
                  <MenuItem value="checked_out">Checked out</MenuItem>
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
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(1, 1fr)",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(3, 1fr)",
                  },
                  gap: 2,
                }}
              >
                {filteredToys.map((toy: Toy) => {
                  const featured = toy.images.find((img: ToyImage) => img.is_featured) ?? toy.images[0] ?? null;
                  return (
                    <Paper key={toy.id} elevation={0} sx={{ p: 2, height: "100%" }}>
                      <Stack spacing={1} sx={{ height: "100%" }}>
                        {featured !== null ? (
                          <Box
                            component="img"
                            src={featured.image_url}
                            alt={toy.name}
                            sx={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: 1 }}
                          />
                        ) : (
                          <Box sx={{ width: "100%", aspectRatio: "1/1", bgcolor: "grey.100", borderRadius: 1 }} />
                        )}
                        <Typography variant="bodyStrong" sx={{ flex: 1 }}>{toy.name}</Typography>
                        <Button
                          component={NextLink}
                          href={`/admin/toys/${toy.id}/edit`}
                          variant="outlined"
                          size="small"
                          fullWidth
                        >
                          Edit
                        </Button>
                      </Stack>
                    </Paper>
                  );
                })}
              </Box>
            )}
          </Stack>
        ) : tab === 1 ? (
          <Stack spacing={2}>
            {borrowPending ? (
              <Typography variant="body1" color="text.secondary">Loading…</Typography>
            ) : borrowError ? (
              <Typography variant="body1" color="error">Failed to load borrow requests.</Typography>
            ) : (() => {
              const batches = Object.values(
                (borrowRequests ?? []).reduce<Record<string, BorrowRequestReadWithDetails[]>>(
                  (groups, req) => {
                    const key = req.batch_id;
                    return { ...groups, [key]: [...(groups[key] ?? []), req] };
                  },
                  {},
                )
              ).sort((a, b) => new Date(b[0].created_at).getTime() - new Date(a[0].created_at).getTime());

              const pendingBatches = batches.filter((b) => b.some((r) => r.status === "pending"));
              const resolvedBatches = batches.filter((b) => b.every((r) => r.status !== "pending"));

              function BatchCard({ batch }: { batch: BorrowRequestReadWithDetails[] }): JSX.Element {
                const pendingCount = batch.filter((r) => r.status === "pending").length;
                const approvedCount = batch.filter((r) => r.status === "approved").length;
                const pickup = batch[0].pickup_start;
                let statusLabel: string;
                if (pendingCount > 0) {
                  statusLabel = `${pendingCount} pending`;
                } else if (approvedCount === batch.length) {
                  statusLabel = "all approved";
                } else if (approvedCount === 0) {
                  statusLabel = "all denied";
                } else {
                  statusLabel = `${approvedCount} approved, ${batch.length - approvedCount} denied`;
                }
                return (
                  <Paper key={batch[0].batch_id} elevation={0} sx={{ p: 3 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Stack spacing={0.5}>
                        <Typography variant="bodyStrong">{batch[0].member_name}</Typography>
                        <Typography variant="label" color="text.secondary">
                          {new Date(batch[0].created_at).toLocaleDateString()} · {statusLabel}
                        </Typography>
                        {pickup !== null ? (
                          <Typography variant="label" color="text.secondary">
                            Pickup: {new Date(pickup).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                          </Typography>
                        ) : null}
                      </Stack>
                      <Button
                        component={NextLink}
                        href={`/admin/borrow-requests/${batch[0].batch_id}`}
                        variant="outlined"
                        size="small"
                      >
                        View
                      </Button>
                    </Stack>
                  </Paper>
                );
              }

              if (batches.length === 0) {
                return <Typography variant="body1" color="text.secondary">No borrow requests.</Typography>;
              }

              return (
                <Stack spacing={2}>
                  {pendingBatches.length > 0 ? (
                    <Stack spacing={1}>
                      {pendingBatches.map((batch) => <BatchCard key={batch[0].batch_id} batch={batch} />)}
                    </Stack>
                  ) : (
                    <Typography variant="body1" color="text.secondary">No pending borrow requests.</Typography>
                  )}
                  {resolvedBatches.length > 0 ? (
                    <>
                      <Divider />
                      <Typography variant="label" color="text.secondary">Resolved</Typography>
                      <Stack spacing={1}>
                        {resolvedBatches.map((batch) => <BatchCard key={batch[0].batch_id} batch={batch} />)}
                      </Stack>
                    </>
                  ) : null}
                </Stack>
              );
            })()}
          </Stack>
        ) : tab === 3 ? (
          <Stack spacing={2}>
            {usersPending ? (
              <Typography variant="body1" color="text.secondary">Loading…</Typography>
            ) : usersError ? (
              <Typography variant="body1" color="error">Failed to load members.</Typography>
            ) : (
              <Stack spacing={1}>
                {(users ?? []).filter((u: UserRead) => u.roles.includes("member")).map((u: UserRead) => (
                  <Paper key={u.id} elevation={0} sx={{ p: 2 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Stack spacing={0.25}>
                        <Typography variant="bodyStrong">{u.name}</Typography>
                        <Typography variant="body1" color="text.secondary">{u.email}</Typography>
                      </Stack>
                      <Button
                        component={NextLink}
                        href={`/admin/members/${u.id}`}
                        variant="outlined"
                        size="small"
                      >
                        View profile
                      </Button>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
          </Stack>
        ) : tab === 4 ? (
          <Stack spacing={3}>
            <Stack spacing={2}>
              <Typography variant="bodyStrong">Add open hours</Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="flex-end">
                <TextField
                  label="Date"
                  type="date"
                  size="small"
                  slotProps={{
                    inputLabel: { shrink: true },
                    htmlInput: { min: new Date().toISOString().slice(0, 10) },
                  }}
                  value={newTfDate}
                  onChange={(e) => setNewTfDate(e.target.value)}
                  sx={{ minWidth: 160 }}
                />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Start time</InputLabel>
                  <Select
                    label="Start time"
                    value={newTfStartHour}
                    onChange={(e) => setNewTfStartHour(e.target.value)}
                  >
                    {Array.from({ length: 15 }, (_, i) => i + 7).map((h) => (
                      <MenuItem key={h} value={String(h)}>
                        {new Date(2000, 0, 1, h).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>End time</InputLabel>
                  <Select
                    label="End time"
                    value={newTfEndHour}
                    onChange={(e) => setNewTfEndHour(e.target.value)}
                  >
                    {Array.from({ length: 15 }, (_, i) => i + 7).map((h) => (
                      <MenuItem key={h} value={String(h)}>
                        {new Date(2000, 0, 1, h).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Notes (optional)"
                  size="small"
                  value={newTfNotes}
                  onChange={(e) => setNewTfNotes(e.target.value)}
                  sx={{ minWidth: 180 }}
                />
                <Button
                  variant="contained"
                  disabled={newTfDate === "" || newTfStartHour === "" || newTfEndHour === "" || createTimeframe.isPending}
                  onClick={() => {
                    if (token === null || newTfDate === "" || newTfStartHour === "" || newTfEndHour === "") return;
                    const startHour = newTfStartHour.padStart(2, "0");
                    const endHour = newTfEndHour.padStart(2, "0");
                    createTimeframe.mutate(
                      {
                        payload: {
                          start_time: `${newTfDate}T${startHour}:00`,
                          end_time: `${newTfDate}T${endHour}:00`,
                          notes: newTfNotes.trim() === "" ? null : newTfNotes.trim(),
                        },
                        token,
                      },
                      {
                        onSuccess: () => {
                          void queryClient.invalidateQueries({ queryKey: queryKeys.timeframes.list() });
                          setNewTfDate("");
                          setNewTfStartHour("");
                          setNewTfEndHour("");
                          setNewTfNotes("");
                        },
                      },
                    );
                  }}
                >
                  Add
                </Button>
              </Stack>
              {createTimeframe.isError ? (
                <Typography variant="body1" color="error">{createTimeframe.error.message}</Typography>
              ) : null}
            </Stack>

            <Divider />

            {timeframesPending ? (
              <Typography variant="body1" color="text.secondary">Loading…</Typography>
            ) : timeframesError ? (
              <Typography variant="body1" color="error">Failed to load pickup times.</Typography>
            ) : (() => {
              const year = calendarMonth.getFullYear();
              const month = calendarMonth.getMonth();
              const firstDayOfWeek = new Date(year, month, 1).getDay();
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const cells: (number | null)[] = [
                ...Array<null>(firstDayOfWeek).fill(null),
                ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
              ];
              while (cells.length % 7 !== 0) cells.push(null);

              const tfByDay = new Map<string, TimeframeRead[]>();
              (timeframes ?? []).forEach((tf) => {
                const d = new Date(tf.start_time);
                const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                tfByDay.set(key, [...(tfByDay.get(key) ?? []), tf]);
              });

              const today = new Date();

              return (
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Button
                      size="small"
                      onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
                    >
                      ← Prev
                    </Button>
                    <Typography variant="bodyStrong">
                      {calendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
                    >
                      Next →
                    </Button>
                  </Stack>

                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5 }}>
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                      <Typography key={d} variant="label" color="text.secondary" sx={{ textAlign: "center", py: 0.5 }}>
                        {d}
                      </Typography>
                    ))}
                    {cells.map((day, i) => {
                      if (day === null) {
                        return <Box key={`empty-${i}`} />;
                      }
                      const key = `${year}-${month}-${day}`;
                      const dayTfs = tfByDay.get(key) ?? [];
                      const isToday =
                        today.getFullYear() === year &&
                        today.getMonth() === month &&
                        today.getDate() === day;
                      const isSelected =
                        selectedCalendarDay !== null &&
                        selectedCalendarDay.year === year &&
                        selectedCalendarDay.month === month &&
                        selectedCalendarDay.day === day;
                      return (
                        <Box
                          key={key}
                          onClick={() => setSelectedCalendarDay(isSelected ? null : { year, month, day })}
                          sx={{
                            minHeight: 80,
                            p: 0.75,
                            border: 1,
                            borderColor: isSelected ? "secondary.main" : isToday ? "primary.main" : "divider",
                            borderRadius: 1,
                            bgcolor: isSelected ? "secondary.light" : "grey.50",
                            cursor: "pointer",
                            "&:hover": { borderColor: "secondary.main" },
                          }}
                        >
                          <Typography
                            variant="label"
                            color={isToday ? "primary.main" : "text.primary"}
                            sx={{ fontWeight: isToday ? 700 : 400 }}
                          >
                            {day}
                          </Typography>
                          <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                            {dayTfs.map((tf) => (
                              <Stack key={tf.id} direction="row" alignItems="center" justifyContent="space-between" spacing={0.5}>
                                <Typography variant="label" color="primary.main" sx={{ fontSize: "0.65rem", lineHeight: 1.2 }}>
                                  {new Date(tf.start_time).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                                  {" – "}
                                  {new Date(tf.end_time).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                                </Typography>
                                <Box
                                  component="button"
                                  disabled={deleteTimeframe.isPending}
                                  onClick={() => {
                                    if (token === null) return;
                                    deleteTimeframe.mutate(
                                      { id: tf.id, token },
                                      {
                                        onSuccess: () => {
                                          void queryClient.invalidateQueries({ queryKey: queryKeys.timeframes.list() });
                                        },
                                      },
                                    );
                                  }}
                                  sx={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "error.main",
                                    fontSize: "0.7rem",
                                    p: 0,
                                    lineHeight: 1,
                                    flexShrink: 0,
                                    "&:disabled": { opacity: 0.4, cursor: "default" },
                                  }}
                                >
                                  ×
                                </Box>
                              </Stack>
                            ))}
                          </Stack>
                        </Box>
                      );
                    })}
                  </Box>

                  {selectedCalendarDay !== null ? (() => {
                    const dayRequests = (borrowRequests ?? []).filter((r) => {
                      if (r.pickup_start === null) return false;
                      const d = new Date(r.pickup_start);
                      return d.getFullYear() === selectedCalendarDay.year &&
                        d.getMonth() === selectedCalendarDay.month &&
                        d.getDate() === selectedCalendarDay.day;
                    });
                    const batches = Object.values(
                      dayRequests.reduce<Record<string, BorrowRequestReadWithDetails[]>>(
                        (groups, req) => {
                          const k = req.batch_id;
                          return { ...groups, [k]: [...(groups[k] ?? []), req] };
                        },
                        {},
                      )
                    );
                    const label = new Date(
                      selectedCalendarDay.year,
                      selectedCalendarDay.month,
                      selectedCalendarDay.day,
                    ).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
                    return (
                      <Stack spacing={1} sx={{ mt: 1 }}>
                        <Divider />
                        <Typography variant="bodyStrong">{label}</Typography>
                        {batches.length === 0 ? (
                          <Typography variant="body1" color="text.secondary">No pickup requests for this day.</Typography>
                        ) : (
                          <Stack spacing={1}>
                            {batches.map((batch) => (
                              <Paper key={batch[0].batch_id} elevation={0} sx={{ p: 2 }}>
                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                  <Stack spacing={0.5}>
                                    <Typography variant="bodyStrong">{batch[0].member_name}</Typography>
                                    <Typography variant="label" color="text.secondary">
                                      {batch.map((r) => r.toy_name).join(", ")}
                                    </Typography>
                                    <Typography variant="label" color="text.secondary">
                                      {batch.filter((r) => r.status === "pending").length > 0
                                        ? `${batch.filter((r) => r.status === "pending").length} pending`
                                        : batch.every((r) => r.status === "approved")
                                        ? "all approved"
                                        : "resolved"}
                                    </Typography>
                                  </Stack>
                                  <Button
                                    component={NextLink}
                                    href={`/admin/borrow-requests/${batch[0].batch_id}`}
                                    variant="outlined"
                                    size="small"
                                  >
                                    View
                                  </Button>
                                </Stack>
                              </Paper>
                            ))}
                          </Stack>
                        )}
                      </Stack>
                    );
                  })() : null}
                </Stack>
              );
            })()}
          </Stack>
        ) : null}

          </Box>
        </Stack>
      </Stack>
    </Box>
  );
}
