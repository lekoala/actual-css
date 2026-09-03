import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..", "..");

function packageJson() {
  return JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
}

export function publicJsExports() {
  return Object.keys(packageJson().exports).filter(
    (exportPath) =>
      exportPath === "./js" || (exportPath.startsWith("./js/") && !exportPath.includes("*")),
  );
}

export function sourceModuleForJsExport(exportPath) {
  return exportPath === "./js" ? "index" : exportPath.slice("./js/".length);
}
