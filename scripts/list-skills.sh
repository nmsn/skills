#!/usr/bin/env bash
#
# List every SKILL.md in the repository, grouped by bucket, with the
# SKILL.md frontmatter `name` field for each. Used to verify layout and to
# audit which skills are promoted vs. hidden.
#
# Usage:  ./scripts/list-skills.sh

set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO"

for bucket in engineering productivity design personal in-progress deprecated; do
  dir="skills/$bucket"
  [ -d "$dir" ] || continue
  echo "## $bucket/"
  found=0
  for skill_md in "$dir"/*/SKILL.md; do
    [ -f "$skill_md" ] || continue
    # Strip `name:`, optional spaces, and an optional surrounding pair of
    # double quotes. Handles both `name: foo` and `name: "foo"`.
    name=$(awk '/^name:/{sub(/^name:[[:space:]]*/,""); gsub(/"/,""); print; exit}' "$skill_md")
    [ -z "$name" ] && name="$(basename "$(dirname "$skill_md")")"
    echo "  - $name  (${skill_md#./})"
    found=$((found + 1))
  done
  if [ "$found" -eq 0 ]; then
    echo "  (empty)"
  fi
done
