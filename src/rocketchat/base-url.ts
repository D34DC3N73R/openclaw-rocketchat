export function normalizeRocketChatBaseUrl(raw?: string | null): string | undefined {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.replace(/\/+$/, "").replace(/\/api\/v1$/i, "");
}
