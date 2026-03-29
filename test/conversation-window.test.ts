import test from "node:test";
import assert from "node:assert/strict";
import { evaluateRocketChatMentionGate, createConversationWindowTracker } from "../src/conversation-window.js";
import { resolveRocketChatConversationWindowMinutes } from "../src/rocketchat/accounts.js";

test("conversation window activates mention gate without a fresh mention", () => {
  const decision = evaluateRocketChatMentionGate({
    kind: "channel",
    shouldRequireMention: true,
    wasMentioned: false,
    isControlCommand: false,
    commandAuthorized: false,
    oncharEnabled: false,
    oncharTriggered: false,
    canDetectMention: true,
    conversationActive: true,
  });

  assert.equal(decision.dropReason, null);
  assert.equal(decision.effectiveWasMentioned, true);
});

test("mention gate still drops missing mentions when the conversation window is inactive", () => {
  const decision = evaluateRocketChatMentionGate({
    kind: "group",
    shouldRequireMention: true,
    wasMentioned: false,
    isControlCommand: false,
    commandAuthorized: false,
    oncharEnabled: false,
    oncharTriggered: false,
    canDetectMention: true,
    conversationActive: false,
  });

  assert.equal(decision.dropReason, "missing-mention");
  assert.equal(decision.effectiveWasMentioned, false);
});

test("conversation window tracker expires stale rooms and refreshes active ones", () => {
  const tracker = createConversationWindowTracker();
  tracker.activate("default:room-1", 60_000, 1_000);

  assert.equal(tracker.isActive("default:room-1", 30_000), true);
  assert.equal(tracker.isActive("default:room-1", 61_000), false);

  tracker.activate("default:room-1", 60_000, 70_000);
  assert.equal(tracker.isActive("default:room-1", 120_000), true);
});

test("room-level conversation window overrides account defaults", () => {
  const cfg = {
    channels: {
      rocketchat: {
        conversationWindowMinutes: 5,
        rooms: {
          roomA: {
            conversationWindowMinutes: 1,
          },
          roomB: {
            conversationWindowMinutes: 0,
          },
        },
        accounts: {
          ops: {
            conversationWindowMinutes: 10,
            rooms: {
              roomA: {
                conversationWindowMinutes: 2,
              },
            },
          },
        },
      },
    },
  };

  assert.equal(resolveRocketChatConversationWindowMinutes({ cfg, roomId: "roomA" }), 1);
  assert.equal(resolveRocketChatConversationWindowMinutes({ cfg, roomId: "roomB" }), 0);
  assert.equal(resolveRocketChatConversationWindowMinutes({ cfg, roomId: "roomZ" }), 5);
  assert.equal(
    resolveRocketChatConversationWindowMinutes({ cfg, accountId: "ops", roomId: "roomA" }),
    2,
  );
  assert.equal(
    resolveRocketChatConversationWindowMinutes({ cfg, accountId: "ops", roomId: "roomZ" }),
    10,
  );
});
