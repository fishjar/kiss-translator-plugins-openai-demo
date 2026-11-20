import json
import re
import subprocess
import sys
from pathlib import Path
from zipfile import ZIP_STORED, ZipFile, ZipInfo


def read_plugin_file(path):
    return subprocess.check_output(["git", "cat-file", "blob", f"HEAD:{path}"])


def main(output_dir):
    manifest_bytes = read_plugin_file("manifest.json")
    manifest = json.loads(manifest_bytes)
    version = manifest["version"]
    if not re.fullmatch(r"(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)", version, re.ASCII):
        raise ValueError("Expected a three-part plugin version")
    if tuple(map(int, version.split("."))) < (1, 0, 1):
        raise ValueError("Plugin version is below the release baseline")

    entries = [service["implementation"]["entry"] for service in manifest["services"]]
    resources = {"assets": [manifest["icon"]], "services": entries}
    files = {"manifest.json": manifest_bytes, "LICENSE": read_plugin_file("LICENSE")}
    for directory, paths in resources.items():
        for path in paths:
            if not path.startswith(f"{directory}/") or any(
                not re.fullmatch(r"[a-zA-Z0-9_-][a-zA-Z0-9_.-]*", part)
                for part in path.split("/")
            ):
                raise ValueError(f"Invalid plugin resource path: {path}")
            files[path] = read_plugin_file(path)

    output_dir.mkdir(parents=True, exist_ok=True)
    output = output_dir / f"openai-compatible-demo-{version}.zip"
    with ZipFile(output, "w", compression=ZIP_STORED) as archive:
        for path in sorted(files):
            entry = ZipInfo(path, date_time=(2000, 1, 1, 0, 0, 0))
            entry.create_system = 3
            archive.writestr(entry, files[path])

    if output.stat().st_size > 5 * 1024 * 1024:
        raise ValueError("Package exceeds 5 MiB")
    print(version)


if __name__ == "__main__":
    main(Path(sys.argv[1]))
