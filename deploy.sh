#!/bin/bash

# 정부지원사업 공고 해결사 - Docker 배포 스크립트
# OCI Ubuntu 환경용

set -e

echo "🚀 정부지원사업 공고 해결사 배포 시작..."

# Docker 설치 확인
if ! command -v docker &> /dev/null; then
    echo "📦 Docker 설치 중..."
    sudo apt-get update
    sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    sudo usermod -aG docker $USER
    echo "✅ Docker 설치 완료"
fi

# Docker Compose 설치 확인
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Docker Compose 설치 중..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose 설치 완료"
fi

# 기존 컨테이너 정리
echo "🧹 기존 컨테이너 정리 중..."
docker-compose down 2>/dev/null || true

# 이미지 빌드 및 실행
echo "🔨 Docker 이미지 빌드 중..."
docker-compose build --no-cache

echo "🚀 컨테이너 시작 중..."
docker-compose up -d

echo ""
echo "✅ 배포 완료!"
echo "🌐 http://$(curl -s ifconfig.me):80 에서 접속 가능합니다."
echo ""
echo "📋 유용한 명령어:"
echo "  - 로그 확인: docker-compose logs -f"
echo "  - 상태 확인: docker-compose ps"
echo "  - 중지: docker-compose down"
echo "  - 재시작: docker-compose restart"
