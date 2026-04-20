#!/usr/bin/env node
// Cross-platform Gradle wrapper invoker.
// Nx run-commands spawns cmd.exe on Windows, which:
//   - doesn't understand `./gradlew` (Unix path style)
//   - doesn't search current directory in PATH for `gradlew.bat`
// This shim resolves the absolute path to the wrapper script per platform.
import { spawn } from "node:child_process";
import { platform } from "node:os";
import { resolve } from "node:path";

const isWin = platform() === "win32";
const wrapper = resolve(process.cwd(), isWin ? "gradlew.bat" : "gradlew");
const args = process.argv.slice(2);

const proc = spawn(wrapper, args, { stdio: "inherit", shell: true });
proc.on("exit", (code) => process.exit(code ?? 0));
proc.on("error", (err) => {
  console.error(err);
  process.exit(1);
});
