import { z } from "zod";
import { archiveRequest } from "./archive-client";
import { FALLBACK_SOURCES } from "./source-stats";

const statsSchema = z.object({ sources: z.number().int().positive(), publishers: z.number().int().positive() });

/** How many sources the engine collects right now, refreshed every five minutes. It grows as discovery and editors add sources. */
export async function currentSourceCount(): Promise<number> {
  try {
    const response = await archiveRequest("/stats", { next: { revalidate: 300 } }, { anonymous: true });
    if (!response?.ok) return FALLBACK_SOURCES;
    return statsSchema.parse(await response.json()).sources;
  } catch {
    return FALLBACK_SOURCES;
  }
}
