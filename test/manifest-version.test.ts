import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pluginRoot = path.resolve(__dirname, "..");

test("manifest version matches package version", () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(pluginRoot, "package.json"), "utf8"),
  ) as { version: string };
  const manifest = JSON.parse(
    fs.readFileSync(path.join(pluginRoot, "openclaw.plugin.json"), "utf8"),
  ) as { version: string };

  assert.equal(manifest.version, packageJson.version);
});
