# Shop Admin Dashboard

쇼핑몰 관리를 위한 어드민 대시보드

## 빠른 시작

```bash
# 1. 패키지 설치
npm install --legacy-peer-deps

# 2. 환경 변수 설정
cp .env.example .env.local
# .env.local 파일에 Supabase 정보 입력

# 3. DB 스키마 적용 (Supabase SQL Editor)
# supabase/admin_schema.sql 실행

# 4. 개발 서버 실행
npm run dev
# http://localhost:3001
```

**기본 로그인**: `master` / `admin123`

---

## 환경 변수

`.env.local` 파일 필요:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # 선택
```

### 여러 환경 사용

```bash
# 기본 (.env.local 사용)
npm run dev

# 테스트 환경 (.env.test 사용)
yarn dev:test

# 다른 env 파일 지정
ENV_FILE=.env.dev yarn dev:test
ENV_FILE=.env.dev npx tsx scripts/insert-mock-data.ts
```

---

## 주요 기능

| 기능        | 설명                            | 권한         |
| ----------- | ------------------------------- | ------------ |
| 대시보드    | 통계 현황 (상품, 주문, 매출)    | 전체         |
| 상품 관리   | CRUD, 옵션, 추가상품, 이미지    | 전체         |
| 주문 관리   | 상태 변경, 배송 알림, 결제 취소 | 전체         |
| 회원 관리   | 포인트 조정, 쿠폰 발급          | 전체         |
| 쿠폰 관리   | 생성, 발급, 이력 조회           | 전체         |
| 매출 리포트 | 상품별 매출, 차트               | 전체         |
| 어드민 관리 | 계정 생성/삭제, 비밀번호 초기화 | **마스터만** |

---

## 권한

| 역할     | 설명                       |
| -------- | -------------------------- |
| `master` | 전체 기능 + 어드민 관리    |
| `admin`  | 어드민 관리 제외 전체 기능 |

---

## 프로젝트 구조

```
shop-admin/
├── app/
│   ├── dashboard/           # 메인 페이지들
│   │   ├── products/        # 상품 관리
│   │   ├── orders/          # 주문 관리
│   │   ├── users/           # 회원 관리
│   │   ├── coupons/         # 쿠폰 관리
│   │   ├── reports/         # 매출 리포트
│   │   └── admins/          # 어드민 관리 (마스터)
│   ├── login/               # 로그인
│   └── api/                 # API 라우트
├── components/              # UI 컴포넌트
├── lib/actions/             # 서버 액션
├── queries/                 # React Query 훅
├── repositories/            # 데이터 접근 계층
├── models/                  # 타입 정의
├── store/                   # Zustand 상태 관리
└── scripts/                 # 유틸리티 스크립트
```

---

## 스크립트

```bash
npm run dev          # 개발 서버 (포트 3001)
npm run build        # 프로덕션 빌드
npm start            # 프로덕션 서버
npm run lint         # ESLint
npm run typecheck    # TypeScript 체크
npm run unused       # 미사용 코드 체크 (knip)
```

---

## 기술 스택

- **프레임워크**: Next.js 16 (App Router)
- **UI**: shadcn/ui, Tailwind CSS
- **상태관리**: Zustand, React Query
- **DB**: Supabase (PostgreSQL)
- **차트**: Recharts
- **인증**: bcryptjs

---

## DB 테이블

| 테이블                | 설명        | 공유        |
| --------------------- | ----------- | ----------- |
| `admin_users`         | 관리자 계정 | 어드민 전용 |
| `admin_activity_logs` | 활동 로그   | 어드민 전용 |
| `products`            | 상품        | Shop과 공유 |
| `orders`              | 주문        | Shop과 공유 |
| `users`               | 회원        | Shop과 공유 |
| `coupons`             | 쿠폰        | Shop과 공유 |

---

## 문제 해결

### 로그인 실패

```sql
-- admin_users 테이블 확인
SELECT * FROM admin_users WHERE username = 'master';
```

### Supabase 연결 오류

- `.env.local` 의 URL/KEY 확인
- Supabase 프로젝트 상태 확인

### 포트 충돌

- Shop 프로젝트가 3000 포트 사용
- 어드민은 3001 포트 사용

---

## 배포

```bash
npm run build
npm start
```

배포 체크리스트:

- [ ] 환경 변수 프로덕션 값으로 설정
- [ ] 마스터 비밀번호 변경
- [ ] RLS 정책 검토
- [ ] HTTPS 설정
