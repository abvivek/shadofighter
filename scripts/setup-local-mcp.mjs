#!/usr/bin/env node
/**
 * Write .cursor/mcp.json so local Cursor talks to this project's Unity MCP server.
 *
 * Unity MCP does NOT use fixed port 8080. It derives a port in 20000–29999 from the
 * project directory path (same v2 algorithm as com.ivanmurzak.unity.mcp). That lets
 * several Unity projects run at once without fighting over 8080.
 *
 * Usage (from the Unity project root, on your machine):
 *   node scripts/setup-local-mcp.mjs
 *
 * Or after opening the project in Unity:
 *   Window → AI Game Developer → Configure next to Cursor
 */

import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MIN_PORT = 20000;
const PORT_RANGE = 10000;

const INVARIANT_LOWER_OVERRIDES = { İ: "İ" };

function toLowerInvariant(value) {
  let result = "";
  for (const ch of value) {
    result += INVARIANT_LOWER_OVERRIDES[ch] ?? ch.toLowerCase();
  }
  return result;
}

function trimTrailingSeparators(path) {
  let end = path.length;
  while (end > 1 && (path[end - 1] === "/" || path[end - 1] === "\\")) {
    end--;
  }
  return end === path.length ? path : path.slice(0, end);
}

/** Match Unity-MCP ProjectIdentity v2 (backslash → slash, then invariant lower). */
function normalizeV2(projectRoot) {
  return toLowerInvariant(
    trimTrailingSeparators(projectRoot).split("\\").join("/"),
  );
}

function derivePortV2(projectRoot) {
  const hash = createHash("sha256")
    .update(Buffer.from(normalizeV2(projectRoot), "utf8"))
    .digest();
  return MIN_PORT + (hash.readUInt32LE(0) % PORT_RANGE);
}

function derivePinV2(projectRoot) {
  const hash = createHash("sha256")
    .update(Buffer.from(normalizeV2(projectRoot), "utf8"))
    .digest();
  return hash.subarray(0, 4).toString("hex");
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");
const assetsDir = join(projectRoot, "Assets");
const projectSettings = join(projectRoot, "ProjectSettings");

if (!existsSync(assetsDir) || !existsSync(projectSettings)) {
  console.error(
    "Refusing to write MCP config: this does not look like a Unity project root.",
  );
  console.error(`Expected Assets/ and ProjectSettings/ under: ${projectRoot}`);
  process.exit(1);
}

const port = derivePortV2(projectRoot);
const pin = derivePinV2(projectRoot);
const url = `http://127.0.0.1:${port}`;
const cursorDir = join(projectRoot, ".cursor");
const mcpPath = join(cursorDir, "mcp.json");

const config = {
  mcpServers: {
    "ai-game-developer": {
      type: "http",
      url,
    },
  },
};

mkdirSync(cursorDir, { recursive: true });
writeFileSync(mcpPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

console.log("Local Unity MCP config written for Cursor.");
console.log(`  Project: ${projectRoot}`);
console.log(`  Port:    ${port}  (path-derived; not 8080)`);
console.log(`  Pin:     ${pin}`);
console.log(`  URL:     ${url}`);
console.log(`  File:    ${mcpPath}`);
console.log("");
console.log("Next steps on this machine:");
console.log("  1. Open this folder in Unity Hub (Editor 6000.6.0f1).");
console.log("  2. Wait for package import; open Window → AI Game Developer.");
console.log("  3. Confirm the dashboard shows the same port as above.");
console.log("  4. In Cursor: Settings → MCP → enable ai-game-developer.");
console.log("  5. Reload Cursor if tools do not appear.");
console.log("");
console.log(
  "Leave Unity open while you use MCP. Another project may keep using 8080;",
  "this project uses its own port in 20000–29999.",
);
