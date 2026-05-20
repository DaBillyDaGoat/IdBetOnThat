import { customAlphabet } from "nanoid";

// No ambiguous chars: no 0/O, no 1/l/I, no 5/S that get confused in copy-paste.
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export const generateSlug = customAlphabet(ALPHABET, 5);

// Display name -> username slug. Lowercase, alphanumeric, dashes.
export function usernameFromDisplayName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "user"
  );
}
