/**
 * Initials for avatar: up to two letters from display name, else email.
 */
export function getUserInitials(name: string | null | undefined, email: string): string {
  const trimmedName = name?.trim() ?? '';

  if (trimmedName.length > 0) {
    const parts = trimmedName.split(/\s+/).filter(Boolean);

    if (parts.length >= 2) {
      const first = parts[0]?.charAt(0) ?? '';
      const last = parts[parts.length - 1]?.charAt(0) ?? '';
      return `${first}${last}`.toUpperCase();
    }

    return trimmedName.charAt(0).toUpperCase();
  }

  const local = email.trim().split('@')[0] ?? '';
  return (local.charAt(0) || '?').toUpperCase();
}

export function getUserDisplayName(name: string | null | undefined, email: string): string {
  const trimmedName = name?.trim() ?? '';
  return trimmedName.length > 0 ? trimmedName : email;
}
