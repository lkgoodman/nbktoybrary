import type { HelloResponse, Toy } from "./types";

const BACKEND_URL: string =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? process.env.BACKEND_URL ?? "http://localhost:8000";

export const endpoints = {
  hello: (): string => `${BACKEND_URL}/hello`,
  toys: {
    list: (): string => `${BACKEND_URL}/toys`,
    detail: (id: string): string => `${BACKEND_URL}/toys/${id}`,
    create: (): string => `${BACKEND_URL}/toys`,
    update: (id: string): string => `${BACKEND_URL}/toys/${id}`,
  },
} as const;

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res: Response = await fetch(url, { cache: "no-store", ...init });
  if (!res.ok) {
    throw new Error(`request to ${url} failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function fetchHello(): Promise<HelloResponse> {
  return request<HelloResponse>(endpoints.hello());
}

export async function listToys(): Promise<Toy[]> {
  return request<Toy[]>(endpoints.toys.list());
}

export async function getToy(id: string): Promise<Toy> {
  return request<Toy>(endpoints.toys.detail(id));
}
