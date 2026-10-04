/*
 * Layout hooks that an instance reads on itself stop at every nested instance
 * (.cluster, .grid). Hooks read by children (.switcher, .sidebar-layout),
 * context rhythm (--gap), page policy (--center-size) and role policy
 * (--form-actions-justify) keep inheriting.
 */
import { expect, test } from "bun:test";
import { browserAvailable, fixtureUrl, withBrowserPage } from "../../scripts/utils/browser.js";

const FIXTURE = "tests/browser/layout-scope.html";
const TIMEOUT = 60_000;

const baseTest = (await browserAvailable()) ? test : test.skip;
const it = (name, run) => baseTest(name, run, TIMEOUT);

it("cluster geometry stays local while rhythm and role policy inherit", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      const rows = await view.evaluate(`(() => {
        const read = (id) => {
          const style = getComputedStyle(document.getElementById(id));
          return {
            justify: style.justifyContent,
            align: style.alignItems,
            wrap: style.flexWrap,
            gap: style.columnGap,
          };
        };
        return Object.fromEntries(
          ["outer", "inherits-nothing", "own-hook", "actions", "inside-actions"].map((id) => [
            id,
            read(id),
          ]),
        );
      })()`);

      // The hooks apply where they are set.
      expect(rows.outer).toMatchObject({
        justify: "space-between",
        align: "start",
        wrap: "nowrap",
      });
      // A nested cluster falls back to the defaults, not the parent's values.
      expect(rows["inherits-nothing"]).toMatchObject({
        justify: "flex-start",
        align: "center",
        wrap: "wrap",
      });
      // A hook on the nested cluster itself still wins over the reset.
      expect(rows["own-hook"].justify).toBe("center");
      // Rhythm crosses cluster boundaries.
      expect(rows["inherits-nothing"].gap).toBe("13px");
      // Role policy set on a region reaches the action row inside it.
      expect(rows.actions.justify).toBe("flex-end");
      // The role relays into its own row's hooks; a cluster inside it keeps defaults.
      expect(rows["inside-actions"].justify).toBe("flex-start");
    },
    { artifactName: "cluster-scope" },
  );
});

it("form-actions applies its policy when it loads before cluster", async () => {
  await withBrowserPage(
    fixtureUrl("tests/browser/layout-scope-order.html"),
    async (view) => {
      const rows = await view.evaluate(`(() => {
        const read = (id) => {
          const style = getComputedStyle(document.getElementById(id));
          return { justify: style.justifyContent, align: style.alignItems };
        };
        return { actions: read("actions"), inside: read("inside-actions") };
      })()`);

      expect(rows.actions).toEqual({ justify: "flex-end", align: "start" });
      expect(rows.inside).toEqual({ justify: "flex-start", align: "center" });
    },
    { artifactName: "layout-scope-order" },
  );
});

it("grid hooks stop at nested grids; center, switcher and sidebar-layout inherit", async () => {
  await withBrowserPage(
    fixtureUrl(FIXTURE),
    async (view) => {
      // An empty string is the guaranteed-invalid value `initial` leaves behind.
      const hooks = await view.evaluate(`(() => {
        const hook = (id, name) =>
          getComputedStyle(document.getElementById(id)).getPropertyValue(name).trim();
        const basis = (id) => getComputedStyle(document.getElementById(id)).flexBasis;
        return {
          outerGrid: hook("outer-grid", "--grid-columns"),
          innerGrid: hook("inner-grid", "--grid-columns"),
          innerGridMin: hook("inner-grid", "--grid-min"),
          innerCenter: hook("inner-center", "--center-size"),
          switcherSibling: basis("switcher-sibling"),
          switcherNested: basis("switcher-nested"),
          sidebarNestedAside: basis("sidebar-nested-aside"),
        };
      })()`);

      // A grid reads its hooks on itself, so a nested grid starts from defaults.
      expect(hooks.outerGrid).toBe("100px 1fr");
      expect(hooks).toMatchObject({ innerGrid: "", innerGridMin: "" });
      // Page policy: a :root content width reaches every .center.
      expect(hooks.innerCenter).toBe("50rem");
      // Switcher and sidebar-layout hooks are read by the children, so a
      // nested instance that is itself a child must still see its parent's
      // value: these primitives keep inheriting (a reset broke exactly this).
      expect(hooks.switcherNested).toBe(hooks.switcherSibling);
      expect(hooks.sidebarNestedAside).toBe("160px");
    },
    { artifactName: "layout-scope" },
  );
});
