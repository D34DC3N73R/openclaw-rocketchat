import type { ChatType } from "openclaw/plugin-sdk/channel-contract";

export type RocketChatMentionGateInput = {
  kind: ChatType;
  shouldRequireMention: boolean;
  wasMentioned: boolean;
  isControlCommand: boolean;
  commandAuthorized: boolean;
  oncharEnabled: boolean;
  oncharTriggered: boolean;
  canDetectMention: boolean;
  conversationActive: boolean;
};

export type RocketChatMentionGateDecision = {
  effectiveWasMentioned: boolean;
  dropReason: "onchar-not-triggered" | "missing-mention" | null;
};

export function evaluateRocketChatMentionGate(
  params: RocketChatMentionGateInput,
): RocketChatMentionGateDecision {
  if (params.kind === "direct") {
    return {
      effectiveWasMentioned: true,
      dropReason: null,
    };
  }

  const shouldBypassMention =
    params.isControlCommand &&
    params.shouldRequireMention &&
    !params.wasMentioned &&
    params.commandAuthorized;
  const effectiveWasMentioned =
    params.wasMentioned ||
    shouldBypassMention ||
    params.oncharTriggered ||
    params.conversationActive;

  if (
    params.oncharEnabled &&
    !params.oncharTriggered &&
    !params.wasMentioned &&
    !params.isControlCommand &&
    !params.conversationActive
  ) {
    return {
      effectiveWasMentioned,
      dropReason: "onchar-not-triggered",
    };
  }

  if (
    params.shouldRequireMention &&
    params.canDetectMention &&
    !effectiveWasMentioned
  ) {
    return {
      effectiveWasMentioned,
      dropReason: "missing-mention",
    };
  }

  return {
    effectiveWasMentioned,
    dropReason: null,
  };
}

export function createConversationWindowTracker() {
  const activeRooms = new Map<string, number>();

  const pruneExpired = (now: number) => {
    for (const [key, expiresAt] of activeRooms) {
      if (expiresAt <= now) {
        activeRooms.delete(key);
      }
    }
  };

  return {
    isActive(key: string, now = Date.now()): boolean {
      pruneExpired(now);
      const expiresAt = activeRooms.get(key);
      return typeof expiresAt === "number" && expiresAt > now;
    },
    activate(key: string, ttlMs: number, now = Date.now()): void {
      if (ttlMs <= 0) {
        activeRooms.delete(key);
        return;
      }
      activeRooms.set(key, now + ttlMs);
    },
  };
}
