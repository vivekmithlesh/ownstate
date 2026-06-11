"use client";

// OwnState — React Query hooks (Brick 05)
//
// Thin client wrappers over the server actions. They become useful once the
// QueryClientProvider is mounted in the layout (Brick 06); server components can
// still call the actions directly without these.

import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";

import {
  getProperties,
  getPropertiesInBounds,
  getPropertyById,
  getPropertyCountsByType,
} from "@/lib/actions/properties";
import {
  getSavedIds,
  getSavedProperties,
  toggleSaved,
} from "@/lib/actions/saved";
import { createEnquiry, type CreateEnquiryInput } from "@/lib/actions/enquiries";
import type { MapBounds, PropertyFilters } from "@/lib/filters";

export const queryKeys = {
  properties: (filters: PropertyFilters = {}) =>
    ["properties", filters] as const,
  propertiesInBounds: (bounds: MapBounds | null) =>
    ["properties", "bounds", bounds] as const,
  property: (id: string) => ["property", id] as const,
  propertyCounts: () => ["property-counts"] as const,
  savedIds: () => ["saved", "ids"] as const,
  savedProperties: () => ["saved", "properties"] as const,
};

export function useProperties(filters: PropertyFilters = {}) {
  return useQuery({
    queryKey: queryKeys.properties(filters),
    queryFn: () => getProperties(filters),
    placeholderData: keepPreviousData,
  });
}

export function usePropertiesInBounds(bounds: MapBounds | null) {
  return useQuery({
    queryKey: queryKeys.propertiesInBounds(bounds),
    queryFn: () => getPropertiesInBounds(bounds as MapBounds),
    enabled: bounds != null,
    placeholderData: keepPreviousData,
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: queryKeys.property(id),
    queryFn: () => getPropertyById(id),
    enabled: Boolean(id),
  });
}

export function usePropertyCounts() {
  return useQuery({
    queryKey: queryKeys.propertyCounts(),
    queryFn: () => getPropertyCountsByType(),
  });
}

export function useSavedIds() {
  return useQuery({
    queryKey: queryKeys.savedIds(),
    queryFn: () => getSavedIds(),
  });
}

export function useSavedProperties() {
  return useQuery({
    queryKey: queryKeys.savedProperties(),
    queryFn: () => getSavedProperties(),
  });
}

export function useToggleSaved() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (propertyId: string) => toggleSaved(propertyId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.savedIds() });
      qc.invalidateQueries({ queryKey: queryKeys.savedProperties() });
    },
  });
}

export function useCreateEnquiry() {
  return useMutation({
    mutationFn: (input: CreateEnquiryInput) => createEnquiry(input),
  });
}
