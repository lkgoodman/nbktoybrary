import type { BorrowRequestRead, BorrowRequestReadWithDetails, HelloResponse, MembershipRead, MembershipRequestRead, RegisterRequest, TimeframeCreate, TimeframeRead, TokenResponse, Toy, ToyCreate, ToyImage, ToyUpdate, UserRead } from "./types";

const BACKEND_URL: string =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://localhost:8000";

export const endpoints = {
  memberships: {
    list: (userId?: string): string =>
      userId !== undefined ? `${BACKEND_URL}/memberships?user_id=${userId}` : `${BACKEND_URL}/memberships`,
    update: (id: string): string => `${BACKEND_URL}/memberships/${id}`,
  },
  hello: (): string => `${BACKEND_URL}/hello`,
  auth: {
    token: (): string => `${BACKEND_URL}/auth/token`,
  },
  users: {
    create: (): string => `${BACKEND_URL}/users`,
    detail: (id: string): string => `${BACKEND_URL}/users/${id}`,
  },
  toys: {
    list: (): string => `${BACKEND_URL}/toys`,
    detail: (id: string): string => `${BACKEND_URL}/toys/${id}`,
    create: (): string => `${BACKEND_URL}/toys`,
    update: (id: string): string => `${BACKEND_URL}/toys/${id}`,
  },
  membershipRequests: {
    list: (): string => `${BACKEND_URL}/membership-requests`,
    update: (id: string): string => `${BACKEND_URL}/membership-requests/${id}`,
  },
  borrowRequests: {
    list: (): string => `${BACKEND_URL}/borrow-requests`,
    adminList: (): string => `${BACKEND_URL}/borrow-requests/admin`,
    create: (): string => `${BACKEND_URL}/borrow-requests`,
    update: (id: string): string => `${BACKEND_URL}/borrow-requests/${id}`,
  },
  timeframes: {
    list: (): string => `${BACKEND_URL}/timeframes`,
    create: (): string => `${BACKEND_URL}/timeframes`,
    delete: (id: string): string => `${BACKEND_URL}/timeframes/${id}`,
  },
  toyImages: {
    upload: (toyId: string): string => `${BACKEND_URL}/toys/${toyId}/images`,
    update: (imageId: string): string => `${BACKEND_URL}/toy-images/${imageId}`,
    delete: (imageId: string): string => `${BACKEND_URL}/toy-images/${imageId}`,
  },
} as const;

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res: Response = await fetch(url, { cache: "no-store", ...init });
  if (!res.ok) {
    let detail: string | null = null;
    try {
      const body = await res.json() as { detail?: string };
      if (typeof body.detail === "string") detail = body.detail;
    } catch {
      // ignore parse errors
    }
    throw new Error(detail ?? `request to ${url} failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function fetchHello(): Promise<HelloResponse> {
  return request<HelloResponse>(endpoints.hello());
}

export async function login(email: string, password: string): Promise<TokenResponse> {
  return request<TokenResponse>(endpoints.auth.token(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function registerUser(payload: RegisterRequest): Promise<UserRead> {
  return request<UserRead>(endpoints.users.create(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function createToy(payload: ToyCreate, token: string): Promise<Toy> {
  return request<Toy>(endpoints.toys.create(), {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function updateToy(id: string, payload: ToyUpdate, token: string): Promise<Toy> {
  return request<Toy>(endpoints.toys.update(id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function listMembershipRequests(token: string): Promise<MembershipRequestRead[]> {
  return request<MembershipRequestRead[]>(endpoints.membershipRequests.list(), {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateMembershipRequest(
  id: string,
  status: "approved" | "denied",
  token: string,
): Promise<MembershipRequestRead> {
  return request<MembershipRequestRead>(endpoints.membershipRequests.update(id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
}

export async function uploadToyImage(toyId: string, file: File, token: string): Promise<ToyImage> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(endpoints.toyImages.upload(toyId), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json() as Promise<ToyImage>;
}

export async function setFeaturedImage(imageId: string, token: string): Promise<ToyImage> {
  return request<ToyImage>(endpoints.toyImages.update(imageId), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ is_featured: true }),
  });
}

export async function deleteToyImage(imageId: string, token: string): Promise<void> {
  const res = await fetch(endpoints.toyImages.delete(imageId), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
}

export async function createBorrowRequests(toyIds: string[], timeframeId: string, token: string): Promise<BorrowRequestRead[]> {
  return request<BorrowRequestRead[]>(endpoints.borrowRequests.create(), {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ toy_ids: toyIds, timeframe_id: timeframeId }),
  });
}

export async function listTimeframes(token: string): Promise<TimeframeRead[]> {
  return request<TimeframeRead[]>(endpoints.timeframes.list(), {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createTimeframe(payload: TimeframeCreate, token: string): Promise<TimeframeRead> {
  return request<TimeframeRead>(endpoints.timeframes.create(), {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function deleteTimeframe(id: string, token: string): Promise<void> {
  const res = await fetch(endpoints.timeframes.delete(id), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
}

export async function listBorrowRequests(token: string): Promise<BorrowRequestRead[]> {
  return request<BorrowRequestRead[]>(endpoints.borrowRequests.list(), {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function listAdminBorrowRequests(token: string): Promise<BorrowRequestReadWithDetails[]> {
  return request<BorrowRequestReadWithDetails[]>(endpoints.borrowRequests.adminList(), {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateBorrowRequest(id: string, status: "pending" | "approved" | "denied", token: string, denialNote?: string): Promise<BorrowRequestRead> {
  return request<BorrowRequestRead>(endpoints.borrowRequests.update(id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status, denial_note: denialNote ?? null }),
  });
}

export async function listMemberships(token: string, userId?: string): Promise<MembershipRead[]> {
  return request<MembershipRead[]>(endpoints.memberships.list(userId), {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateMembershipStanding(
  id: string,
  accountStanding: "active" | "banned" | "temporary_hold",
  token: string,
): Promise<MembershipRead> {
  return request<MembershipRead>(endpoints.memberships.update(id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ account_standing: accountStanding }),
  });
}

export async function listUsers(token: string): Promise<UserRead[]> {
  return request<UserRead[]>(endpoints.users.create(), {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getUser(id: string, token: string): Promise<UserRead> {
  return request<UserRead>(endpoints.users.detail(id), {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function listToys(): Promise<Toy[]> {
  return request<Toy[]>(endpoints.toys.list());
}

export async function getToy(id: string): Promise<Toy> {
  return request<Toy>(endpoints.toys.detail(id));
}
