"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SEANCE_TYPE_LABELS } from "@/lib/labels";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LibraryFilters({
  initialType,
  initialQuery,
}: {
  initialType: string;
  initialQuery: string;
}) {
  const router = useRouter();
  const [type, setType] = useState(initialType);
  const [query, setQuery] = useState(initialQuery);

  function applyFilters(nextType: string, nextQuery: string) {
    const params = new URLSearchParams();
    if (nextType) params.set("type", nextType);
    if (nextQuery) params.set("q", nextQuery);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Select
        value={type}
        onValueChange={(v) => {
          const next = v ?? "";
          setType(next);
          applyFilters(next, query);
        }}
        items={{ "": "Tous les types", ...SEANCE_TYPE_LABELS }}
      >
        <SelectTrigger className="w-56">
          <SelectValue placeholder="Tous les types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Tous les types</SelectItem>
          {Object.entries(SEANCE_TYPE_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        placeholder="Recherche par titre…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") applyFilters(type, query);
        }}
        onBlur={() => applyFilters(type, query)}
        className="max-w-xs"
      />
    </div>
  );
}
