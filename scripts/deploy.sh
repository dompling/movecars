#!/bin/bash
# 部署脚本 - 自动创建/获取 KV namespace 并部署

set -e

KV_NAMESPACE_NAME="movecars-MOVECARS_KV"
WRANGLER_TOML="wrangler.toml"

echo "🔍 检查 KV namespace..."

# 获取现有的 KV namespace 列表
KV_LIST=$(npx wrangler kv:namespace list 2>/dev/null || echo "[]")

# 查找是否已存在
KV_ID=$(echo "$KV_LIST" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")

# 如果通过环境变量传入了 KV_ID，优先使用
if [ -n "$CLOUDFLARE_KV_ID" ]; then
  KV_ID="$CLOUDFLARE_KV_ID"
  echo "✅ 使用环境变量中的 KV ID: $KV_ID"
fi

# 如果没有找到，尝试查找匹配的 namespace
if [ -z "$KV_ID" ]; then
  KV_ID=$(echo "$KV_LIST" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for item in data:
        if '$KV_NAMESPACE_NAME' in item.get('title', ''):
            print(item['id'])
            break
except: pass
" 2>/dev/null || echo "")
fi

# 如果还是没有，创建新的
if [ -z "$KV_ID" ]; then
  echo "📦 创建新的 KV namespace..."
  CREATE_OUTPUT=$(npx wrangler kv:namespace create "MOVECARS_KV" 2>&1)
  KV_ID=$(echo "$CREATE_OUTPUT" | grep -o 'id = "[^"]*"' | cut -d'"' -f2)
  echo "✅ 创建成功: $KV_ID"
else
  echo "✅ 找到现有 KV namespace: $KV_ID"
fi

if [ -z "$KV_ID" ]; then
  echo "❌ 无法获取 KV namespace ID"
  exit 1
fi

# 生成带有 KV 配置的 wrangler.toml
echo "📝 更新 wrangler.toml..."

cat > "$WRANGLER_TOML" << EOF
# 智能挪车通知系统 - Cloudflare Workers 配置
# 此文件由部署脚本自动生成
name = "movecars"
main = "src/worker/index.ts"
compatibility_date = "2024-12-18"
compatibility_flags = ["nodejs_compat"]

[dev]
port = 8787
local_protocol = "http"

[[kv_namespaces]]
binding = "MOVECARS_KV"
id = "$KV_ID"

[assets]
directory = "./dist"

[vars]
APP_NAME = "智能挪车"
EOF

echo "🚀 开始部署..."
npx wrangler deploy

echo "✅ 部署完成!"
