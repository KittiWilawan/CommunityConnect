export function getAuthDestination(role?: string | null) {
  return role === "admin" ? "/admindashboard" : "/Dashboard";
}

export async function signInWithEmail(email: string, password: string) {
  const res = await fetch("/api/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(body.error || "Sign in failed");
  }

  return body as { role: string };
}

export function redirectAfterAuth(role?: string | null) {
  window.location.href = getAuthDestination(role);
}
