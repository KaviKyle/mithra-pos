#!/usr/bin/env python3
"""
Kimi Bridge - Use Kimi Web Chat (unlimited tokens) to code on your local files.

USAGE:
  1. Pack your project into a prompt:
     python kimi_bridge.py pack ./my-pos-project > prompt.txt

  2. Open prompt.txt, copy everything, paste into Kimi Web Chat.
     Ask Kimi: "Build the Product Catalog module based on the project below."

  3. Copy Kimi's full response, save as response.md

  4. Apply Kimi's changes back to your project:
     python kimi_bridge.py apply response.md ./my-pos-project

  5. Review changes with git diff, test, commit.

TIPS:
  - Add files you don't want sent to Kimi in .kimiignore (same format as .gitignore)
  - The script respects .gitignore automatically
  - Keep responses under ~50k tokens per message for best results
"""

import os
import sys
import re
import argparse
from pathlib import Path

# ─── CONFIG ──────────────────────────────────────────────────────────

MAX_FILE_SIZE = 100_000       # Skip files larger than 100KB (binaries, etc.)
MAX_TOTAL_SIZE = 500_000      # Warn if packed prompt exceeds ~500KB
DEFAULT_IGNORE_PATTERNS = {
    ".git", "node_modules", "dist", "build", ".next",
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
    ".env", ".env.local", ".env.production", ".env.development",
    "*.log", "*.tmp", "*.temp", ".DS_Store", "Thumbs.db",
    "coverage", ".nyc_output", ".vscode", ".idea",
    "*.min.js", "*.min.css", "*.map",
}

# ─── IGNORE LOGIC ────────────────────────────────────────────────────

def load_gitignore(project_dir):
    """Parse .gitignore and .kimiignore for patterns."""
    patterns = set(DEFAULT_IGNORE_PATTERNS)
    for filename in [".gitignore", ".kimiignore"]:
        path = project_dir / filename
        if path.exists():
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#"):
                        patterns.add(line)
    return patterns

def is_ignored(file_path, project_dir, patterns):
    """Check if a file matches any ignore pattern."""
    rel_path = file_path.relative_to(project_dir).as_posix()
    parts = rel_path.split("/")

    for pattern in patterns:
        # Exact match
        if rel_path == pattern or rel_path.endswith("/" + pattern):
            return True
        # Directory match
        if pattern in parts:
            return True
        # Wildcard suffix
        if pattern.startswith("*") and rel_path.endswith(pattern[1:]):
            return True
        # Wildcard prefix
        if pattern.endswith("*") and rel_path.startswith(pattern[:-1]):
            return True
    return False

# ─── PACK COMMAND ────────────────────────────────────────────────────

def pack_project(project_dir):
    """Read all project files and format them into a Kimi-ready prompt."""
    project_dir = Path(project_dir).resolve()
    if not project_dir.is_dir():
        print(f"Error: {project_dir} is not a directory", file=sys.stderr)
        sys.exit(1)

    patterns = load_gitignore(project_dir)
    files = []
    total_size = 0

    for root, _, filenames in os.walk(project_dir):
        for filename in filenames:
            file_path = Path(root) / filename

            if is_ignored(file_path, project_dir, patterns):
                continue

            try:
                size = file_path.stat().st_size
                if size > MAX_FILE_SIZE:
                    continue
                total_size += size
                files.append(file_path)
            except OSError:
                continue

    # Sort for consistency
    files.sort()

    # Build output
    output = []
    output.append("=" * 70)
    output.append("PROJECT CONTEXT — Paste this into Kimi Web Chat")
    output.append("=" * 70)
    output.append(f"Project: {project_dir.name}")
    output.append(f"Files: {len(files)}")
    output.append(f"Total size: {total_size:,} bytes")
    output.append("")
    output.append("INSTRUCTIONS FOR KIMI:")
    output.append("1. Read all files below to understand the project.")
    output.append("2. When modifying code, output the FULL file content.")
    output.append("3. Use this exact format for each file:")
    output.append("")
    output.append("### FILE: path/to/file.js")
    output.append("```javascript")
    output.append("// full file content here")
    output.append("```")
    output.append("")
    output.append("=" * 70)
    output.append("")

    for file_path in files:
        rel_path = file_path.relative_to(project_dir).as_posix()
        ext = file_path.suffix.lstrip(".") or "txt"

        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
        except Exception:
            continue

        output.append(f"### FILE: {rel_path}")
        output.append(f"```{ext}")
        output.append(content)
        output.append("```")
        output.append("")

    result = "\n".join(output)

    if total_size > MAX_TOTAL_SIZE:
        print(f"\n⚠️  WARNING: Prompt is {total_size:,} bytes. Kimi may truncate.", file=sys.stderr)
        print("Consider adding large files to .kimiignore", file=sys.stderr)

    return result

# ─── APPLY COMMAND ───────────────────────────────────────────────────

def apply_response(response_file, project_dir):
    """Parse Kimi's response and write files to disk."""
    project_dir = Path(project_dir).resolve()
    response_path = Path(response_file).resolve()

    if not response_path.exists():
        print(f"Error: Response file {response_path} not found", file=sys.stderr)
        sys.exit(1)

    with open(response_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    # Pattern: ### FILE: path/to/file.ext followed by ```lang ... ```
    pattern = r'###\s*FILE:\s*([^\n]+)\n```(?:[^\n]*)?\n(.*?)```'
    matches = re.findall(pattern, content, re.DOTALL)

    if not matches:
        print("No files found in response. Trying alternative format...", file=sys.stderr)
        # Try: ```lang:path/to/file
        pattern2 = r'```([^\n:]+):([^\n]+)\n(.*?)```'
        matches = re.findall(pattern2, content, re.DOTALL)
        matches = [(path, code) for _, path, code in matches]

    if not matches:
        print("Error: Could not parse any files from response.", file=sys.stderr)
        print("Make sure Kimi uses the format:", file=sys.stderr)
        print("  ### FILE: path/to/file.js", file=sys.stderr)
        print("  ```javascript", file=sys.stderr)
        print("  // code", file=sys.stderr)
        print("  ```", file=sys.stderr)
        sys.exit(1)

    created = []
    modified = []

    for filepath_str, file_content in matches:
        filepath_str = filepath_str.strip()
        # Clean up any accidental markdown in the path
        filepath_str = filepath_str.replace("`", "").strip()

        target_path = project_dir / filepath_str

        # Security: prevent writing outside project
        try:
            target_path.resolve().relative_to(project_dir.resolve())
        except ValueError:
            print(f"⚠️  Skipped (outside project): {filepath_str}", file=sys.stderr)
            continue

        # Create directories if needed
        target_path.parent.mkdir(parents=True, exist_ok=True)

        existed = target_path.exists()

        with open(target_path, "w", encoding="utf-8") as f:
            f.write(file_content)

        if existed:
            modified.append(filepath_str)
        else:
            created.append(filepath_str)

    print(f"\n✅ Applied {len(created) + len(modified)} file(s)")
    if created:
        print(f"   Created: {len(created)}")
        for f in created[:5]:
            print(f"      + {f}")
        if len(created) > 5:
            print(f"      ... and {len(created) - 5} more")
    if modified:
        print(f"   Modified: {len(modified)}")
        for f in modified[:5]:
            print(f"      ~ {f}")
        if len(modified) > 5:
            print(f"      ... and {len(modified) - 5} more")
    print(f"\n👉 Run: cd {project_dir} && git diff")

# ─── MAIN ────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Bridge between Kimi Web Chat and your local project",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python kimi_bridge.py pack ./my-project > prompt.txt
  python kimi_bridge.py apply response.md ./my-project
        """
    )
    subparsers = parser.add_subparsers(dest="command", help="Command to run")

    # Pack command
    pack_parser = subparsers.add_parser("pack", help="Pack project into a prompt")
    pack_parser.add_argument("project_dir", nargs="?", default=".", help="Project directory (default: current)")

    # Apply command
    apply_parser = subparsers.add_parser("apply", help="Apply Kimi's response to project")
    apply_parser.add_argument("response_file", help="Path to Kimi's response file (markdown)")
    apply_parser.add_argument("project_dir", nargs="?", default=".", help="Project directory (default: current)")

    args = parser.parse_args()

    if args.command == "pack":
        print(pack_project(args.project_dir))
    elif args.command == "apply":
        apply_response(args.response_file, args.project_dir)
    else:
        parser.print_help()
        sys.exit(1)

if __name__ == "__main__":
    main()
