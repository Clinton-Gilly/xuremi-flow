import { spawn } from "node:child_process";

process.env.CONVEX_ALLOW_ANONYMOUS = "false";

const cmd = process.platform === "win32" ? "npx.cmd" : "npx";
const child = spawn(cmd, ["convex", "dev", ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
