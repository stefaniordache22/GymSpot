# GymSpot

A working local browser app based on the GymSpot Figma design. Node.js 22+ and VS Code are available on this machine.

## Run

Open `GymSpot.code-workspace` in VS Code. In **Run and Debug**, select **GymSpot: Run app** and press **F5**. This starts the server (or reuses an existing GymSpot server), waits for it to be ready, and opens your Windows default browser automatically. If VS Code asks whether you trust this folder, allow workspace trust for this project to enable running tasks. Pressing Stop ends the browser launcher session; the server task stays available for the next launch.

You can also double-click `Start-GymSpot.cmd`, or run `powershell -NoProfile -ExecutionPolicy Bypass -File ./start.ps1` in a terminal and open http://localhost:5173. `pnpm dev` also starts it if Node is on PATH. The launch script finds the existing Node runtime on this machine, so no separate Node installation is needed.

Install dependencies with `pnpm install`. If pnpm is not on PATH on this machine, use `C:\Users\STEFAN\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd install`.

