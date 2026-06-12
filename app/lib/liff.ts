/**
 * LINE LIFF (LINE Front-end Framework) utilities.
 *
 * LIFF allows the app to run inside LINE's in-app browser and automatically
 * obtain the user's LINE profile without requiring a separate OAuth redirect.
 */

let liffModule: typeof import("@line/liff").default | null = null;
let liffInitialized = false;

export const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || "";

/**
 * Returns true if a LIFF ID is configured.
 */
export function isLiffConfigured(): boolean {
  return !!LIFF_ID;
}

/**
 * Helper: race a promise against a timeout.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * Initialize the LIFF SDK with timeouts on both import and init.
 * Safe to call multiple times — the SDK is only initialized once.
 */
export async function initLiff(): Promise<typeof import("@line/liff").default | null> {
  if (!LIFF_ID) {
    console.warn("LIFF_ID is not configured.");
    return null;
  }

  if (liffInitialized && liffModule) return liffModule;

  // Step 1: Dynamic import with 3s timeout
  console.log("[LIFF] Importing SDK...");
  const liff = (await withTimeout(
    import("@line/liff").then((m) => m.default),
    3000,
    "LIFF SDK import"
  ));

  // Step 2: liff.init with 5s timeout
  console.log("[LIFF] Initializing with LIFF_ID:", LIFF_ID);
  await withTimeout(
    liff.init({ liffId: LIFF_ID }),
    5000,
    "liff.init()"
  );

  console.log("[LIFF] Initialized successfully. isLoggedIn:", liff.isLoggedIn(), "isInClient:", liff.isInClient());
  liffModule = liff;
  liffInitialized = true;
  return liffModule;
}

/**
 * Returns true if the current page is running inside LIFF (LINE in-app browser).
 */
export function isInLiffClient(): boolean {
  return liffModule?.isInClient() ?? false;
}

/**
 * Returns true if the user is already logged in via LIFF.
 */
export function isLiffLoggedIn(): boolean {
  return liffModule?.isLoggedIn() ?? false;
}

/**
 * Trigger LIFF login (redirects the user to LINE login page).
 */
export function liffLogin(redirectUri?: string): void {
  if (!liffModule) return;
  liffModule.login({ redirectUri });
}

/**
 * Get the LIFF access token.
 */
export function getLiffAccessToken(): string | null {
  return liffModule?.getAccessToken() ?? null;
}

/**
 * Get the LIFF ID token (JWT containing user profile).
 */
export function getLiffIdToken(): string | null {
  return liffModule?.getIDToken() ?? null;
}

/**
 * Get LINE user profile from LIFF.
 */
export async function getLiffProfile(): Promise<{
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
} | null> {
  if (!liffModule || !liffModule.isLoggedIn()) return null;
  try {
    return await liffModule.getProfile();
  } catch {
    return null;
  }
}
