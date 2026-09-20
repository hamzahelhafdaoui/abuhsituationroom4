import { create } from "zustand";
import { getHazards } from "./hazard-service";
import type { HazardFeed } from "./hazards";
export const useHazardState = create<{
  feed: HazardFeed | null;
  error: string | null;
  loading: boolean;
}>(() => ({ feed: null, error: null, loading: false }));
export async function refreshHazards() {
  if (useHazardState.getState().loading) return;
  useHazardState.setState({ loading: true });
  try {
    const feed = await getHazards();
    useHazardState.setState({ feed, error: null });
  } catch (e) {
    useHazardState.setState({ error: e instanceof Error ? e.message : "Hazard refresh failed" });
  } finally {
    useHazardState.setState({ loading: false });
  }
}
