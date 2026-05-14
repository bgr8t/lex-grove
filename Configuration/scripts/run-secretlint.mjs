#!/usr/bin/env node

import os from "node:os";

// Some sandboxed macOS environments report zero CPUs, which crashes secretlint's
// worker pool setup. CI and normal developer machines keep the native value.
if (os.cpus().length === 0) {
  os.cpus = () => [
    {
      model: "sandbox",
      speed: 0,
      times: { user: 0, nice: 0, sys: 0, idle: 0, irq: 0 },
    },
  ];
}

try {
  const { run, cli } = await import("../../node_modules/secretlint/module/cli.js");
  const { exitStatus, stderr, stdout } = await run(cli.input, cli.flags);

  if (stdout) {
    console.log(stdout);
  }

  if (stderr) {
    console.error(stderr);
  }

  process.exit(exitStatus);
} catch (error) {
  console.error(error);
  process.exit(2);
}
