#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

resolve_java_home() {
  if [[ -n "${JAVA_HOME:-}" && -x "${JAVA_HOME}/bin/java" ]]; then
    printf '%s' "$JAVA_HOME"
    return 0
  fi

  local candidate jvm_home
  for candidate in \
    /opt/homebrew/opt/openjdk@17 \
    /usr/local/opt/openjdk@17 \
    /opt/homebrew/opt/openjdk@21 \
    /usr/local/opt/openjdk@21; do
    if [[ -x "${candidate}/bin/java" ]]; then
      printf '%s' "$candidate"
      return 0
    fi
  done

  for jvm_home in /Library/Java/JavaVirtualMachines/*/Contents/Home; do
    if [[ -x "${jvm_home}/bin/java" ]]; then
      printf '%s' "$jvm_home"
      return 0
    fi
  done

  if command -v /usr/libexec/java_home >/dev/null 2>&1; then
    if jvm_home="$(/usr/libexec/java_home -v 17+ 2>/dev/null)"; then
      printf '%s' "$jvm_home"
      return 0
    fi
    if jvm_home="$(/usr/libexec/java_home 2>/dev/null)"; then
      printf '%s' "$jvm_home"
      return 0
    fi
  fi

  return 1
}

if ! JAVA_HOME="$(resolve_java_home)"; then
  cat <<'EOF' >&2
未检测到 Java 运行环境（JDK 17+）。

请先安装 JDK，任选其一：

  1) 一键脚本（需 Homebrew）：
     bash apps/server-java/scripts/install-java-macos.sh

  2) 手动安装：
     brew install openjdk@17
     echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
     source ~/.zshrc

  3) 下载安装包：https://adoptium.net/temurin/releases/?version=17

安装后执行：java -version
EOF
  exit 1
fi

export JAVA_HOME
export PATH="${JAVA_HOME}/bin:${PATH}"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
elif [[ -f ../server/.env ]]; then
  set -a
  # shellcheck disable=SC1091
  source ../server/.env
  export PORT="${PORT:-8080}"
  set +a
fi

exec ./mvnw spring-boot:run "$@"
