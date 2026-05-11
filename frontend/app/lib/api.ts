import type { BorrowRequestRead, BorrowRequestReadWithDetails, CheckoutRead, FavoriteRead, HelloResponse, MembershipRead, MembershipRequestRead, RegisterRequest, SiteSettingsRead, TimeframeCreate, TimeframeRead, TokenResponse, Toy, ToyCreate, ToyImage, ToyUpdate, UserRead, UserUpdate } from "./types";

const BACKEND_URL = "/api";

export const endpoints = {
  memberships: {
    list: (userId?: string): string =>
      userId !== undefined ? `${BACKEND_URL}/memberships?user_id=${userId}` : `${BACKEND_URL}/memberships`,
    update: (id: string): string => `${BACKEND_URL}/memberships/${id}`,
  },
  checkouts: {
    list: (params?: { toyId?: string; returned?: boolean }): string => {
      const qs = new URLSearchParams();
      if (params?.toyId !== undefined) qs.set("toy_id", params.toyId);
      if (params?.returned !== undefined) qs.set("returned", String(params.returned));
      const q = qs.toString();
      return q !== "" ? `${BACKEND_URL}/checkouts?${q}` : `${BACKEND_URL}/checkouts`;
    },
    create: (): string => `${BACKEND_URL}/checkouts`,
    update: (id: string): string => `${BACKEND_URL}/checkouts/${id}`,
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
    delete: (id: string): string => `${BACKEND_URL}/borrow-requests/${id}`,
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
  settings: {
    get: (): string => `${BACKEND_URL}/settings`,
    update: (): string => `${BACKEND_URL}/settings`,
  },
  favorites: {
    list: (): string => `${BACKEND_URL}/favorites`,
    add: (): string => `${BACKEND_URL}/favorites`,
    remove: (toyId: string): string => `${BACKEND_URL}/favorites/${toyId}`,
  },
} as const;

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res: Response = await fetch(url, { cache: "no-store", ...init });
  if (!res.ok) {
    if (res.status === 401) {
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }
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

export async function createBorrowRequests(toyIds: string[], timeframeId: string, returnDate: string, returnTimeframeId: string, token: string): Promise<BorrowRequestRead[]> {
  return request<BorrowRequestRead[]>(endpoints.borrowRequests.create(), {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ toy_ids: toyIds, timeframe_id: timeframeId, return_date: returnDate, return_timeframe_id: returnTimeframeId }),
  });
}

export async function listTimeframes(token?: string): Promise<TimeframeRead[]> {
  return request<TimeframeRead[]>(endpoints.timeframes.list(), {
    headers: token !== undefined ? { Authorization: `Bearer ${token}` } : {},
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

export async function deleteBorrowRequest(id: string, token: string): Promise<void> {
  const res = await fetch(endpoints.borrowRequests.delete(id), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Cancel failed: ${res.status}`);
}

export async function updateBorrowRequest(id: string, status: "pending" | "approved" | "denied", token: string, denialNote?: string): Promise<BorrowRequestRead> {
  return request<BorrowRequestRead>(endpoints.borrowRequests.update(id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status, denial_note: denialNote ?? null }),
  });
}

export async function createMembership(userId: string, token: string): Promise<MembershipRead> {
  return request<MembershipRead>(endpoints.memberships.list(), {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ user_id: userId }),
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

export async function resetUserPassword(id: string, password: string, token: string): Promise<UserRead> {
  return request<UserRead>(endpoints.users.detail(id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ password }),
  });
}

export async function updateUser(id: string, payload: UserUpdate, token: string): Promise<UserRead> {
  return request<UserRead>(endpoints.users.detail(id), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
}

export async function getUser(id: string, token: string): Promise<UserRead> {
  return request<UserRead>(endpoints.users.detail(id), {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function listCheckouts(token: string, params?: { toyId?: string; returned?: boolean }): Promise<CheckoutRead[]> {
  return request<CheckoutRead[]>(endpoints.checkouts.list(params), {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createCheckout(requestId: string, token: string): Promise<CheckoutRead> {
  return request<CheckoutRead>(endpoints.checkouts.create(), {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ request_id: requestId }),
  });
}

export async function checkinCheckout(id: string, token: string): Promise<CheckoutRead> {
  return request<CheckoutRead>(endpoints.checkouts.update(id), {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function listToys(token?: string): Promise<Toy[]> {
  return request<Toy[]>(endpoints.toys.list(), {
    headers: token !== undefined ? { Authorization: `Bearer ${token}` } : {},
  });
}

export async function getToy(id: string): Promise<Toy> {
  return request<Toy>(endpoints.toys.detail(id));
}

export async function listFavorites(token: string): Promise<FavoriteRead[]> {
  return request<FavoriteRead[]>(endpoints.favorites.list(), {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function addFavorite(toyId: string, token: string): Promise<FavoriteRead> {
  return request<FavoriteRead>(`${endpoints.favorites.add()}?toy_id=${toyId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function fetchSettings(): Promise<SiteSettingsRead> {
  return request<SiteSettingsRead>(endpoints.settings.get());
}

export async function updateSettings(address: string, token: string): Promise<SiteSettingsRead> {
  return request<SiteSettingsRead>(endpoints.settings.update(), {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ address }),
  });
}

export async function removeFavorite(toyId: string, token: string): Promise<void> {
  const res = await fetch(endpoints.favorites.remove(toyId), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Remove favorite failed: ${res.status}`);
}
