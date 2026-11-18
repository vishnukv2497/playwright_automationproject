/**
 * Central place to read environment configuration.
 * Never hardcode credentials/URLs in Page Objects, fixtures, or specs — read them from here.
 * Populate a local `.env` (gitignored) from `.env.example`.
 */
export type EnvConfig = {
  baseUrl: string;
  adminUsername: string;
  adminPassword: string;
};

export function getEnvConfig(): EnvConfig {
  const baseUrl = process.env.BASE_URL ?? 'https://bankops.demo.transacthub.te.nestdigital.com';
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    throw new Error(
      'ADMIN_USERNAME and ADMIN_PASSWORD must be set (add them to a local .env file — see .env.example).'
    );
  }

  return { baseUrl, adminUsername, adminPassword };
}

/**
 * The Roles suite (tests/ui/roles) targets the dev host rather than BASE_URL.
 * ROLES_USERNAME / ROLES_PASSWORD are optional and fall back to the ADMIN_* pair.
 */
export function getRolesEnvConfig(): EnvConfig {
  const base = getEnvConfig();
  return {
    baseUrl: process.env.ROLES_BASE_URL ?? 'https://bankops-dev.transacthub.te.nestdigital.com',
    adminUsername: process.env.ROLES_USERNAME || base.adminUsername,
    adminPassword: process.env.ROLES_PASSWORD || base.adminPassword,
  };
}

export type Credentials = { username: string; password: string };

export type RoleConfigEnv = {
  baseUrl: string;
  maker: Credentials;
  checker: Credentials;
};

/** Base URL of the Role Configuration suite (tests/ui/roleconfig) — the dev host, like the Roles suite. */
export function getRoleConfigBaseUrl(): string {
  return process.env.ROLES_BASE_URL ?? 'https://bankops-dev.transacthub.te.nestdigital.com';
}

/**
 * Role Configuration suite: an Admin Maker and a separate Admin Checker, for the Maker-Checker flows.
 * Values never leave this function except as login input — do not log them.
 */
export function getRoleConfigEnv(): RoleConfigEnv {
  const { MAKER_USER, MAKER_PASS, CHECKER_USER, CHECKER_PASS } = process.env;
  if (!MAKER_USER || !MAKER_PASS || !CHECKER_USER || !CHECKER_PASS) {
    throw new Error(
      'MAKER_USER, MAKER_PASS, CHECKER_USER and CHECKER_PASS must be set (add them to a local .env file — see .env.example).'
    );
  }
  return {
    baseUrl: getRoleConfigBaseUrl(),
    maker: { username: MAKER_USER, password: MAKER_PASS },
    checker: { username: CHECKER_USER, password: CHECKER_PASS },
  };
}
