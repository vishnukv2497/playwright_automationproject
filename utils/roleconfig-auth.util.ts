import fs from 'fs';
import path from 'path';

/**
 * Where the Role Configuration setup project (tests/ui/roleconfig/auth.setup.ts) saves each user's
 * signed-in browser state. The folder is gitignored (/playwright/.auth/).
 */
export const ROLECONFIG_AUTH = {
  maker: path.resolve(__dirname, '..', 'playwright', '.auth', 'roleconfig-maker.json'),
  checker: path.resolve(__dirname, '..', 'playwright', '.auth', 'roleconfig-checker.json'),
} as const;

export type RoleConfigUser = keyof typeof ROLECONFIG_AUTH;

/** Bearer token the app keeps in localStorage (`ph_token`), read from a saved storage state. */
export function tokenFromStorageState(user: RoleConfigUser): string {
  const state = JSON.parse(fs.readFileSync(ROLECONFIG_AUTH[user], 'utf-8')) as {
    origins: Array<{ localStorage: Array<{ name: string; value: string }> }>;
  };
  const token = state.origins.flatMap((o) => o.localStorage).find((e) => e.name === 'ph_token')?.value;
  if (!token) throw new Error(`No session token in the ${user} storage state — run the roleconfig-setup project.`);
  return token;
}
