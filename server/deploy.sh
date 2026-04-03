#!/bin/bash
# 楹联 API 部署脚本
# 服务器: 175.178.191.108
# 域名: api.yinglian.site (HTTPS)
# 后端: Go 服务监听 8080 端口

set -e

SERVER="ubuntu@175.178.191.108"
REMOTE_DIR="/opt/yinglian-api"
CERT_DIR="/etc/nginx/ssl"
NGINX_CONF="/etc/nginx/sites-available/api.yinglian.site"
NGINX_LINK="/etc/nginx/sites-enabled/api.yinglian.site"
SERVICE_NAME="yinglian-api"

echo "=== 楹联 API 部署 ==="

# ---- 1. 本地编译 Go 二进制 ----
echo "[1/5] 编译 Go 二进制 (linux/amd64)..."
cd "$(dirname "$0")"
GOOS=linux GOARCH=amd64 go build -o couples_linux .
echo "  编译完成: couples_linux"

# ---- 2. 上传文件到服务器 ----
echo "[2/5] 上传文件到服务器..."

# 创建远程目录
ssh "$SERVER" "sudo mkdir -p $REMOTE_DIR/static/fonts"

# 上传二进制
scp couples_linux "$SERVER:/tmp/couples_linux"
ssh "$SERVER" "sudo mv /tmp/couples_linux $REMOTE_DIR/couples && sudo chmod +x $REMOTE_DIR/couples"

# 上传数据库
scp yinglian_extract.db "$SERVER:/tmp/yinglian_extract.db"
ssh "$SERVER" "sudo mv /tmp/yinglian_extract.db $REMOTE_DIR/"

# 上传静态资源
scp -r static/fonts/* "$SERVER:/tmp/"
ssh "$SERVER" "sudo mv /tmp/*.woff2 $REMOTE_DIR/static/fonts/ 2>/dev/null; sudo mv /tmp/*.otf $REMOTE_DIR/static/fonts/ 2>/dev/null; true"

if [ -f static/share-bg.jpg ]; then
    scp static/share-bg.jpg "$SERVER:/tmp/share-bg.jpg"
    ssh "$SERVER" "sudo mv /tmp/share-bg.jpg $REMOTE_DIR/static/"
fi

# 上传 .env
scp .env.production "$SERVER:/tmp/.env"
ssh "$SERVER" "sudo mv /tmp/.env $REMOTE_DIR/.env"

echo "  文件上传完成"

# ---- 3. 上传 SSL 证书 ----
echo "[3/5] 上传 SSL 证书..."
CERT_SRC="$(dirname "$0")/../../api.yinglian.site_nginx"

ssh "$SERVER" "sudo mkdir -p $CERT_DIR"
scp "$CERT_SRC/api.yinglian.site_bundle.crt" "$SERVER:/tmp/api.yinglian.site_bundle.crt"
scp "$CERT_SRC/api.yinglian.site.key" "$SERVER:/tmp/api.yinglian.site.key"
ssh "$SERVER" "sudo mv /tmp/api.yinglian.site_bundle.crt $CERT_DIR/ && sudo mv /tmp/api.yinglian.site.key $CERT_DIR/ && sudo chmod 600 $CERT_DIR/api.yinglian.site.key"
echo "  证书上传完成"

# ---- 4. 配置 nginx ----
echo "[4/5] 配置 nginx..."
scp nginx_api.conf "$SERVER:/tmp/api.yinglian.site"
ssh "$SERVER" "sudo mv /tmp/api.yinglian.site $NGINX_CONF && sudo ln -sf $NGINX_CONF $NGINX_LINK && sudo nginx -t && sudo systemctl reload nginx"
echo "  nginx 配置完成"

# ---- 5. 配置并启动 systemd 服务 ----
echo "[5/5] 配置 systemd 服务..."

ssh "$SERVER" "cat > /tmp/${SERVICE_NAME}.service << 'EOF'
[Unit]
Description=Yinglian API Server
After=network.target

[Service]
Type=simple
WorkingDirectory=$REMOTE_DIR
ExecStart=$REMOTE_DIR/couples
EnvironmentFile=$REMOTE_DIR/.env
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
sudo mv /tmp/${SERVICE_NAME}.service /etc/systemd/system/ && \
sudo systemctl daemon-reload && \
sudo systemctl enable ${SERVICE_NAME} && \
sudo systemctl restart ${SERVICE_NAME}"

echo "  服务启动完成"

# ---- 清理本地编译产物 ----
rm -f couples_linux

echo ""
echo "=== 部署完成 ==="
echo "API 地址: https://api.yinglian.site"
echo "检查服务状态: ssh $SERVER 'sudo systemctl status $SERVICE_NAME'"
