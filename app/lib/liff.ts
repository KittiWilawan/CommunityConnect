/**
 * LINE LIFF (LINE Front-end Framework) utilities.
 *
 * LIFF allows the app to run inside LINE's in-app browser and automatically
 * obtain the user's LINE profile without requiring a separate OAuth redirect.
 *
 * Prerequisites:
 *   1. Create a LIFF app in LINE Developers Console
 *   2. Set NEXT_PUBLIC_LIFF_ID in .env.local
 *   3. The LIFF endpoint URL must match the app's URL
 */

let liffModule: typeof import("@line/liff").default | null = null;
let liffInitPromise: Promise<void> | null = null;

export const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || "";

/**
 * Returns true if a LIFF ID is configured.
 */
export function isLiffConfigured(): boolean {
  return !!LIFF_ID;
}

/**
 * Dynamically import and initialize the LIFF SDK.
 * Safe to call multiple times — the SDK is only initialized once.
 */
export async function initLiff(): Promise<typeof import("@line/liff").default | null> {
  if (!LIFF_ID) {
    console.warn("LIFF_ID is not configured. Skipping LIFF initialization.");
    return null;
  }

  if (liffModule) return liffModule;

  if (!liffInitPromise) {
    liffInitPromise = (async () => {
      try {
        const liff = (await import("@line/liff")).default;
        await liff.init({ liffId: LIFF_ID });
        liffModule = liff;
      } catch (err) {
        console.error("LIFF initialization failed:", err);
        liffInitPromise = null;
        throw err;
      }
    })();
  }

  await liffInitPromise;
  return liffModule;
}

/**
 * Returns true if the current page is running inside LIFF (LINE in-app browser).
 * Must be called after initLiff().
 */
export function isInLiffClient(): boolean {
  return liffModule?.isInClient() ?? false;
}

/**
 * Returns true if the user is already logged in via LIFF.
 * Must be called after initLiff().
 */
export function isLiffLoggedIn(): boolean {
  return liffModule?.isLoggedIn() ?? false;
}

/**
 * Trigger LIFF login (redirects the user to LINE login page).
 * Must be called after initLiff().
 */
export function liffLogin(redirectUri?: string): void {
  if (!liffModule) return;
  liffModule.login({ redirectUri });
}

/**
 * Get the LIFF access token (to exchange with Supabase).
 * Must be called after initLiff() and when user is logged in.
 */
export function getLiffAccessToken(): string | null {
  return liffModule?.getAccessToken() ?? null;
}

/**
 * Get the LIFF ID token (JWT containing user profile).
 * Must be called after initLiff() and when user is logged in.
 */
export function getLiffIdToken(): string | null {
  return liffModule?.getIDToken() ?? null;
}

/**
 * Get LINE user profile from LIFF.
 * Must be called after initLiff() and when user is logged in.
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
