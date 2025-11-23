# Shop Admin Dashboard

쇼핑몰 관리를 위한 어드민 대시보드 프로젝트입니다. shadcn/ui와 Next.js를 사용하여 구축되었습니다.

## 주요 기능

### 1. 관리자 인증

- 아이디/비밀번호 기반 로그인
- 마스터 관리자와 일반 관리자 권한 구분
- 세션 관리 (Zustand persist)

### 2. 상품 관리

- 상품 등록, 수정, 삭제
- 상품 정보 (이름, 설명, 가격, 재고, 카테고리, 이미지)
- 실시간 상품 목록 조회

### 3. 주문 관리

- 주문 목록 조회
- 주문 상태 관리 (결제대기 → 결제완료 → 배송준비 → 배송중 → 배송완료)
- 주문 상세 정보 확인

### 4. 어드민 유저 관리 (마스터 관리자 전용)

- 새로운 관리자 계정 생성
- 관리자 목록 조회
- 관리자 삭제

### 5. 대시보드

- 주요 통계 정보 (전체 상품 수, 주문 수, 총 매출, 대기중 주문)
- 한눈에 보는 운영 현황

## 기술 스택

- **프레임워크**: Next.js 16 (App Router)
- **언어**: TypeScript
- **UI 라이브러리**: shadcn/ui (Radix UI + Tailwind CSS)
- **데이터베이스**: Supabase (PostgreSQL)
- **상태 관리**: Zustand
- **인증**: bcryptjs
- **스타일링**: Tailwind CSS

## 설치 및 실행

### 1. 패키지 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일이 이미 설정되어 있습니다:

```env
NEXT_PUBLIC_SUPABASE_URL=https://mkbeonizkvrzjqihhcmg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Supabase 데이터베이스 스키마 적용

Supabase 대시보드에서 SQL Editor를 열고 `supabase/admin_schema.sql` 파일의 내용을 실행하세요.

이 스키마는 다음을 생성합니다:

- `admin_users` 테이블 (관리자 계정)
- `admin_activity_logs` 테이블 (관리자 활동 로그)
- 초기 마스터 관리자 계정

### 4. 마스터 관리자 계정 생성

스키마 실행 후, bcrypt 해시를 생성하여 마스터 관리자의 비밀번호를 설정해야 합니다:

```bash
# Node.js에서 bcrypt 해시 생성
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('admin123', 10))"
```

생성된 해시를 Supabase SQL Editor에서 실행:

```sql
INSERT INTO admin_users (username, email, password_hash, full_name, role)
VALUES (
  'master',
  'master@shopadmin.com',
  'your-generated-hash-here',
  'Master Administrator',
  'master'
) ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;
```

### 5. 개발 서버 실행

```bash
npm run dev
```

어드민 대시보드는 `http://localhost:3001`에서 실행됩니다.
(포트 3001을 사용하여 shop 프로젝트(3000)와 충돌을 방지합니다)

## 기본 로그인 정보

스키마 적용 후 설정한 계정으로 로그인:

- 아이디: `master`
- 비밀번호: 위에서 설정한 비밀번호

## 프로젝트 구조

```
shop-admin/
├── app/
│   ├── dashboard/          # 대시보드 페이지들
│   │   ├── admins/        # 어드민 관리
│   │   ├── orders/        # 주문 관리
│   │   └── products/      # 상품 관리
│   ├── login/             # 로그인 페이지
│   ├── globals.css        # 전역 스타일
│   └── layout.tsx         # 루트 레이아웃
├── components/
│   ├── ui/                # shadcn/ui 컴포넌트
│   ├── auth-guard.tsx     # 인증 가드
│   └── dashboard-nav.tsx  # 대시보드 네비게이션
├── lib/
│   ├── auth.ts           # 인증 관련 함수
│   ├── supabase.ts       # Supabase 클라이언트
│   └── utils.ts          # 유틸리티 함수
├── store/
│   └── admin-store.ts    # Zustand 상태 관리
├── hooks/
│   └── use-toast.ts      # Toast 훅
├── supabase/
│   └── admin_schema.sql  # 데이터베이스 스키마
└── package.json
```

## 주요 페이지

- `/` - 루트 (로그인으로 리다이렉트)
- `/login` - 로그인 페이지
- `/dashboard` - 대시보드 홈
- `/dashboard/products` - 상품 관리

## 권한 시스템

### 마스터 관리자 (master)

- 모든 기능 접근 가능
- 어드민 계정 생성/삭제
- 상품 및 주문 관리

### 일반 관리자 (admin)

- 상품 관리
- 주문 관리
- 대시보드 조회
- 어드민 관리 페이지 접근 불가

## 데이터베이스 테이블

### admin_users

관리자 계정 정보를 저장합니다.

### admin_activity_logs

관리자의 활동을 기록합니다 (로그인, 상품 등록/수정/삭제, 어드민 생성 등).

### products (shop 프로젝트와 공유)

상품 정보를 저장합니다.

### orders (shop 프로젝트와 공유)

주문 정보를 저장합니다.

## 개발 가이드

### 새 관리자 추가하기

1. 마스터 관리자로 로그인
2. "어드민 관리" 메뉴 접속
3. "관리자 추가" 버튼 클릭
4. 필요한 정보 입력 후 등록

### 상품 등록하기

1. "상품 관리" 메뉴 접속
2. "상품 등록" 버튼 클릭
3. 상품 정보 입력 후 등록

### 주문 상태 변경하기

1. "주문 관리" 메뉴 접속
2. 각 주문의 상태에 따라 다음 단계 버튼 클릭
3. 자동으로 상태가 업데이트됨

## 보안 고려사항

- 비밀번호는 bcrypt로 해시화하여 저장
- 클라이언트 사이드에서 인증 상태 검증 (AuthGuard)
- Supabase RLS (Row Level Security) 활성화
- 관리자 활동 로그 자동 기록

## 빌드 및 배포

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

## 라이센스

ISC
