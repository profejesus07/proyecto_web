import "server-only";
import { isPreview } from "@/lib/env";
import { createMemoryRepo } from "./memory-repo";
import { createSupabaseRepo } from "./supabase-repo";
import type { Repo } from "./types";

let cached: Repo | null = null;

export function getRepo(): Repo {
  if (!cached) cached = isPreview() ? createMemoryRepo() : createSupabaseRepo();
  return cached;
}
