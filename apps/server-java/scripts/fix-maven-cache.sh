#!/usr/bin/env bash
# 清理因网络中断导致的损坏 Maven 缓存，然后强制重新下载
set -euo pipefail

ARTIFACTS=(
  "com/fasterxml/jackson/core/jackson-databind/2.14.2"
  "net/java/dev/jna/jna-platform/5.13.0"
  "net/java/dev/jna/jna/5.13.0"
  "org/apache/commons/commons-compress/1.25.0"
)

M2="${HOME}/.m2/repository"
for path in "${ARTIFACTS[@]}"; do
  if [[ -d "${M2}/${path}" ]]; then
    echo "删除损坏缓存: ${M2}/${path}"
    rm -rf "${M2}/${path}"
  fi
done

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -x /opt/homebrew/opt/openjdk@17/bin/java ]]; then
  export JAVA_HOME="/opt/homebrew/opt/openjdk@17"
elif [[ -x /usr/local/opt/openjdk@17/bin/java ]]; then
  export JAVA_HOME="/usr/local/opt/openjdk@17"
fi
export PATH="${JAVA_HOME:+$JAVA_HOME/bin:}$PATH"

./mvnw -U dependency:resolve -q
echo "依赖已重新解析，可再执行: npm run dev:server-java"
