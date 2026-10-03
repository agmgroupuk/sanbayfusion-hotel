export type PlatformSessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

let currentUser: PlatformSessionUser | null = null;

export function getUser(): PlatformSessionUser | null {
  return currentUser;
}

export function setUser(user: PlatformSessionUser | null): void {
  currentUser = user;
}

export async function verifySession(): Promise<{
  valid: boolean;
  user: PlatformSessionUser | null;
}> {
  const response = await fetch("/api/auth/verify", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });
  const result: unknown = await response.json();
  if (!response.ok) {
    throw new Error("Unable to verify the current session.");
  }
  if (
    typeof result !== "object" ||
    result === null ||
    !("valid" in result) ||
    typeof result.valid !== "boolean"
  ) {
    throw new Error("The session service returned an invalid response.");
  }

  const user =
    "user" in result &&
    typeof result.user === "object" &&
    result.user !== null &&
    "id" in result.user &&
    typeof result.user.id === "string" &&
    "email" in result.user &&
    typeof result.user.email === "string" &&
    "name" in result.user &&
    typeof result.user.name === "string" &&
    "role" in result.user &&
    typeof result.user.role === "string"
      ? {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          role: result.user.role,
        }
      : null;

  currentUser = result.valid ? user : null;
  return { valid: result.valid && user !== null, user: currentUser };
}
