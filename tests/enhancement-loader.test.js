import { afterEach, beforeEach, expect, test, describe, mock } from "bun:test";
import { setupDOM, cleanupDOM, nextMicrotask } from "./helpers/dom.js";

afterEach(() => {
	cleanupDOM();
});

beforeEach(async () => {
	const loader = await import("../src/js/enhancement-loader.js");
	loader.__reset();
});

function setupTestDOM(html = "") {
	setupDOM(html);
	Object.defineProperty(document, "baseURI", {
		value: "https://example.test/",
		configurable: true,
		writable: true,
	});
}

describe("enhancement-loader", () => {
	describe("loadEnhancement", () => {
		test("registers enhancement and returns loaded status", async () => {
			setupTestDOM('<div data-enhance="my-widget"></div>');

			const connectFn = mock(() => () => {});
			const mockModule = { default: connectFn };

			const { loadEnhancement, __setModuleImporter } = await import(
				"../src/js/enhancement-loader.js"
			);
			__setModuleImporter(() => Promise.resolve(mockModule));

			const result = await loadEnhancement("my-widget", "https://example.test/widget.js");

			expect(result).toEqual({ name: "my-widget", status: "loaded" });
		});

		test("returns skipped for same name and URL", async () => {
			setupTestDOM('<div data-enhance="my-widget"></div>');

			const mockModule = { default: () => () => {} };

			const { loadEnhancement, __setModuleImporter } = await import(
				"../src/js/enhancement-loader.js"
			);
			__setModuleImporter(() => Promise.resolve(mockModule));

			await loadEnhancement("my-widget", "https://example.test/widget.js");
			const result = await loadEnhancement("my-widget", "https://example.test/widget.js");

			expect(result).toEqual({ name: "my-widget", status: "skipped" });
		});

		test("throws for same name with different URL", async () => {
			setupTestDOM('<div data-enhance="my-widget"></div>');

			const mockModule = { default: () => () => {} };

			const { loadEnhancement, __setModuleImporter } = await import(
				"../src/js/enhancement-loader.js"
			);
			__setModuleImporter(() => Promise.resolve(mockModule));

			await loadEnhancement("my-widget", "https://example.test/widget-a.js");

			let error = null;
			try {
				loadEnhancement("my-widget", "https://example.test/widget-b.js");
			} catch (e) {
				error = e;
			}
			expect(error).not.toBeNull();
			expect(error.message).toMatch(/already declared/);
		});

		test("throws for missing default export", async () => {
			setupTestDOM('<div></div>');

			const { loadEnhancement, __setModuleImporter } = await import(
				"../src/js/enhancement-loader.js"
			);
			__setModuleImporter(() => Promise.resolve({}));

			await expect(
				loadEnhancement("bad-widget", "https://example.test/bad.js"),
			).rejects.toThrow(/default function/);
		});

		test("throws for invalid prepare export", async () => {
			setupTestDOM('<div></div>');

			const { loadEnhancement, __setModuleImporter } = await import(
				"../src/js/enhancement-loader.js"
			);
			__setModuleImporter(() =>
				Promise.resolve({ default: () => {}, prepare: "not a function" }),
			);

			await expect(
				loadEnhancement("bad-prepare", "https://example.test/bad.js"),
			).rejects.toThrow(/invalid prepare/);
		});

		test("prepare runs before registration", async () => {
			setupTestDOM('<div data-enhance="my-widget"></div>');

			const order = [];
			const prepareFn = mock(() => {
				order.push("prepare");
				return Promise.resolve();
			});

			const { loadEnhancement, __setModuleImporter } = await import(
				"../src/js/enhancement-loader.js"
			);
			__setModuleImporter(() =>
				Promise.resolve({
					default: () => () => {},
					prepare: prepareFn,
				}),
			);

			await loadEnhancement("my-widget", "https://example.test/widget.js");

			expect(order).toEqual(["prepare"]);
			expect(prepareFn).toHaveBeenCalledTimes(1);
		});

		test("clears entry on import failure, allows retry", async () => {
			setupTestDOM('<div></div>');

			let shouldFail = true;

			const { loadEnhancement, __setModuleImporter } = await import(
				"../src/js/enhancement-loader.js"
			);
			__setModuleImporter(() => {
				if (shouldFail) {
					return Promise.reject(new Error("Network error"));
				}
				return Promise.resolve({ default: () => () => {} });
			});

			await expect(
				loadEnhancement("flaky", "https://example.test/flaky.js"),
			).rejects.toThrow("Network error");

			shouldFail = false;
			const result = await loadEnhancement("flaky", "https://example.test/flaky.js");
			expect(result.status).toBe("loaded");
		});

		test("normalizes relative URLs to absolute", async () => {
			setupTestDOM('<div data-enhance="my-widget"></div>');

			let importedUrl = "";

			const { loadEnhancement, __setModuleImporter } = await import(
				"../src/js/enhancement-loader.js"
			);
			__setModuleImporter((url) => {
				importedUrl = url;
				return Promise.resolve({ default: () => () => {} });
			});

			await loadEnhancement("my-widget", "/resources/widget.js");

			expect(importedUrl).toBe("https://example.test/resources/widget.js");
		});
	});

	describe("loadEnhancements (DOM)", () => {
		test("parses manifest block and loads enhancements", async () => {
			setupTestDOM(`
				<script type="application/json" data-enhance-modules>
				{"select2": "https://example.test/select2.js"}
				</script>
				<select data-enhance="select2"></select>
			`);

			const connectFn = mock(() => () => {});

			const { loadEnhancements, __setModuleImporter } = await import(
				"../src/js/enhancement-loader.js"
			);
			__setModuleImporter(() => Promise.resolve({ default: connectFn }));

			const result = await loadEnhancements();

			expect(result.names).toContain("select2");
			expect(result.failed).toHaveLength(0);

			expect(
				document.querySelector("script[data-enhance-modules]"),
			).toBeNull();
		});

		test("returns failed for broken modules", async () => {
			setupTestDOM(`
				<script type="application/json" data-enhance-modules>
				{"broken": "https://example.test/broken.js"}
				</script>
			`);

			const { loadEnhancements, __setModuleImporter } = await import(
				"../src/js/enhancement-loader.js"
			);
			__setModuleImporter(() => Promise.reject(new Error("404")));

			const result = await loadEnhancements();

			expect(result.failed).toHaveLength(1);
			expect(result.failed[0].name).toBe("broken");
			expect(result.failed[0].error.message).toBe("404");
		});

		test("throws on conflicting name declarations across blocks", async () => {
			setupTestDOM(`
				<script type="application/json" data-enhance-modules>
				{"widget": "https://example.test/a.js"}
				</script>
				<script type="application/json" data-enhance-modules>
				{"widget": "https://example.test/b.js"}
				</script>
			`);

			const { loadEnhancements, __setModuleImporter } = await import(
				"../src/js/enhancement-loader.js"
			);
			__setModuleImporter(() =>
				Promise.resolve({ default: () => () => {} }),
			);

			await expect(loadEnhancements()).rejects.toThrow(/declared from both/);
		});

		test("loads all entries from manifest with allSettled", async () => {
			setupTestDOM(`
				<script type="application/json" data-enhance-modules>
				{"good": "https://example.test/good.js", "bad": "https://example.test/broken.js"}
				</script>
			`);

			const { loadEnhancements, __setModuleImporter } = await import(
				"../src/js/enhancement-loader.js"
			);
			__setModuleImporter((url) => {
				if (url.includes("good")) {
					return Promise.resolve({ default: () => () => {} });
				}
				return Promise.reject(new Error("404"));
			});

			const result = await loadEnhancements();

			expect(result.names).toContain("good");
			expect(result.failed).toHaveLength(1);
			expect(result.failed[0].name).toBe("bad");
		});
	});

	describe("watchEnhancementManifests", () => {
		test("watches dynamically inserted manifest blocks", async () => {
			setupTestDOM('<div data-enhance="my-widget"></div>');

			const connectFn = mock(() => () => {});
			const { watchEnhancementManifests, __setModuleImporter } = await import(
				"../src/js/enhancement-loader.js"
			);
			__setModuleImporter(() => Promise.resolve({ default: connectFn }));

			const watcher = watchEnhancementManifests();
			document.body.insertAdjacentHTML(
				"beforeend",
				'<script type="application/json" data-enhance-modules>{"my-widget": "https://example.test/widget.js"}</script>',
			);
			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(connectFn).toHaveBeenCalled();
			expect(document.querySelector("script[data-enhance-modules]")).toBeNull();
			watcher.disconnect();
		});

		test("keeps a failing manifest block for retry", async () => {
			setupTestDOM("");

			const originalError = console.error;
			console.error = () => {};

			try {
				const { watchEnhancementManifests, __setModuleImporter } = await import(
					"../src/js/enhancement-loader.js"
				);
				__setModuleImporter(() => Promise.reject(new Error("404")));

				const watcher = watchEnhancementManifests();
				document.body.insertAdjacentHTML(
					"beforeend",
					'<script type="application/json" data-enhance-modules>{"broken": "https://example.test/broken.js"}</script>',
				);
				await new Promise((resolve) => setTimeout(resolve, 10));

				expect(document.querySelector("script[data-enhance-modules]")).not.toBeNull();
				watcher.disconnect();
			} finally {
				console.error = originalError;
			}
		});
	});

	describe("loadResponse (HTTP header)", () => {
		test("reads Enhance-Modules header", async () => {
			setupTestDOM("");

			const connectFn = mock(() => () => {});

			const { loadResponse, __setModuleImporter } = await import(
				"../src/js/enhancement-loader.js"
			);
			__setModuleImporter(() => Promise.resolve({ default: connectFn }));

			const response = new Response("", {
				headers: {
					"Enhance-Modules": '{"calendar": "https://example.test/cal.js"}',
				},
			});

			const result = await loadResponse(response);

			expect(result.names).toContain("calendar");
			expect(connectFn).toHaveBeenCalledTimes(0);
		});

		test("returns empty result when no header", async () => {
			setupTestDOM("");

			const { loadResponse } = await import("../src/js/enhancement-loader.js");

			const response = new Response("");
			const result = await loadResponse(response);

			expect(result).toEqual({ names: [], failed: [], skipped: [] });
		});

		test("throws on invalid header JSON", async () => {
			setupTestDOM("");

			const { loadResponse } = await import("../src/js/enhancement-loader.js");

			const response = new Response("", {
				headers: { "Enhance-Modules": "{invalid json" },
			});

			await expect(loadResponse(response)).rejects.toThrow();
		});
	});

	describe("loadScript / loadStyle helpers", () => {
		test("loadScript deduplicates by URL", async () => {
			setupTestDOM("");

			const { loadScript } = await import("../src/js/enhancement-loader.js");

			const rawPromise = loadScript("https://example.test/vendor.js");
			expect(rawPromise).toBe(loadScript("https://example.test/vendor.js"));
			rawPromise.catch(() => {});
		});

		test("loadScript normalizes relative URLs", async () => {
			setupTestDOM("");

			const { loadScript } = await import("../src/js/enhancement-loader.js");

			const rawPromise = loadScript("/resources/app.js");
			expect(rawPromise).toBe(loadScript("https://example.test/resources/app.js"));
			rawPromise.catch(() => {});
		});

		test("loadScript different URLs produce different promises", async () => {
			setupTestDOM("");

			const { loadScript } = await import("../src/js/enhancement-loader.js");

			const promise1 = loadScript("https://example.test/a.js");
			const promise2 = loadScript("https://example.test/b.js");

			expect(promise1).not.toBe(promise2);
			promise1.catch(() => {});
			promise2.catch(() => {});
		});

		test("loadStyle deduplicates by URL", async () => {
			setupTestDOM("");

			const { loadStyle } = await import("../src/js/enhancement-loader.js");

			const rawPromise = loadStyle("https://example.test/style.css");
			expect(rawPromise).toBe(loadStyle("https://example.test/style.css"));
			rawPromise.catch(() => {});
		});

		test("loadStyle normalizes relative URLs", async () => {
			setupTestDOM("");

			const { loadStyle } = await import("../src/js/enhancement-loader.js");

			const rawPromise = loadStyle("/resources/app.css");
			expect(rawPromise).toBe(loadStyle("https://example.test/resources/app.css"));
			rawPromise.catch(() => {});
		});
	});

	describe("concurrent calls", () => {
		test("same name called twice shares one promise", async () => {
			setupTestDOM('<div data-enhance="widget"></div>');

			let importCount = 0;

			const { loadEnhancement, __setModuleImporter } = await import(
				"../src/js/enhancement-loader.js"
			);
			__setModuleImporter(() => {
				importCount++;
				return new Promise((resolve) =>
					setTimeout(() => resolve({ default: () => () => {} }), 10),
				);
			});

			const p1 = loadEnhancement("widget", "https://example.test/widget.js");
			const p2 = loadEnhancement("widget", "https://example.test/widget.js");

			const [r1, r2] = await Promise.all([p1, p2]);

			expect(importCount).toBe(1);
			expect(r1.status).toBe("loaded");
			expect(r2.status).toBe("skipped");
		});
	});
});
