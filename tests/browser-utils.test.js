import { expect, test } from "bun:test";
import { fixtureUrl } from "../scripts/utils/browser.js";

const browserModule = new URL("../scripts/utils/browser.js", import.meta.url).href;

for (const ci of ["", "true"]) {
  for (const available of [false, true]) {
    test(`browser availability: CI=${ci || "local"}, Chrome=${available}`, async () => {
      const script = `
        let opened = 0;
        let closed = 0;
        const failure = new Error("Chrome unavailable");
        const createView = () => {
          opened++;
          if (!${available}) throw failure;
          return { close() { closed++; } };
        };
        const { browserAvailable } = await import(${JSON.stringify(browserModule)});
        try {
          const first = await browserAvailable(createView);
          const second = await browserAvailable(createView);
          console.log(JSON.stringify({ first, second, opened, closed }));
        } catch (error) {
          if (error !== failure) throw error;
          console.log(JSON.stringify({ error: error.message, opened, closed }));
          process.exitCode = 1;
        }
      `;
      const proc = Bun.spawn([process.execPath, "--eval", script], {
        env: { ...process.env, CI: ci },
        stdout: "pipe",
        stderr: "pipe",
      });
      const [stdout, stderr, code] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
        proc.exited,
      ]);
      const mustFail = Boolean(ci) && !available;
      expect(stderr).toBe("");
      expect(code).toBe(mustFail ? 1 : 0);
      expect(JSON.parse(stdout)).toEqual(
        mustFail
          ? { error: "Chrome unavailable", opened: 1, closed: 0 }
          : { first: available, second: available, opened: 1, closed: available ? 1 : 0 },
      );
    });
  }
}

test("local browser fixtures need no HTTP server port", () => {
  const url = new URL(fixtureUrl("tests/browser/mobile-overflow.html"));
  expect(url.protocol).toBe("file:");
  expect(url.port).toBe("");
});
