# Shadofighter

Unity 6.6 game project with **Unity MCP** wired so Cursor can talk to the Unity Editor on your machine.

This repository contains the Unity project and Cursor MCP config. It does **not** install Unity Hub, the Editor, or MCP onto your computer. Those stay local.

## Requirements

- Unity Hub (already installed)
- Unity Editor **6000.6.0f1** (Unity 6.6)
- Cursor
- A project path **without spaces** (required by Unity MCP), for example `C:/Projects/Shadofighter`

If Hub offers to upgrade the project, stay on **6000.6.0f1** unless you mean to change editors.

## Open the project

1. Finish the Unity 6.6 Editor install in Unity Hub if it is still running.
2. In Unity Hub, **Open** this repository folder (the folder that contains `Assets`, `Packages`, and `ProjectSettings`).
3. Let Unity import packages. The first open downloads **AI Game Developer** (`com.ivanmurzak.unity.mcp` **0.90.0**) from OpenUPM. That can take a few minutes.
4. Ignore Safe Mode if Unity offers it for missing Library caches on a fresh clone; choose **Ignore** so import can finish.

## Enable MCP so Cursor can talk to the Editor

Do this once on your computer after the Editor has opened the project.

### In Unity

1. Keep the Editor open with this project loaded. MCP only works while the Editor is running.
2. Open **Window → AI Game Developer**.
3. Wait until the window shows the local MCP server as running. On first load it downloads the server binary into `Library/mcp-server/` (gitignored).
4. Find **Cursor** in the client list and click **Configure**. That writes the matching port into `.cursor/mcp.json`.
5. If the dashboard shows a port other than `8080`, that is expected. The plugin picks a port from the project path. **Configure** keeps Cursor and Unity on the same port.

### In Cursor

1. Open this same folder as the Cursor workspace.
2. Open **Cursor Settings → MCP**.
3. Find **ai-game-developer**.
4. **Enable** the server if it is toggled off.
5. **Approve** / **Allow** the MCP server if Cursor asks (first-time project MCP prompt).
6. If Unity shows a **pending connection**, allow it in **Window → AI Game Developer**.
7. Reload Cursor (Command Palette → **Developer: Reload Window**) if tools do not appear after enabling.

You should then see Unity MCP tools in chat (scene, GameObject, console, and similar). Ask something concrete such as: *List the open scenes* or *Create a cube named TestCube*.

Leave the Unity Editor running while you use those tools.

## What this repo already contains

| Path | Role |
| --- | --- |
| `Packages/manifest.json` | Unity 6.6 packages plus `com.ivanmurzak.unity.mcp` 0.90.0 and the OpenUPM scoped registry |
| `.cursor/mcp.json` | Project MCP entry for Cursor (`ai-game-developer` → local HTTP) |
| `Assets/Scenes/SampleScene.unity` | Empty starter scene (camera + light) |
| `ProjectSettings/ProjectVersion.txt` | Pins the editor to **6000.6.0f1** |

Official Unity MCP (`com.unity.ai.assistant`) needs Unity Cloud and an AI tools subscription, and current Unity docs mark that MCP server as deprecated. This project uses the maintained [IvanMurzak Unity-MCP](https://github.com/IvanMurzak/Unity-MCP) package instead.

## Optional: CLI on your machine

If you prefer the command line after Unity Hub can see 6000.6.0f1:

```bash
npx unity-mcp-cli open .
npx unity-mcp-cli wait-for-ready .
npx unity-mcp-cli status .
```

`open` launches the Editor. `status` should show the Unity process and a reachable local MCP server.

## Troubleshooting

- **MCP tools missing in Cursor** — Editor must be open, package import finished, Cursor MCP toggle on, then Configure + reload.
- **Wrong port / connection refused** — Click **Configure** next to Cursor in **Window → AI Game Developer**, then reload Cursor.
- **Package resolve errors** — Confirm you are online so OpenUPM (`https://package.openupm.com`) can serve `com.ivanmurzak` and `extensions.unity`.
- **Spaces in the path** — Move the project to a path without spaces and reopen it.
