# Shadofighter

Unity 6.6 game project with **Unity MCP** wired so Cursor can talk to the Unity Editor on your machine.

This repository contains the Unity project and Cursor MCP config. It does **not** install Unity Hub, the Editor, or MCP onto your computer. Those stay local.

## Canonical local path (Windows)

Keep the clone here so the committed MCP port matches Unity:

```text
D:\Projects\Shadofighter
```

Port for that path: **27940** (not 8080). Another Unity project can keep using 8080.

If your folder is elsewhere on `D:\`, run the setup script with that path (see below).

## Requirements

- Unity Hub
- Unity Editor **6000.6.0f1** (Unity 6.6)
- Cursor
- Node.js 18+ (for the setup script)
- Project path **without spaces**

If Hub offers to upgrade the project, stay on **6000.6.0f1** unless you mean to change editors.

## Sync and use on your PC

### 1. Clone / pull on D:

```powershell
# first time
git clone https://github.com/abvivek/shadofighter.git D:\Projects\Shadofighter
cd D:\Projects\Shadofighter

# later
git pull
```

### 2. Refresh local MCP config

```powershell
node scripts\setup-local-mcp.mjs
```

That writes `.cursor/mcp.json` → `http://127.0.0.1:27940` for `D:\Projects\Shadofighter`.

### 3. Open Unity

1. Unity Hub → **Open** → `D:\Projects\Shadofighter`
2. Let packages import (`com.ivanmurzak.unity.mcp` **0.90.0** from OpenUPM)
3. Ignore Safe Mode if offered on a fresh clone
4. **Window → AI Game Developer** — confirm port **27940**
5. Optional: click **Configure** next to Cursor (same result as the script)

### 4. Enable in Cursor (local Desktop)

1. Open `D:\Projects\Shadofighter` as the Cursor workspace
2. **Settings → MCP** → enable **ai-game-developer**
3. Approve the server / pending Unity connection if asked
4. Reload Cursor if tools do not appear

Leave Unity open while using MCP tools.

## Let Cloud Agents work on this PC (My Machines)

A normal cloud VM **cannot** reach your local Unity Editor. To have cloud agents edit and call Unity on this machine:

1. Install Cursor CLI (PowerShell):

```powershell
irm 'https://cursor.com/install?win32=true' | iex
agent login
```

2. From the project folder, start a worker and keep it running:

```powershell
cd D:\Projects\Shadofighter
agent worker start --name "shadofighter-pc" --worker-dir "D:\Projects\Shadofighter"
```

3. Switch MCP to **stdio** so the server runs on your PC (HTTP MCP is proxied by Cursor’s backend and cannot use your `127.0.0.1`):

```powershell
node scripts\setup-local-mcp.mjs --stdio
```

4. Open Unity with this project, then start a Cloud Agent and pick **shadofighter-pc** (or your My Machines entry) in the environment dropdown.

Until that worker is connected, cloud agents only edit the git remote — you pull on `D:\` and verify in Unity yourself.

## What this repo already contains

| Path | Role |
| --- | --- |
| `Packages/manifest.json` | Unity 6.6 packages plus `com.ivanmurzak.unity.mcp` 0.90.0 and OpenUPM |
| `scripts/setup-local-mcp.mjs` | Writes `.cursor/mcp.json` for `D:\Projects\Shadofighter` (or `--identity`) |
| `.cursor/mcp.json` | Cursor → local Unity MCP at `http://127.0.0.1:27940` |
| `.cursor/mcp.json.example` | Same shape for reference |
| `Assets/Scenes/SampleScene.unity` | Empty starter scene (camera + light) |
| `ProjectSettings/ProjectVersion.txt` | Pins editor **6000.6.0f1** |

This project uses [IvanMurzak Unity-MCP](https://github.com/IvanMurzak/Unity-MCP), not Unity’s deprecated cloud MCP package.

## Optional CLI

```powershell
npx unity-mcp-cli@0.90.0 open .
npx unity-mcp-cli@0.90.0 wait-for-ready .
npx unity-mcp-cli@0.90.0 status .
```

## Troubleshooting

- **Port 8080 used by another project** — Expected. This project uses **27940** at `D:\Projects\Shadofighter`.
- **Wrong folder on D:** — Run `node scripts\setup-local-mcp.mjs --identity "D:\Your\Actual\Path"` then reopen Cursor.
- **MCP tools missing** — Unity open, import finished, MCP enabled, port matches, reload Cursor.
- **Cloud agent still can’t talk to Unity** — Start My Machines worker from `D:\Projects\Shadofighter`, use `--stdio`, keep Unity open.
- **Package resolve errors** — Need network access to OpenUPM (`https://package.openupm.com`).
- **Spaces in the path** — Move the project, then re-run the setup script.
