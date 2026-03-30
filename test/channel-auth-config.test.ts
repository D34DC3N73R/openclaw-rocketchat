import test from "node:test";
import assert from "node:assert/strict";
import { rocketchatPlugin } from "../src/channel.js";
import { resolveRocketChatAccount } from "../src/rocketchat/accounts.js";

test("username/password account is treated as configured", () => {
  const account = resolveRocketChatAccount({
    cfg: {
      channels: {
        rocketchat: {
          accounts: {
            default: {
              baseUrl: "https://chat.example.com",
              username: "bot-test",
              password: "secret",
              enabled: true,
            },
          },
        },
      },
    },
  });

  assert.equal(account.usesLoginAuth, true);
  assert.equal(rocketchatPlugin.config.isConfigured(account), true);

  const snapshot = rocketchatPlugin.status.buildAccountSnapshot({
    account,
    runtime: undefined,
    probe: undefined,
  });
  assert.equal(snapshot.configured, true);
});

test("probeAccount supports username/password login", async () => {
  const account = resolveRocketChatAccount({
    cfg: {
      channels: {
        rocketchat: {
          accounts: {
            default: {
              baseUrl: "https://chat.example.com",
              username: "bot-test",
              password: "secret",
              enabled: true,
            },
          },
        },
      },
    },
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: URL | string, init?: RequestInit) => {
    const url = String(input);
    if (url === "https://chat.example.com/api/v1/login") {
      assert.equal(init?.method, "POST");
      return new Response(
        JSON.stringify({
          status: "success",
          data: { authToken: "token-123", userId: "user-123" },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    }

    if (url === "https://chat.example.com/api/v1/me") {
      const headers = new Headers(init?.headers);
      assert.equal(headers.get("X-Auth-Token"), "token-123");
      assert.equal(headers.get("X-User-Id"), "user-123");
      return new Response(
        JSON.stringify({
          _id: "user-123",
          username: "bot-test",
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    }

    throw new Error(`Unexpected fetch: ${url}`);
  }) as typeof fetch;

  try {
    const probe = await rocketchatPlugin.status.probeAccount({
      account,
      timeoutMs: 2500,
    });
    assert.equal(probe.ok, true);
    assert.equal(probe.bot?._id, "user-123");
    assert.equal(probe.bot?.username, "bot-test");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
