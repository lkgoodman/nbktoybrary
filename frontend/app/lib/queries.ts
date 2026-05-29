import { useMutation, useQuery, type UseMutationResult, type UseQueryResult } from "@tanstack/react-query";

import { addFavorite, checkinCheckout, createBorrowRequests, createCheckout, createMembership, createTimeframe, createToy, deleteBorrowRequest, deleteToy, deleteUser, updateBorrowRequest, deleteTimeframe, deleteToyImage, fetchSettings, getToy, getUser, listAdminBorrowRequests, listBorrowRequests, listCheckouts, listFavorites, listMemberships, listMembershipRequests, listTimeframes, listToys, listUsers, login, registerUser, removeFavorite, resetUserPassword, setFeaturedImage, updateMembershipRequest, updateMembershipStanding, updateSettings, updateToy, updateUser, uploadToyImage } from "./api";
import type { BorrowRequestRead, BorrowRequestReadWithDetails, CheckoutRead, FavoriteRead, MembershipRead, MembershipRequestRead, RegisterRequest, SiteSettingsRead, TimeframeCreate, TimeframeRead, TokenResponse, Toy, ToyCreate, ToyImage, ToyUpdate, UserRead, UserUpdate } from "./types";


export const queryKeys = {
  settings: {
    all: ["settings"] as const,
    get: () => [...queryKeys.settings.all] as const,
  },
  checkouts: {
    all: ["checkouts"] as const,
    list: (params?: { toyId?: string; returned?: boolean }) => ["checkouts", "list", params] as const,
  },
  memberships: {
    all: ["memberships"] as const,
    byUser: (userId: string) => ["memberships", "user", userId] as const,
  },
  users: {
    all: ["users"] as const,
    list: () => [...queryKeys.users.all, "list"] as const,
    detail: (id: string) => [...queryKeys.users.all, "detail", id] as const,
  },
  toys: {
    all: ["toys"] as const,
    list: () => [...queryKeys.toys.all, "list"] as const,
    detail: (id: string) => [...queryKeys.toys.all, "detail", id] as const,
  },
  membershipRequests: {
    all: ["membership-requests"] as const,
    list: () => [...queryKeys.membershipRequests.all, "list"] as const,
  },
  borrowRequests: {
    all: ["borrow-requests"] as const,
    list: () => [...queryKeys.borrowRequests.all, "list"] as const,
    adminList: () => [...queryKeys.borrowRequests.all, "admin-list"] as const,
  },
  timeframes: {
    all: ["timeframes"] as const,
    list: () => [...queryKeys.timeframes.all, "list"] as const,
  },
  favorites: {
    all: ["favorites"] as const,
    list: () => [...queryKeys.favorites.all, "list"] as const,
  },
} as const;

export function useUsers(token: string | null): UseQueryResult<UserRead[], Error> {
  return useQuery<UserRead[], Error>({
    queryKey: queryKeys.users.list(),
    queryFn: () => listUsers(token!),
    enabled: token !== null,
  });
}

export function useUser(id: string, token: string | null): UseQueryResult<UserRead, Error> {
  return useQuery<UserRead, Error>({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => getUser(id, token!),
    enabled: token !== null,
  });
}

export function useToys(token?: string | null, options?: { enabled?: boolean }): UseQueryResult<Toy[], Error> {
  return useQuery<Toy[], Error>({
    queryKey: [...queryKeys.toys.list(), token ?? null],
    queryFn: () => listToys(token ?? undefined),
    enabled: options?.enabled !== false,
  });
}

export function useToy(id: string, token?: string | null, options?: { enabled?: boolean }): UseQueryResult<Toy, Error> {
  return useQuery<Toy, Error>({
    queryKey: [...queryKeys.toys.detail(id), token ?? null],
    queryFn: () => getToy(id, token ?? undefined),
    enabled: options?.enabled !== false,
  });
}

export function useLogin(): UseMutationResult<
  TokenResponse,
  Error,
  { email: string; password: string }
> {
  return useMutation<TokenResponse, Error, { email: string; password: string }>({
    mutationFn: ({ email, password }) => login(email, password),
  });
}

export function useRegister(): UseMutationResult<UserRead, Error, RegisterRequest> {
  return useMutation<UserRead, Error, RegisterRequest>({
    mutationFn: registerUser,
  });
}

export function useUploadToyImage(): UseMutationResult<ToyImage, Error, { toyId: string; file: File; token: string }> {
  return useMutation<ToyImage, Error, { toyId: string; file: File; token: string }>({
    mutationFn: ({ toyId, file, token }) => uploadToyImage(toyId, file, token),
  });
}

export function useSetFeaturedImage(): UseMutationResult<ToyImage, Error, { imageId: string; token: string }> {
  return useMutation<ToyImage, Error, { imageId: string; token: string }>({
    mutationFn: ({ imageId, token }) => setFeaturedImage(imageId, token),
  });
}

export function useDeleteToyImage(): UseMutationResult<void, Error, { imageId: string; token: string }> {
  return useMutation<void, Error, { imageId: string; token: string }>({
    mutationFn: ({ imageId, token }) => deleteToyImage(imageId, token),
  });
}

export function useCreateToy(): UseMutationResult<Toy, Error, { payload: ToyCreate; token: string }> {
  return useMutation<Toy, Error, { payload: ToyCreate; token: string }>({
    mutationFn: ({ payload, token }) => createToy(payload, token),
  });
}

export function useDeleteToy(): UseMutationResult<void, Error, { id: string; token: string }> {
  return useMutation<void, Error, { id: string; token: string }>({
    mutationFn: ({ id, token }) => deleteToy(id, token),
  });
}

export function useUpdateToy(): UseMutationResult<Toy, Error, { id: string; payload: ToyUpdate; token: string }> {
  return useMutation<Toy, Error, { id: string; payload: ToyUpdate; token: string }>({
    mutationFn: ({ id, payload, token }) => updateToy(id, payload, token),
  });
}

export function useMembershipRequests(token: string | null): UseQueryResult<MembershipRequestRead[], Error> {
  return useQuery<MembershipRequestRead[], Error>({
    queryKey: queryKeys.membershipRequests.list(),
    queryFn: () => listMembershipRequests(token!),
    enabled: token !== null,
  });
}

export function useBorrowRequests(token: string | null): UseQueryResult<BorrowRequestRead[], Error> {
  return useQuery<BorrowRequestRead[], Error>({
    queryKey: queryKeys.borrowRequests.list(),
    queryFn: () => listBorrowRequests(token!),
    enabled: token !== null,
  });
}

export function useAdminBorrowRequests(token: string | null): UseQueryResult<BorrowRequestReadWithDetails[], Error> {
  return useQuery<BorrowRequestReadWithDetails[], Error>({
    queryKey: queryKeys.borrowRequests.adminList(),
    queryFn: () => listAdminBorrowRequests(token!),
    enabled: token !== null,
  });
}

export function useUpdateBorrowRequest(): UseMutationResult<BorrowRequestRead, Error, { id: string; status: "pending" | "approved" | "denied"; token: string; denialNote?: string }> {
  return useMutation<BorrowRequestRead, Error, { id: string; status: "pending" | "approved" | "denied"; token: string; denialNote?: string }>({
    mutationFn: ({ id, status, token, denialNote }) => updateBorrowRequest(id, status, token, denialNote),
  });
}

export function useCancelBorrowRequest(): UseMutationResult<void, Error, { id: string; token: string }> {
  return useMutation<void, Error, { id: string; token: string }>({
    mutationFn: ({ id, token }) => deleteBorrowRequest(id, token),
  });
}

export function useCreateBorrowRequests(): UseMutationResult<BorrowRequestRead[], Error, { toyIds: string[]; timeframeId: string; returnDate: string; returnTimeframeId: string; token: string }> {
  return useMutation<BorrowRequestRead[], Error, { toyIds: string[]; timeframeId: string; returnDate: string; returnTimeframeId: string; token: string }>({
    mutationFn: ({ toyIds, timeframeId, returnDate, returnTimeframeId, token }) => createBorrowRequests(toyIds, timeframeId, returnDate, returnTimeframeId, token),
  });
}

export function useTimeframes(token?: string | null): UseQueryResult<TimeframeRead[], Error> {
  return useQuery<TimeframeRead[], Error>({
    queryKey: queryKeys.timeframes.list(),
    queryFn: () => listTimeframes(token ?? undefined),
  });
}

export function useCreateTimeframe(): UseMutationResult<TimeframeRead, Error, { payload: TimeframeCreate; token: string }> {
  return useMutation<TimeframeRead, Error, { payload: TimeframeCreate; token: string }>({
    mutationFn: ({ payload, token }) => createTimeframe(payload, token),
  });
}

export function useDeleteTimeframe(): UseMutationResult<void, Error, { id: string; token: string }> {
  return useMutation<void, Error, { id: string; token: string }>({
    mutationFn: ({ id, token }) => deleteTimeframe(id, token),
  });
}

export function useMembershipsByUser(userId: string, token: string | null): UseQueryResult<MembershipRead[], Error> {
  return useQuery<MembershipRead[], Error>({
    queryKey: queryKeys.memberships.byUser(userId),
    queryFn: () => listMemberships(token!, userId),
    enabled: token !== null,
  });
}

export function useCreateMembership(): UseMutationResult<MembershipRead, Error, { userId: string; token: string }> {
  return useMutation<MembershipRead, Error, { userId: string; token: string }>({
    mutationFn: ({ userId, token }) => createMembership(userId, token),
  });
}

export function useUpdateMembershipStanding(): UseMutationResult<
  MembershipRead,
  Error,
  { id: string; accountStanding: "active" | "banned" | "temporary_hold"; token: string }
> {
  return useMutation<MembershipRead, Error, { id: string; accountStanding: "active" | "banned" | "temporary_hold"; token: string }>({
    mutationFn: ({ id, accountStanding, token }) => updateMembershipStanding(id, accountStanding, token),
  });
}

export function useCheckouts(token: string | null, params?: { toyId?: string; returned?: boolean }): UseQueryResult<CheckoutRead[], Error> {
  return useQuery<CheckoutRead[], Error>({
    queryKey: queryKeys.checkouts.list(params),
    queryFn: () => listCheckouts(token!, params),
    enabled: token !== null,
  });
}

export function useCreateCheckout(): UseMutationResult<CheckoutRead, Error, { requestId: string; token: string }> {
  return useMutation<CheckoutRead, Error, { requestId: string; token: string }>({
    mutationFn: ({ requestId, token }) => createCheckout(requestId, token),
  });
}

export function useCheckinCheckout(): UseMutationResult<CheckoutRead, Error, { id: string; token: string }> {
  return useMutation<CheckoutRead, Error, { id: string; token: string }>({
    mutationFn: ({ id, token }) => checkinCheckout(id, token),
  });
}

export function useUpdateMembershipRequest(): UseMutationResult<
  MembershipRequestRead,
  Error,
  { id: string; status: "approved" | "denied"; token: string }
> {
  return useMutation<MembershipRequestRead, Error, { id: string; status: "approved" | "denied"; token: string }>({
    mutationFn: ({ id, status, token }) => updateMembershipRequest(id, status, token),
  });
}

export function useFavorites(token: string | null): UseQueryResult<FavoriteRead[], Error> {
  return useQuery<FavoriteRead[], Error>({
    queryKey: queryKeys.favorites.list(),
    queryFn: () => listFavorites(token!),
    enabled: token !== null,
  });
}

export function useAddFavorite(): UseMutationResult<FavoriteRead, Error, { toyId: string; token: string }> {
  return useMutation<FavoriteRead, Error, { toyId: string; token: string }>({
    mutationFn: ({ toyId, token }) => addFavorite(toyId, token),
  });
}

export function useRemoveFavorite(): UseMutationResult<void, Error, { toyId: string; token: string }> {
  return useMutation<void, Error, { toyId: string; token: string }>({
    mutationFn: ({ toyId, token }) => removeFavorite(toyId, token),
  });
}

export function useDeleteUser(): UseMutationResult<void, Error, { id: string; token: string }> {
  return useMutation<void, Error, { id: string; token: string }>({
    mutationFn: ({ id, token }) => deleteUser(id, token),
  });
}

export function useResetUserPassword(): UseMutationResult<UserRead, Error, { id: string; password: string; token: string }> {
  return useMutation<UserRead, Error, { id: string; password: string; token: string }>({
    mutationFn: ({ id, password, token }) => resetUserPassword(id, password, token),
  });
}

export function useSettings(): UseQueryResult<SiteSettingsRead, Error> {
  return useQuery<SiteSettingsRead, Error>({
    queryKey: queryKeys.settings.get(),
    queryFn: () => fetchSettings(),
  });
}

export function useUpdateSettings(): UseMutationResult<SiteSettingsRead, Error, { address: string; token: string }> {
  return useMutation<SiteSettingsRead, Error, { address: string; token: string }>({
    mutationFn: ({ address, token }) => updateSettings(address, token),
  });
}

export function useUpdateUser(): UseMutationResult<UserRead, Error, { id: string; payload: UserUpdate; token: string }> {
  return useMutation<UserRead, Error, { id: string; payload: UserUpdate; token: string }>({
    mutationFn: ({ id, payload, token }) => updateUser(id, payload, token),
  });
}
