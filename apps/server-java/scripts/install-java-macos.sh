#!/usr/bin/env bash
set -euo pipefail

if ! command -v brew >/dev/null 2>&1; then
  cat <<'EOF' >&2
未找到 Homebrew。

请任选一种方式安装 JDK 17：
  • 安装 Homebrew 后重试本脚本：https://brew.sh
  • 直接下载安装包（推荐，装完即可用）：
    https://adoptium.net/temurin/releases/?version=17&os=mac&arch=aarch64
    （Intel Mac 选 x64）
EOF
  exit 1
fi

echo "方式 A：安装 Temurin JDK 17（推荐，自动注册到系统）..."
if brew install --cask temurin@17; then
  echo ""
  echo "安装完成。请关闭并重新打开终端，然后执行："
  echo "  java -version"
  echo "  npm run dev:server-java"
  exit 0
fi

echo ""
echo "方式 B：改用 Homebrew openjdk@17..."
brew install openjdk@17

BREW_PREFIX="$(brew --prefix openjdk@17)"
SHELL_RC="${HOME}/.zshrc"
EXPORT_LINE="export PATH=\"${BREW_PREFIX}/bin:\$PATH\""

if ! grep -Fq "${BREW_PREFIX}/bin" "${SHELL_RC}" 2>/dev/null; then
  {
    echo ""
    echo "# OpenJDK 17 (product-ideas server-java)"
    echo "${EXPORT_LINE}"
  } >> "${SHELL_RC}"
fi

echo ""
echo "已安装。请执行："
echo "  source ${SHELL_RC}"
echo "  java -version"
echo "  npm run dev:server-java"
