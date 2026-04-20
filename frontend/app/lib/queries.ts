import { useMutation, useQuery, type UseMutationResult, type UseQueryResult } from "@tanstack/react-query";

import { createBorrowRequests, createTimeframe, createToy, updateBorrowRequest, deleteTimeframe, deleteToyImage, getToy, getUser, listAdminBorrowRequests, listBorrowRequests, listMemberships, listMembershipRequests, listTimeframes, listToys, listUsers, login, registerUser, setFeaturedImage, updateMembershipRequest, updateMembershipStanding, updateToy, uploadToyImage } from "./api";
import type { BorrowRequestRead, BorrowRequestReadWithDetails, MembershipRead, MembershipRequestRead, RegisterRequest, TimeframeCreate, TimeframeRead, TokenResponse, Toy, ToyCreate, ToyImage, ToyUpdate, UserRead } from "./types";


export const queryKeys = {
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

export function useToys(): UseQueryResult<Toy[], Error> {
  return useQuery<Toy[], Error>({
    queryKey: queryKeys.toys.list(),
    queryFn: listToys,
  });
}

export function useToy(id: string): UseQueryResult<Toy, Error> {
  return useQuery<Toy, Error>({
    queryKey: queryKeys.toys.detail(id),
    queryFn: () => getToy(id),
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

export function useCreateBorrowRequests(): UseMutationResult<BorrowRequestRead[], Error, { toyIds: string[]; timeframeId: string; token: string }> {
  return useMutation<BorrowRequestRead[], Error, { toyIds: string[]; timeframeId: string; token: string }>({
    mutationFn: ({ toyIds, timeframeId, token }) => createBorrowRequests(toyIds, timeframeId, token),
  });
}

export function useTimeframes(token: string | null): UseQueryResult<TimeframeRead[], Error> {
  return useQuery<TimeframeRead[], Error>({
    queryKey: queryKeys.timeframes.list(),
    queryFn: () => listTimeframes(token!),
    enabled: token !== null,
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

export function useUpdateMembershipStanding(): UseMutationResult<
  MembershipRead,
  Error,
  { id: string; accountStanding: "active" | "banned" | "temporary_hold"; token: string }
> {
  return useMutation<MembershipRead, Error, { id: string; accountStanding: "active" | "banned" | "temporary_hold"; token: string }>({
    mutationFn: ({ id, accountStanding, token }) => updateMembershipStanding(id, accountStanding, token),
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
