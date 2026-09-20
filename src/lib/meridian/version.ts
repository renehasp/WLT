/** Keep in lockstep with package.json `"version"`. */
export const APP_VERSION = "1.1.0";

export function versionShort(v = APP_VERSION): string {
  const parts = v.split(".");
  return `${parts[0]}.${parts[1] ?? "0"}`;
}

export function versionLabel(v = APP_VERSION): string {
  return `V ${versionShort(v)}`;
}
