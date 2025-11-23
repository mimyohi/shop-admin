# Shop Admin 설정 가이드

이 가이드는 Shop Admin 프로젝트를 처음 설정하는 방법을 단계별로 설명합니다.

## 1. 패키지 설치

```bash
cd shop-admin
npm install --legacy-peer-deps
```

## 2. Supabase 데이터베이스 스키마 적용

### 2-1. Supabase 대시보드 접속

1. https://supabase.com 에 접속
2. 프로젝트 선택 (또는 새 프로젝트 생성)
3. 왼쪽 메뉴에서 **SQL Editor** 클릭

### 2-2. 어드민 스키마 실행

`supabase/admin_schema.sql` 파일의 내용을 복사하여 SQL Editor에 붙여넣고 실행합니다.

이 스키마는 다음을 생성합니다:

- **admin_users** 테이블: 관리자 계정 정보
- **admin_activity_logs** 테이블: 관리자 활동 로그
- **초기 마스터 관리자 계정** (username: master, password: admin123)

## 3. 환경 변수 확인

`.env.local` 파일이 올바른 Supabase 정보를 포함하고 있는지 확인하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 4. 개발 서버 실행

```bash
npm run dev
```

서버가 실행되면 http://localhost:3001 에서 접속할 수 있습니다.

## 5. 첫 로그인

브라우저에서 http://localhost:3001 접속 시 자동으로 로그인 페이지로 이동합니다.

**기본 마스터 관리자 계정:**
- 아이디: `master`
- 비밀번호: `admin123`

## 6. 첫 설정 후 할 일

### 6-1. 마스터 관리자 비밀번호 변경 (권장)

보안을 위해 초기 비밀번호를 변경하는 것을 권장합니다.

1. Supabase SQL Editor에서 새 비밀번호 해시 생성:
```bash
node scripts/create-master-admin.js
```

2. 생성된 SQL 쿼리를 Supabase SQL Editor에서 실행

### 6-2. 추가 관리자 계정 생성

1. 마스터 관리자로 로그인
2. 왼쪽 메뉴에서 "어드민 관리" 클릭
3. "관리자 추가" 버튼 클릭
4. 필요한 정보 입력 후 등록

## 7. Shop 프로젝트와 연동

Shop Admin은 Shop 프로젝트와 동일한 Supabase 데이터베이스를 사용합니다.

- **products** 테이블: Shop과 공유 (어드민에서 상품 관리)
- **orders** 테이블: Shop과 공유 (어드민에서 주문 관리)
- **admin_users** 테이블: 어드민 전용

## 8. 문제 해결

### 로그인이 안 되는 경우

1. Supabase 데이터베이스에 admin_users 테이블이 생성되었는지 확인
2. 마스터 관리자 계정이 삽입되었는지 확인:
```sql
SELECT * FROM admin_users WHERE username = 'master';
```

### Supabase 연결 오류

1. `.env.local` 파일의 SUPABASE_URL과 ANON_KEY가 올바른지 확인
2. Supabase 프로젝트가 활성 상태인지 확인

### 페이지가 로드되지 않는 경우

1. 개발 서버가 실행 중인지 확인
2. 포트 3001이 다른 프로세스에서 사용 중이지 않은지 확인
3. 브라우저 콘솔에서 에러 메시지 확인

## 9. 다음 단계

- 상품 등록 및 관리
- 주문 처리 및 상태 관리
- 추가 관리자 계정 생성
- 관리자 활동 로그 모니터링

## 10. 프로덕션 배포

프로덕션 배포 시:

1. 환경 변수를 프로덕션 값으로 설정
2. 마스터 관리자 비밀번호 변경
3. RLS (Row Level Security) 정책 검토
4. HTTPS 사용 확인

```bash
npm run build
npm start
```

---

문제가 있거나 도움이 필요하면 README.md를 참고하세요.
