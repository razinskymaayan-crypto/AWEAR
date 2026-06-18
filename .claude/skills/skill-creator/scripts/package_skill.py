#!/usr/bin/env python3
"""
Package a skill directory into a .skill file (zip archive).

Usage:
    python package_skill.py .claude/skills/<name>
    python package_skill.py .claude/skills/<name> --output /tmp/my-skill.skill
    python package_skill.py .claude/skills/<name> --list    # just list what would be packaged
"""

import argparse
import sys
import zipfile
from pathlib import Path


EXCLUDE_PATTERNS = {
    ".DS_Store",
    "__pycache__",
    ".pytest_cache",
    "*.pyc",
    "*.pyo",
    ".git",
    "*.egg-info",
    "node_modules",
    ".env",
    "*.log",
    "workspace",  # eval workspaces are not part of the skill
    "evals",      # eval sets stay local
}


def should_exclude(path: Path) -> bool:
    for part in path.parts:
        for pattern in EXCLUDE_PATTERNS:
            if pattern.startswith("*"):
                if part.endswith(pattern[1:]):
                    return True
            elif part == pattern:
                return True
    return False


def collect_files(skill_dir: Path) -> list[Path]:
    files = []
    for f in sorted(skill_dir.rglob("*")):
        if not f.is_file():
            continue
        rel = f.relative_to(skill_dir)
        if should_exclude(rel):
            continue
        files.append(f)
    return files


def main():
    parser = argparse.ArgumentParser(description="Package a skill directory into a .skill archive")
    parser.add_argument("skill_dir", help="Path to the skill directory")
    parser.add_argument("--output", help="Output path for .skill file (default: <name>.skill in cwd)")
    parser.add_argument("--list", action="store_true", help="List files without creating archive")
    args = parser.parse_args()

    skill_dir = Path(args.skill_dir)
    if not skill_dir.exists():
        print(f"Error: skill directory not found: {skill_dir}", file=sys.stderr)
        sys.exit(1)

    skill_md = skill_dir / "SKILL.md"
    if not skill_md.exists():
        print(f"Error: SKILL.md not found in {skill_dir}", file=sys.stderr)
        sys.exit(1)

    skill_name = skill_dir.name
    output_path = Path(args.output) if args.output else Path(f"{skill_name}.skill")

    files = collect_files(skill_dir)

    if args.list:
        print(f"Files that would be packaged from {skill_dir}:")
        total_bytes = 0
        for f in files:
            size = f.stat().st_size
            total_bytes += size
            print(f"  {f.relative_to(skill_dir)!s}  ({size:,} bytes)")
        print(f"\nTotal: {len(files)} files, {total_bytes:,} bytes")
        return

    with zipfile.ZipFile(output_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for f in files:
            arcname = f.relative_to(skill_dir)
            zf.write(f, arcname)
            print(f"  + {arcname}")

    size = output_path.stat().st_size
    print(f"\nPacked {len(files)} files → {output_path} ({size:,} bytes)")
    print(f"\nTo install: unzip '{output_path}' -d .claude/skills/{skill_name}/")


if __name__ == "__main__":
    main()
