"use client";

import { createContext, useContext, useState } from "react";

export interface FilterState {
  searchQuery: string;
  tagList: string[];
  ageLabel: string | null;
  language: string | null;
  availableOnly: boolean;
  favoritesOnly: boolean;
}

const DEFAULT_STATE: FilterState = {
  searchQuery: "",
  tagList: [],
  ageLabel: null,
  language: null,
  availableOnly: false,
  favoritesOnly: false,
};

interface FilterContextValue {
  filters: FilterState;
  setFilters: (updater: (prev: FilterState) => FilterState) => void;
  clearFilters: () => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [filters, setFiltersState] = useState<FilterState>(DEFAULT_STATE);

  function setFilters(updater: (prev: FilterState) => FilterState): void {
    setFiltersState(updater);
  }

  function clearFilters(): void {
    setFiltersState(DEFAULT_STATE);
  }

  return (
    <FilterContext.Provider value={{ filters, setFilters, clearFilters }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (ctx === null) throw new Error("useFilters must be used within FilterProvider");
  return ctx;
}
