# Security Notes

This file records security-relevant audit notes that are specific to this repository and useful for future review.

## Reviewed Findings

### Issue #5: possible credential-harvesting pattern in bundled plugin output

Issue: `https://github.com/alexwoo-awso/openclaw-rocketchat/issues/5`

Status: open for cross-checking, current conclusion is likely false positive.

What was reviewed:

- Built bundle location reported by the scanner: `dist/index.js:50`
- Source map and bundled output around the reported location
- Source files responsible for Rocket.Chat account resolution and network I/O

What was found:

- `dist/index.js:50` is vendored `ws` dependency code for buffer concatenation, not plugin auth or outbound request logic.
- Plugin environment variable reads are limited to:
  - `ROCKETCHAT_AUTH_TOKEN`
  - `ROCKETCHAT_USER_ID`
  - `ROCKETCHAT_URL`
  - `ROCKETCHAT_USERNAME`
  - `ROCKETCHAT_PASSWORD`
- Those environment variables are read in `src/rocketchat/accounts.ts` and only for the default account.
- Authenticated outbound requests are directed to the configured Rocket.Chat `baseUrl`:
  - REST API requests to `${baseUrl}/api/v1/...`
  - login request to `${baseUrl}/api/v1/login`
  - realtime WebSocket connection to `${baseUrl}/websocket`
- No code path was identified that exfiltrates those credentials to a non-configured host.

Why this was likely flagged:

- The built bundle contains vendored `ws` code, plugin env reads, and legitimate network/auth logic in a single file.
- A coarse scanner can correlate `process.env` usage with outbound network code elsewhere in the bundle and attribute the warning to an unrelated line.

Useful source references:

- `src/rocketchat/accounts.ts`
- `src/rocketchat/client.ts`
- `src/rocketchat/probe.ts`
- `src/rocketchat/realtime.ts`

Follow-up:

- The issue remains open to invite independent review and cross-checking.
- The 0.3.4 packaging split moves environment-variable handling and Rocket.Chat network code into separate emitted chunks so coarse per-file scanners no longer see both patterns in `dist/index.js`.
