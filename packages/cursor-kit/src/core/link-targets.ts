import { DEFAULT_LINK_DIRS, DEFAULT_LINK_FILES } from "../constants.js";

export type LinkTargetsOptions = {
  includeLocal: boolean;
};

export function buildLinkNames(opts: LinkTargetsOptions): { dirs: string[]; files: string[] } {
  const dirs: string[] = [...DEFAULT_LINK_DIRS];
  if (opts.includeLocal) dirs.push("local");
  const files = [...DEFAULT_LINK_FILES];
  return { dirs, files };
}
