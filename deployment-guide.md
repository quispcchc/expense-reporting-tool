# 웹 애플리케이션 배포 환경 구축 및 문제 해결 가이드

## **프로젝트 개요**

**현재 아키텍처:**
- Frontend: React/Vite (`http://localhost:5173`)
- Backend API: (`http://localhost:8000`)
- Database: PostgreSQL (Docker)
- 컨테이너화: Docker & Docker Compose

**현재 상황:**
- 로컬 개발 환경에서는 모든 기능이 정상 작동
- 다른 서버에 배포 시 프론트엔드는 접근 가능하나 로그인 실패
- 브라우저 콘솔에서 다음 에러 발생:


api.js:73 API Error: No response from server. This may be a timeout or network error. undefined AuthContext.jsx:80 Error occurred while login Object 127.0.0.1:8000/api/login:1 Failed to load resource: net::ERR_BLOCKED_BY_CLIENT

---

## **문제 원인 분석**

### **핵심 문제: 잘못된 API 주소 참조**

프론트엔드 코드가 `127.0.0.1:8000` 또는 `localhost:8000`으로 하드코딩되어 있어 배포 환경에서 문제가 발생합니다.

**로컬 환경 vs 배포 환경의 차이:**

| 환경 | 브라우저 위치 | `127.0.0.1:8000` 의미 | 결과 |
|------|---------------|----------------------|------|
| **로컬 개발** | 개발자 PC | 개발자 PC의 백엔드 서버 | ✅ 정상 작동 |
| **배포 환경** | 사용자 PC | 사용자 PC의 로컬호스트 | ❌ 연결 실패 |

**추가 문제:**
- `ERR_BLOCKED_BY_CLIENT`: 브라우저 확장 프로그램(AdBlock 등)이 요청 차단
- CORS 이슈: 서로 다른 포트 간 통신 문제

---

## **해결 방안**

### **방안 1: 즉시 해결 (임시)**

환경 변수를 사용하여 API 주소를 동적으로 설정합니다.

**1단계: 환경 변수 파일 생성**

`.env.development`:
```bash
VITE_API_URL=http://localhost:8000
````

`.env.production`:

```bash
CopyVITE_API_URL=http://서버IP주소:8000
```

**2단계: API 호출 코드 수정**

```javascript
Copy// api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const login = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
```

**3단계: 백엔드 CORS 설정**

```python
Copy# FastAPI 예시
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:5173",
    "http://서버IP주소:5173",  # 배포된 프론트엔드 주소 추가
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### **방안 2: Nginx 리버스 프록시 (권장)**

프로덕션 환경의 표준 아키텍처로, 근본적인 문제 해결과 함께 확장성을 확보합니다.

**장점:**

- CORS 문제 완전 해결 (Single Origin)
- IP/포트 하드코딩 불필요
- 보안 강화 및 성능 최적화
- SSL/TLS 적용 용이
- 로드 밸런싱 확장 가능

---

## **개발/배포 환경 분리 전략**

### **권장 접근법: 환경별 최적화**

|구분|개발 환경|배포 환경|
|---|---|---|
|**프록시**|Vite Dev Server|Nginx Reverse Proxy|
|**API 경로**|`/api` (상대 경로)|`/api` (상대 경로)|
|**실행 방식**|`npm run dev` + Docker Compose|Docker Compose (Nginx 포함)|
|**주요 목적**|개발 속도, HMR, 디버깅|안정성, 보안, 성능|

### **개발 환경 설정**

**vite.config.js**:

```javascript
Copyimport { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
```

**docker-compose.dev.yml**:

```yaml
Copyversion: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DEBUG=True
    volumes:
      - ./backend:/app
    depends_on:
      - db
    networks:
      - dev-network

  db:
    image: postgres:15
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=dev_user
      - POSTGRES_PASSWORD=dev_pass
      - POSTGRES_DB=dev_db
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
    networks:
      - dev-network

networks:
  dev-network:
    driver: bridge

volumes:
  postgres_dev_data:
```

### **배포 환경 설정**

**nginx/default.conf**:

```nginx
Copyupstream frontend {
    server frontend:80;
}

upstream backend {
    server backend:8000;
}

server {
    listen 80;
    server_name _;

    # 프론트엔드 라우팅
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 백엔드 API 라우팅
    location /api/ {
        proxy_pass http://backend/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

**docker-compose.prod.yml**:

```yaml
Copyversion: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - frontend
      - backend
    restart: unless-stopped
    networks:
      - prod-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    expose:
      - "80"
    restart: unless-stopped
    networks:
      - prod-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    expose:
      - "8000"
    environment:
      - DEBUG=False
    depends_on:
      - db
    restart: unless-stopped
    networks:
      - prod-network

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=prod_user
      - POSTGRES_PASSWORD=prod_pass
      - POSTGRES_DB=prod_db
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - prod-network

networks:
  prod-network:
    driver: bridge

volumes:
  postgres_prod_data:
```

---

## **실행 워크플로우**

### **개발 환경 실행**

```bash
Copy# 터미널 1: 백엔드와 DB 실행
docker compose -f docker-compose.dev.yml up

# 터미널 2: 프론트엔드 실행
cd frontend
npm run dev
```

**특징:**

- HMR(Hot Module Replacement) 활용
- 각 서비스 로그 직접 확인 가능
- 빠른 개발과 디버깅

### **배포 환경 실행**

```bash
Copy# 배포 전 로컬 테스트
docker compose -f docker-compose.prod.yml up --build

# 실제 서버 배포
docker compose -f docker-compose.prod.yml up -d --build
```

**특징:**

- 단일 진입점 (포트 80)
- 외부 직접 접근 차단
- 프로덕션 최적화

---

## **프론트엔드 코드 수정**

**최종 API 호출 코드 (개발/배포 공통)**:

```javascript
Copy// api.js
const API_BASE_URL = '/api';  // 상대 경로 사용

export const login = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
```

**환경 변수 설정**:

```bash
Copy# .env.development
VITE_API_URL=/api

# .env.production  
VITE_API_URL=/api
```

---

## **HTTPS 설정 (선택사항)**

프로덕션 환경에서 HTTPS를 적용하려면 Nginx 설정을 확장합니다:

```nginx
Copyserver {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL 보안 설정
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    location / {
        proxy_pass http://frontend;
        # 프록시 헤더 설정...
    }

    location /api/ {
        proxy_pass http://backend/api/;
        # 프록시 헤더 설정...
    }
}

# HTTP를 HTTPS로 리다이렉트
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## **체크리스트**

### **즉시 해결이 필요한 경우**

- [ ]  프론트엔드에서 `127.0.0.1` 하드코딩 제거
- [ ]  환경 변수 설정 및 프론트엔드 리빌드
- [ ]  백엔드 CORS 설정에 배포 서버 주소 추가
- [ ]  도커 포트 바인딩 확인 (`127.0.0.1:8000:8000` → `8000:8000`)
- [ ]  서버 방화벽에서 8000번 포트 개방
- [ ]  브라우저 확장 프로그램 비활성화 후 테스트

### **Nginx 리버스 프록시 도입**

- [ ]  `nginx/default.conf` 파일 생성
- [ ]  `docker-compose.prod.yml` 파일 생성
- [ ]  프론트엔드 API 호출을 상대 경로(`/api`)로 변경
- [ ]  개발용 `vite.config.js` 프록시 설정 추가
- [ ]  `docker-compose.dev.yml` 파일 생성 (개발 환경용)
- [ ]  로컬에서 프로덕션 구성 테스트
- [ ]  실제 서버에 배포 및 테스트

### **브라우저 에러 해결**

- [ ]  시크릿/인코그니토 모드에서 테스트
- [ ]  AdBlock, uBlock Origin 등 확장 프로그램 일시 비활성화
- [ ]  브라우저 캐시 강제 새로고침 (Ctrl+F5)

---

## **배포 자동화 스크립트**

**deploy.sh**:

```bash
Copy#!/bin/bash

echo "🚀 Starting production deployment..."

echo "📦 Building production images..."
docker compose -f docker-compose.prod.yml build

echo "🛑 Stopping existing containers..."
docker compose -f docker-compose.prod.yml down

echo "🔄 Starting production containers..."
docker compose -f docker-compose.prod.yml up -d

echo "✅ Deployment complete!"
echo "🔍 Container status:"
docker compose -f docker-compose.prod.yml ps

echo "🌐 Application should be available at: http://서버IP"
```

---

## **결론 및 권장사항**

### **즉시 적용 가능한 해결책**

1. **개발 환경**: Vite 프록시 + 상대 경로 사용
2. **배포 환경**: Nginx 리버스 프록시 도입
3. **단계적 접근**: 로컬 프로덕션 테스트 → 실제 배포

### **장기적 이점**

- **개발 생산성 향상**: HMR과 빠른 피드백 루프
- **배포 안정성**: 프로덕션 표준 아키텍처
- **확장성**: 로드 밸런싱, 캐싱, SSL 등 확장 기능
- **보안 강화**: 백엔드 직접 노출 방지

현재 발생한 `127.0.0.1:8000` 접근 문제와 `ERR_BLOCKED_BY_CLIENT` 에러는 위 방법들을 통해 근본적으로 해결할 수 있으며, 동시에 확장 가능하고 안정적인 배포 환경을 구축할 수 있습니다.