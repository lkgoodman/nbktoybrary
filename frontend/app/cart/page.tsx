"use client";

import { useState } from "react";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../lib/AuthContext";
import { useCart } from "../lib/CartContext";
import { useToys, useCreateBorrowRequests, useTimeframes, queryKeys } from "../lib/queries";
import type { TimeframeRead, Toy, ToyImage } from "../lib/types";

function getFeaturedImage(toy: Toy): ToyImage | null {
  return toy.images.find((img: ToyImage) => img.is_featured) ?? toy.images[0] ?? null;
}

function formatTimeframeDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatTimeframeTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CartPage(): JSX.Element {
  const { token, isMember } = useAuth();
  const { cartIds, removeFromCart, clearCart } = useCart();
  const { data: allToys } = useToys();
  const { data: allTimeframes } = useTimeframes(token);
  const createBorrowRequests = useCreateBorrowRequests();
  const queryClient = useQueryClient();
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [selectedTimeframeId, setSelectedTimeframeId] = useState<string | null>(null);
  const [pickupCalendarMonth, setPickupCalendarMonth] = useState<Date>(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [selectedPickupDay, setSelectedPickupDay] = useState<{ year: number; month: number; day: number } | null>(null);
  const [returnDate, setReturnDate] = useState<string>("");
  const [selectedReturnTimeframeId, setSelectedReturnTimeframeId] = useState<string | null>(null);
  const [returnCalendarMonth, setReturnCalendarMonth] = useState<Date>(() => new Date());
  const [selectedReturnDay, setSelectedReturnDay] = useState<{ year: number; month: number; day: number } | null>(null);

  const cartToys: Toy[] = (allToys ?? []).filter((toy: Toy) => cartIds.includes(toy.id));

  const now = new Date();
  const availableTimeframes: TimeframeRead[] = (allTimeframes ?? []).filter((tf) => new Date(tf.start_time) > now);

  const selectedTimeframe = availableTimeframes.find((tf) => tf.id === selectedTimeframeId) ?? null;
  const pickupDate = selectedTimeframe !== null ? new Date(selectedTimeframe.start_time) : null;
  const maxReturnDate = pickupDate !== null
    ? new Date(pickupDate.getTime() + 28 * 24 * 60 * 60 * 1000)
    : null;
  const returnTimeframes: TimeframeRead[] = pickupDate !== null && maxReturnDate !== null
    ? (allTimeframes ?? []).filter((tf) => {
        const start = new Date(tf.start_time);
        return start > pickupDate && start <= maxReturnDate;
      })
    : [];

  // Pickup calendar
  const pickupDayKeys = new Set(availableTimeframes.map((tf) => {
    const d = new Date(tf.start_time);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }));
  const selectedDayPickupTimeframes: TimeframeRead[] = selectedPickupDay !== null
    ? availableTimeframes.filter((tf) => {
        const d = new Date(tf.start_time);
        return d.getFullYear() === selectedPickupDay.year &&
          d.getMonth() === selectedPickupDay.month &&
          d.getDate() === selectedPickupDay.day;
      })
    : [];

  // Build a set of date keys that have return timeframes available
  const returnDayKeys = new Set(returnTimeframes.map((tf) => {
    const d = new Date(tf.start_time);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }));

  // Timeframes for the selected return day
  const selectedDayReturnTimeframes: TimeframeRead[] = selectedReturnDay !== null
    ? returnTimeframes.filter((tf) => {
        const d = new Date(tf.start_time);
        return d.getFullYear() === selectedReturnDay.year &&
          d.getMonth() === selectedReturnDay.month &&
          d.getDate() === selectedReturnDay.day;
      })
    : [];

  function handlePickupSelect(id: string): void {
    setSelectedTimeframeId(id);
    setReturnDate("");
    setSelectedReturnTimeframeId(null);
    setSelectedReturnDay(null);
    const pickup = availableTimeframes.find((tf) => tf.id === id);
    if (pickup !== undefined) {
      const d = new Date(pickup.start_time);
      setReturnCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }

  function handleSubmit(): void {
    if (token === null || cartIds.length === 0 || selectedTimeframeId === null || selectedReturnTimeframeId === null || returnDate === "") return;
    createBorrowRequests.mutate(
      { toyIds: cartIds, timeframeId: selectedTimeframeId, returnDate, returnTimeframeId: selectedReturnTimeframeId, token },
      {
        onSuccess: () => {
          clearCart();
          void queryClient.invalidateQueries({ queryKey: queryKeys.borrowRequests.list() });
          setSubmitted(true);
        },
      },
    );
  }

  if (!isMember) {
    return (
      <Box component="main" sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
        <Typography variant="body1" color="text.secondary">
          Membership is required to check out toys.
        </Typography>
      </Box>
    );
  }

  if (submitted) {
    return (
      <Box component="main" sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
        <Stack spacing={3}>
          <Typography variant="pageTitle" component="h1">Request submitted</Typography>
          <Typography variant="body1" color="text.secondary">
            Your borrow request has been received.
          </Typography>
          <Box>
            <Button component={NextLink} href="/" variant="contained">Browse more toys</Button>
          </Box>
        </Stack>
      </Box>
    );
  }

  // Pickup calendar rendering
  const pickupCalYear = pickupCalendarMonth.getFullYear();
  const pickupCalMonth = pickupCalendarMonth.getMonth();
  const pickupFirstDayOfWeek = new Date(pickupCalYear, pickupCalMonth, 1).getDay();
  const pickupDaysInMonth = new Date(pickupCalYear, pickupCalMonth + 1, 0).getDate();
  const pickupCalCells: (number | null)[] = [
    ...Array<null>(pickupFirstDayOfWeek).fill(null),
    ...Array.from({ length: pickupDaysInMonth }, (_, i) => i + 1),
  ];
  while (pickupCalCells.length % 7 !== 0) pickupCalCells.push(null);

  // Return calendar rendering
  const calYear = returnCalendarMonth.getFullYear();
  const calMonth = returnCalendarMonth.getMonth();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const calCells: (number | null)[] = [
    ...Array<null>(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (calCells.length % 7 !== 0) calCells.push(null);

  return (
    <Box component="main" sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
      <Stack spacing={4}>
        <Typography variant="pageTitle" component="h1">Your cart</Typography>

        {cartIds.length === 0 ? (
          <Stack spacing={2}>
            <Typography variant="body1" color="text.secondary">Your cart is empty.</Typography>
            <Box>
              <Button component={NextLink} href="/" variant="contained">Browse toys</Button>
            </Box>
          </Stack>
        ) : cartToys.length === 0 ? (
          <Stack spacing={2}>
            <Typography variant="body1" color="text.secondary">
              Some toys in your cart are no longer available.
            </Typography>
            <Box>
              <Button variant="outlined" color="error" onClick={clearCart}>Clear cart</Button>
            </Box>
          </Stack>
        ) : (
          <>
            <Stack spacing={2}>
              {cartToys.map((toy: Toy) => {
                const image = getFeaturedImage(toy);
                return (
                <Paper key={toy.id} elevation={0} sx={{ p: 3 }}>
                  <Box sx={{ display: "grid", gridTemplateColumns: "64px 1fr auto", alignItems: "center", gap: 2 }}>
                    {image !== null ? (
                      <Box
                        component="img"
                        src={image.image_url}
                        alt={toy.name}
                        sx={{ width: 64, height: 64, objectFit: "cover", borderRadius: 1 }}
                      />
                    ) : <Box />}
                    <Typography variant="bodyStrong" sx={{ textAlign: "center" }}>{toy.name}</Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => removeFromCart(toy.id)}
                    >
                      Remove
                    </Button>
                  </Box>
                </Paper>
                );
              })}
            </Stack>

            <Divider />

            <Stack spacing={2}>
              <Typography variant="bodyStrong">Choose a pickup date and time</Typography>
              {availableTimeframes.length === 0 ? (
                <Typography variant="body1" color="text.secondary">
                  No pickup times are currently scheduled. Check back soon.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Button size="small" onClick={() => setPickupCalendarMonth(new Date(pickupCalYear, pickupCalMonth - 1, 1))}>← Prev</Button>
                    <Typography variant="bodyStrong">
                      {pickupCalendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                    </Typography>
                    <Button size="small" onClick={() => setPickupCalendarMonth(new Date(pickupCalYear, pickupCalMonth + 1, 1))}>Next →</Button>
                  </Stack>
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5 }}>
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                      <Typography key={d} variant="label" color="text.secondary" sx={{ textAlign: "center", py: 0.5 }}>{d}</Typography>
                    ))}
                    {pickupCalCells.map((day, i) => {
                      if (day === null) return <Box key={`pickup-empty-${i}`} />;
                      const key = `${pickupCalYear}-${pickupCalMonth}-${day}`;
                      const hasSlots = pickupDayKeys.has(key);
                      const isSelected = selectedPickupDay !== null &&
                        selectedPickupDay.year === pickupCalYear &&
                        selectedPickupDay.month === pickupCalMonth &&
                        selectedPickupDay.day === day;
                      return (
                        <Box
                          key={key}
                          onClick={() => {
                            if (!hasSlots) return;
                            setSelectedPickupDay(isSelected ? null : { year: pickupCalYear, month: pickupCalMonth, day });
                            setSelectedTimeframeId(null);
                            setReturnDate("");
                            setSelectedReturnTimeframeId(null);
                            setSelectedReturnDay(null);
                          }}
                          sx={{
                            minHeight: 44,
                            p: 0.75,
                            border: 1,
                            borderColor: isSelected ? "primary.main" : "divider",
                            borderRadius: 1,
                            bgcolor: isSelected ? "primary.light" : hasSlots ? "grey.50" : "grey.200",
                            cursor: hasSlots ? "pointer" : "default",
                            opacity: hasSlots ? 1 : 0.5,
                            "&:hover": hasSlots ? { borderColor: "primary.main" } : {},
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Typography variant="label" color={hasSlots ? "text.primary" : "text.disabled"} sx={{ fontWeight: isSelected ? 700 : 400 }}>
                            {day}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                  {selectedPickupDay !== null && selectedDayPickupTimeframes.length > 0 ? (
                    <Stack spacing={1} sx={{ pt: 1 }}>
                      <Typography variant="label" color="text.secondary">
                        Choose pickup window on {new Date(selectedPickupDay.year, selectedPickupDay.month, selectedPickupDay.day).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}:
                      </Typography>
                      {selectedDayPickupTimeframes.map((tf) => (
                        <Paper
                          key={tf.id}
                          elevation={0}
                          onClick={() => handlePickupSelect(tf.id)}
                          sx={{
                            p: 2,
                            cursor: "pointer",
                            border: 2,
                            borderColor: selectedTimeframeId === tf.id ? "primary.main" : "transparent",
                          }}
                        >
                          <Typography variant="body1">
                            {formatTimeframeTime(tf.start_time)} – {formatTimeframeTime(tf.end_time)}
                          </Typography>
                          {tf.notes !== null ? (
                            <Typography variant="label" color="text.secondary">{tf.notes}</Typography>
                          ) : null}
                        </Paper>
                      ))}
                    </Stack>
                  ) : null}
                </Stack>
              )}
            </Stack>

            <Divider />

            <Stack spacing={2}>
              <Typography variant="bodyStrong">Choose a return time</Typography>
              <Typography variant="label" color="text.secondary">
                Toys should be returned within 4 weeks of when they are picked up.
              </Typography>
              {selectedTimeframeId === null ? (
                <Typography variant="label" color="text.secondary">Select a pickup time above first.</Typography>
              ) : returnTimeframes.length === 0 ? (
                <Typography variant="label" color="text.secondary">No return times available within 28 days of your pickup. Check back soon.</Typography>
              ) : (
                <Stack spacing={1}>
                  {/* Calendar navigation */}
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Button size="small" onClick={() => setReturnCalendarMonth(new Date(calYear, calMonth - 1, 1))}>
                      ← Prev
                    </Button>
                    <Typography variant="bodyStrong">
                      {returnCalendarMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                    </Typography>
                    <Button size="small" onClick={() => setReturnCalendarMonth(new Date(calYear, calMonth + 1, 1))}>
                      Next →
                    </Button>
                  </Stack>

                  {/* Day-of-week headers */}
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5 }}>
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                      <Typography key={d} variant="label" color="text.secondary" sx={{ textAlign: "center", py: 0.5 }}>
                        {d}
                      </Typography>
                    ))}
                    {calCells.map((day, i) => {
                      if (day === null) return <Box key={`empty-${i}`} />;
                      const key = `${calYear}-${calMonth}-${day}`;
                      const hasSlots = returnDayKeys.has(key);
                      const isSelected =
                        selectedReturnDay !== null &&
                        selectedReturnDay.year === calYear &&
                        selectedReturnDay.month === calMonth &&
                        selectedReturnDay.day === day;
                      return (
                        <Box
                          key={key}
                          onClick={() => {
                            if (!hasSlots) return;
                            setSelectedReturnDay(isSelected ? null : { year: calYear, month: calMonth, day });
                            setSelectedReturnTimeframeId(null);
                            setReturnDate("");
                          }}
                          sx={{
                            minHeight: 44,
                            p: 0.75,
                            border: 1,
                            borderColor: isSelected ? "primary.main" : "divider",
                            borderRadius: 1,
                            bgcolor: isSelected ? "primary.light" : hasSlots ? "grey.50" : "grey.200",
                            cursor: hasSlots ? "pointer" : "default",
                            opacity: hasSlots ? 1 : 0.5,
                            "&:hover": hasSlots ? { borderColor: "primary.main" } : {},
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Typography
                            variant="label"
                            color={hasSlots ? "text.primary" : "text.disabled"}
                            sx={{ fontWeight: isSelected ? 700 : 400 }}
                          >
                            {day}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>

                  {/* Time slots for selected day */}
                  {selectedReturnDay !== null && selectedDayReturnTimeframes.length > 0 ? (
                    <Stack spacing={1} sx={{ pt: 1 }}>
                      <Typography variant="label" color="text.secondary">
                        Choose return window on {new Date(selectedReturnDay.year, selectedReturnDay.month, selectedReturnDay.day).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}:
                      </Typography>
                      {selectedDayReturnTimeframes.map((tf) => (
                        <Paper
                          key={tf.id}
                          elevation={0}
                          onClick={() => {
                            setSelectedReturnTimeframeId(tf.id);
                            setReturnDate(new Date(tf.start_time).toISOString().slice(0, 10));
                          }}
                          sx={{
                            p: 2,
                            cursor: "pointer",
                            border: 2,
                            borderColor: selectedReturnTimeframeId === tf.id ? "primary.main" : "transparent",
                          }}
                        >
                          <Typography variant="body1">
                            {formatTimeframeTime(tf.start_time)} – {formatTimeframeTime(tf.end_time)}
                          </Typography>
                          {tf.notes !== null ? (
                            <Typography variant="label" color="text.secondary">{tf.notes}</Typography>
                          ) : null}
                        </Paper>
                      ))}
                    </Stack>
                  ) : null}
                </Stack>
              )}
            </Stack>

            <Divider />

            <Stack spacing={1}>
              <Typography variant="label" color="text.secondary">
                {cartIds.length} of 5 toys selected
              </Typography>
              {createBorrowRequests.isError ? (
                <Typography variant="body1" color="error">
                  {createBorrowRequests.error.message}
                </Typography>
              ) : null}
              <Box>
                <Button
                  variant="contained"
                  disabled={createBorrowRequests.isPending || selectedTimeframeId === null || selectedReturnTimeframeId === null || availableTimeframes.length === 0}
                  onClick={handleSubmit}
                >
                  {createBorrowRequests.isPending ? "Submitting…" : "Submit borrow request"}
                </Button>
              </Box>
            </Stack>
          </>
        )}
      </Stack>
    </Box>
  );
}
