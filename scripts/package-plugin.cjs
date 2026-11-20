const { execFileSync } = require("node:child_process");
const { mkdirSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");
const { zipSync } = require("fflate");

function readPluginFile(path) {
  return execFileSync("git", ["cat-file", "blob", `HEAD:${path}`], {
    maxBuffer: 5 * 1024 * 1024,
  });
}

const manifestBytes = readPluginFile("manifest.json");
const manifest = JSON.parse(manifestBytes);
const version = manifest.version;
if (typeof version !== "string" || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version)) {
  throw new Error("Expected a three-part plugin version");
}
const [major, minor, patch] = version.split(".").map(Number);
if (major === 0 || (major === 1 && minor === 0 && patch === 0)) {
  throw new Error("Plugin version is below the release baseline");
}

const files = { "manifest.json": manifestBytes, LICENSE: readPluginFile("LICENSE") };
const resources = {
  assets: [manifest.icon],
  services: manifest.services.map(({ implementation }) => implementation.entry),
};
for (const [directory, paths] of Object.entries(resources)) {
  for (const path of paths) {
    if (!path.startsWith(`${directory}/`) ||
        !path.split("/").every((part) => /^[a-zA-Z0-9_-][a-zA-Z0-9_.-]*$/.test(part))) {
      throw new Error(`Invalid plugin resource path: ${path}`);
    }
    files[path] = readPluginFile(path);
  }
}

const orderedFiles = Object.fromEntries(Object.keys(files).sort().map((name) => [name, files[name]]));
// Match the stored ZIP entries and Unix file metadata used by the original packager.
const zip = zipSync(orderedFiles, {
  level: 0,
  mtime: new Date(2000, 0, 1),
  os: 3,
  attrs: 0o600 << 16,
});
if (zip.length > 5 * 1024 * 1024) throw new Error("Package exceeds 5 MiB");

const outputDir = process.argv[2];
mkdirSync(outputDir, { recursive: true });
writeFileSync(join(outputDir, `openai-compatible-demo-${version}.zip`), zip);
console.log(version);
