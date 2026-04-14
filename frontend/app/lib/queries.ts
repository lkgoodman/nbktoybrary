import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { getToy, listToys } from "./api";
import type { Toy } from "./types";

export const queryKeys = {
  toys: {
    all: ["toys"] as const,
    list: () => [...queryKeys.toys.all, "list"] as const,
    detail: (id: string) => [...queryKeys.toys.all, "detail", id] as const,
  },
} as const;

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
