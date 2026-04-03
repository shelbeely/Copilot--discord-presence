#!/usr/bin/env bash
# install.sh — adds copilot-discord-presence hooks to any GitHub repository.
#
# Usage (run from the root of your repo):
#   curl -fsSL https://raw.githubusercontent.com/shelbeely/Copilot--discord-presence/main/install.sh | bash
#
# What it does:
#   1. Downloads the three hook files into .github/hooks/
#   2. Downloads a starter copilot-setup-steps.yml (skipped if one exists)
#   3. Prints next-steps instructions
set -euo pipefail

REPO="shelbeely/Copilot--discord-presence"
BRANCH="main"
BASE_URL="https://raw.githubusercontent.com/${REPO}/${BRANCH}/template"

echo "[copilot-presence] Installing hooks into $(pwd)..."

# ── hook scripts ──────────────────────────────────────────────────────────────
mkdir -p .github/hooks/scripts

curl -fsSL "${BASE_URL}/.github/hooks/scripts/session-start.sh" \
  -o .github/hooks/scripts/session-start.sh
chmod +x .github/hooks/scripts/session-start.sh

curl -fsSL "${BASE_URL}/.github/hooks/scripts/validate.sh" \
  -o .github/hooks/scripts/validate.sh
chmod +x .github/hooks/scripts/validate.sh

echo "  ✔  .github/hooks/scripts/session-start.sh"
echo "  ✔  .github/hooks/scripts/validate.sh"

# ── copilot.json ──────────────────────────────────────────────────────────────
if [ -f .github/hooks/copilot.json ]; then
  echo "  ⚠  .github/hooks/copilot.json already exists — skipping (merge manually if needed)"
else
  curl -fsSL "${BASE_URL}/.github/hooks/copilot.json" \
    -o .github/hooks/copilot.json
  echo "  ✔  .github/hooks/copilot.json"
fi

# ── copilot-setup-steps.yml ───────────────────────────────────────────────────
mkdir -p .github/workflows

if [ -f .github/workflows/copilot-setup-steps.yml ]; then
  echo "  ⚠  .github/workflows/copilot-setup-steps.yml already exists — skipping"
else
  curl -fsSL "${BASE_URL}/.github/workflows/copilot-setup-steps.yml" \
    -o .github/workflows/copilot-setup-steps.yml
  echo "  ✔  .github/workflows/copilot-setup-steps.yml"
fi

# ── next steps ────────────────────────────────────────────────────────────────
echo ""
echo "✅  copilot-discord-presence installed!"
echo ""
echo "Next steps:"
echo "  1. Add your bot token as a secret:"
echo "     GitHub → Settings → Environments → copilot → Secrets → New secret"
echo "     Name:  DISCORD_BOT_TOKEN"
echo "     Value: your Discord bot token"
echo ""
echo "  2. Commit the new files:"
echo "     git add .github && git commit -m 'chore: add copilot-discord-presence'"
echo "     git push"
echo ""
echo "  3. Copilot will show Discord presence on its next session. 🎮"
