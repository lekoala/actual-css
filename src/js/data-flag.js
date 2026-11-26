export function readDataFlag(element, name, defaultValue = false) {
  const value = element?.getAttribute(name);
  return typeof value === "string" ? value.toLowerCase() !== "false" : defaultValue;
}
