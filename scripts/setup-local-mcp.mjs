#!/usr/bin/env node
/**
 * Write .cursor/mcp.json so Cursor talks to this project's Unity MCP server.
 *
 * Unity MCP does NOT use fixed port 8080. It derives a port in 20000–29999 from the
 * project directory path (same v2 algorithm as com.ivanmurzak.unity.mcp).
 *
 * Canonical Windows checkout for Shadofighter:
 *   D:\Projects\Shadofighter
 *
 * Usage (on your Windows machine, from the project root):
 *   node scripts/setup-local-mcp.mjs
 *
 * Generate config for the canonical D: path (also usable from any checkout):
 *   node scripts/setup-local-mcp.mjs --identity "D:\\Projects\\Shadofighter"
 *
 * Stdio transport (needed for Cursor My Machines / self-hosted workers):
 *   node scripts/setup-local-mcp.mjs --identity "D:\\Projects\\Shadofighter" --stdio
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
/** Default local Windows clone path for this repo. */
const CANONICAL_WINDOWS_PATH = "D:\\Projects\\Shadofighter";

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

function printHelp() {
  console.log(`Usage: node scripts/setup-local-mcp.mjs [options]

Options:
  --identity <path>   Absolute Unity project path used for the MCP port
                      (default on this repo: ${CANONICAL_WINDOWS_PATH}
                      when not running inside that folder)
  --stdio             Write stdio MCP config (for My Machines workers)
  --http              Write HTTP MCP config (default; for local Cursor Desktop)
  --help              Show this help
`);
}

function parseArgs(argv) {
  const opts = { identity: null, transport: "http", help: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") opts.help = true;
    else if (arg === "--stdio") opts.transport = "stdio";
    else if (arg === "--http") opts.transport = "http";
    else if (arg === "--identity") {
      opts.identity = argv[++i];
      if (!opts.identity) {
        console.error("Missing value for --identity");
        process.exit(1);
      }
    } else if (!arg.startsWith("-")) {
      opts.identity = arg;
    } else {
      console.error(`Unknown option: ${arg}`);
      printHelp();
      process.exit(1);
    }
  }
  return opts;
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const opts = parseArgs(process.argv.slice(2));

if (opts.help) {
  printHelp();
  process.exit(0);
}

const assetsDir = join(repoRoot, "Assets");
const projectSettings = join(repoRoot, "ProjectSettings");
const looksLikeUnity =
  existsSync(assetsDir) && existsSync(projectSettings);

if (!looksLikeUnity && !opts.identity) {
  console.error(
    "Refusing to write MCP config: this does not look like a Unity project root.",
  );
  console.error(`Expected Assets/ and ProjectSettings/ under: ${repoRoot}`);
  process.exit(1);
}

// Prefer an explicit identity path; otherwise use the real checkout path.
// When the cloud/agent checkout is not the Windows D: folder, fall back to the
// canonical local path so commits can ship a Windows-ready mcp.json.
const normalizedRepo = normalizeV2(repoRoot);
const onCanonicalWindows =
  normalizedRepo === normalizeV2(CANONICAL_WINDOWS_PATH);
const identityPath =
  opts.identity ||
  (onCanonicalWindows ? repoRoot : CANONICAL_WINDOWS_PATH);

const port = derivePortV2(identityPath);
const pin = derivePinV2(identityPath);
const cursorDir = join(repoRoot, ".cursor");
const mcpPath = join(cursorDir, "mcp.json");

let config;
if (opts.transport === "stdio") {
  // My Machines: HTTP MCP is proxied by Cursor's backend and cannot reach
  // 127.0.0.1 on your PC. Stdio runs the server on the worker machine.
  // Keep Windows separators so Cursor on D: can launch the binary.
  const command = [
    trimTrailingSeparators(identityPath),
    "Library",
    "mcp-server",
    "win-x64",
    "unity-mcp-server.exe",
  ].join("\\");
  config = {
    mcpServers: {
      "ai-game-developer": {
        type: "stdio",
        command,
        args: [
          `port=${port}`,
          "plugin-timeout=10000",
          "client-transport=stdio",
        ],
      },
    },
  };
} else {
  config = {
    mcpServers: {
      "ai-game-developer": {
        type: "http",
        url: `http://127.0.0.1:${port}`,
      },
    },
  };
}

mkdirSync(cursorDir, { recursive: true });
writeFileSync(mcpPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");

console.log("Local Unity MCP config written for Cursor.");
console.log(`  Repo write root: ${repoRoot}`);
console.log(`  Identity path:   ${identityPath}`);
console.log(`  Transport:       ${opts.transport}`);
console.log(`  Port:            ${port}  (path-derived; not 8080)`);
console.log(`  Pin:             ${pin}`);
if (opts.transport === "http") {
  console.log(`  URL:             http://127.0.0.1:${port}`);
} else {
  console.log(`  Command:         ${config.mcpServers["ai-game-developer"].command}`);
}
console.log(`  File:            ${mcpPath}`);
console.log("");
console.log("On your Windows PC:");
console.log(`  1. Keep the clone at: ${CANONICAL_WINDOWS_PATH}`);
console.log("  2. Open that folder in Unity Hub (Editor 6000.6.0f1).");
console.log("  3. Window → AI Game Developer — confirm the same port.");
console.log("  4. Cursor Settings → MCP → enable ai-game-developer.");
console.log("");
console.log(
  "For Cloud Agents that must use this PC + Unity, start a My Machines worker",
);
console.log(
  `  from ${CANONICAL_WINDOWS_PATH}, and prefer --stdio so MCP stays local.`,
);
