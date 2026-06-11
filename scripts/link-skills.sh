#!/usr/bin/env bash
#
# Symlink every promoted skill (engineering/, productivity/, design/) into
# ~/.claude/skills/<name>, so the local Claude Code / Codex CLI can find them.
#
# Idempotent: re-running is safe. Skips deprecated/. Detects and refuses the
# "self-reference" case where ~/.claude/skills is already a symlink into this
# repo (which would write symlinks back into the working tree).
#
# Usage:  ./scripts/link-skills.sh

set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
SKILLS_DIR="$REPO/skills"
DEST="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"

if [ ! -d "$SKILLS_DIR" ]; then
  echo "error: $SKILLS_DIR not found" >&2
  exit 1
fi

# Refuse to write symlinks into the working tree if ~/.claude/skills already
# points into this repo. macOS APFS is case-insensitive but realpath is
# case-preserving, so a plain case comparison misses the trap; we use
# nocasematch for the pattern test.
dest_real="$(python3 -c 'import os,sys; print(os.path.realpath(sys.argv[1]))' "$DEST" 2>/dev/null || true)"
repo_real="$(python3 -c 'import os,sys; print(os.path.realpath(sys.argv[1]))' "$REPO")"
if [ -n "$dest_real" ]; then
  shopt -s nocasematch
  case "$dest_real" in
    "$repo_real"|"$repo_real"/*)
      echo "error: $DEST resolves to $dest_real, which is inside this repo." >&2
      echo "Remove it (rm \"$DEST\") and re-run; the script will recreate it as a real directory." >&2
      shopt -u nocasematch
      exit 1
      ;;
  esac
  shopt -u nocasematch
fi

mkdir -p "$DEST"

linked=0
skipped=0

for bucket in engineering productivity design; do
  [ -d "$SKILLS_DIR/$bucket" ] || continue
  for skill_md in "$SKILLS_DIR/$bucket"/*/SKILL.md; do
    [ -f "$skill_md" ] || continue
    src="$(dirname "$skill_md")"
    name="$(basename "$src")"
    target="$DEST/$name"

    if [ -e "$target" ] && [ ! -L "$target" ]; then
      rm -rf "$target"
    fi

    ln -sfn "$src" "$target"
    echo "linked  $name -> $src"
    linked=$((linked + 1))
  done
done

# Explicitly walk hidden buckets so we can say what we skipped.
for bucket in personal in-progress deprecated; do
  [ -d "$SKILLS_DIR/$bucket" ] || continue
  for skill_md in "$SKILLS_DIR/$bucket"/*/SKILL.md; do
    [ -f "$skill_md" ] || continue
    name="$(basename "$(dirname "$skill_md")")"
    echo "skipped $name (bucket: $bucket, not promoted)"
    skipped=$((skipped + 1))
  done
done

echo "---"
echo "$linked skill(s) linked, $skipped hidden skill(s) skipped"
echo "install root: $DEST"
