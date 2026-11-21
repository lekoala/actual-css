const supportedEngines = ["firefox", "webkit"];
const requestedEngines = process.argv.slice(2);
const engines = requestedEngines.length ? requestedEngines : supportedEngines;

if (engines.some((engine) => !supportedEngines.includes(engine))) {
  console.error("Usage: bun run test:browsers [firefox] [webkit]");
  process.exit(1);
}

// Keep this subset independent of built assets and Chrome DevTools Protocol.
const files = [
  "./tests/browser/control-geometry.test.js",
  "./tests/browser/dirty.test.js",
  "./tests/browser/grid.test.js",
  "./tests/browser/timeline.test.js",
];

for (const engine of engines) {
  console.log(`\nBrowser tests: ${engine}`);
  const run = Bun.spawn([process.execPath, "test", ...files], {
    env: { ...process.env, ACTUAL_TEST_BROWSER: engine },
    stdout: "inherit",
    stderr: "inherit",
  });
  if ((await run.exited) !== 0) process.exitCode = 1;
}
