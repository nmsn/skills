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

# Regression guard: warn about SKILL.md files whose `description` field is
# unquoted AND contains ': ' (colon-space). The `skills` CLI silently drops
# such skills from discovery. See docs/adr/0002-bilingual-skill-descriptions.md.
echo ""
echo "## frontmatter lint"
lint_problems=0
for skill_md in $(find skills -name SKILL.md | sort); do
  [ -f "$skill_md" ] || continue
  # Read the first `description:` line, strip the leading key prefix.
  desc_value=$(awk '/^description:[[:space:]]*/{sub(/^description:[[:space:]]*/,""); print; exit}' "$skill_md")
  # Quoted values (start with ") are safe — they parse as YAML strings
  # regardless of inner content.
  first_char=${desc_value:0:1}
  if [ "$first_char" = '"' ]; then
    continue
  fi
  # Unquoted: warn if it contains ': '.
  if printf '%s' "$desc_value" | grep -q ': '; then
    echo "  WARN  $skill_md"
    echo "        unquoted description contains ': ' — will be dropped by the skills CLI"
    echo "        fix: wrap the value in double quotes"
    lint_problems=$((lint_problems + 1))
  fi
done

if [ "$lint_problems" -eq 0 ]; then
  echo "  (no problems)"
fi
