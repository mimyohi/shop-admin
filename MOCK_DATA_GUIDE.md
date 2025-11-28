# Mock 데이터 삽입 가이드

주문 관리 시스템을 테스트하기 위한 Mock 데이터를 삽입하는 방법입니다.

## 방법 1: Node.js 스크립트 실행 (권장)

### 1. 필요한 패키지 설치

```bash
cd shop-admin
npm install dotenv
```

### 2. 환경 변수 확인

`.env.local` 파일에 다음 환경 변수가 설정되어 있는지 확인하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# 또는
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. 스크립트 실행

```bash
node scripts/insert-mock-data.js
```

### 4. 결과 확인

스크립트 실행 후 다음과 같은 출력을 확인할 수 있습니다:

```
🚀 Mock 데이터 삽입을 시작합니다...

📝 Step 1: 어드민 사용자 추가
✅ 3명의 어드민 사용자 추가됨
✅ 3명의 어드민 ID 확인

📝 Step 2: 주문 데이터 생성
📦 24건의 주문 데이터 삽입 중...
✅ 24건의 주문 데이터가 삽입되었습니다.

📊 상태별 주문 통계:
  접수 필요: 5건
  상담 필요: 4건
  보류: 3건
  상담완료: 4건
  배송처리 완료: 5건
  취소건: 3건

✅ Mock 데이터 삽입이 완료되었습니다!
🌐 http://localhost:3001/dashboard/orders 에서 확인하세요
```

---

## 방법 2: Supabase SQL Editor 사용

### 1. 스키마 업데이트

먼저 `supabase/orders_enhancement.sql` 파일의 내용을 Supabase SQL Editor에서 실행하세요.

```sql
-- supabase/orders_enhancement.sql 파일 내용 실행
```

### 2. Mock 데이터 삽입

`supabase/insert_mock_orders.sql` 파일의 내용을 Supabase SQL Editor에서 실행하세요.

```sql
-- supabase/insert_mock_orders.sql 파일 내용 실행
```

---

## 삽입되는 데이터

### 어드민 사용자 (3명)

- admin1 (김민수)
- admin2 (박지영)
- admin3 (이서준)

비밀번호: `admin123` (모두 동일)

### 주문 데이터 (총 24건)

| 상태          | 건수 | 설명                       |
| ------------- | ---- | -------------------------- |
| 접수 필요     | 5건  | 담당자 미배정, 초기 상태   |
| 상담 필요     | 4건  | 담당자 배정됨, 상담 대기중 |
| 보류          | 3건  | 상담 보류 상태             |
| 상담완료      | 4건  | 상담 완료, 배송 준비중     |
| 배송처리 완료 | 5건  | 배송 완료됨                |
| 취소건        | 3건  | 주문 취소됨                |

---

## 데이터 초기화

Mock 데이터를 삭제하고 다시 시작하려면:

```sql
-- 테스트 주문 데이터 삭제
DELETE FROM orders WHERE user_email LIKE '%test%';

-- 테스트 어드민 삭제
DELETE FROM admin_users WHERE username IN ('admin1', 'admin2', 'admin3');
```

---

## 트러블슈팅

### RLS (Row Level Security) 오류가 발생하는 경우

Supabase에서 Service Role Key를 사용하거나, 임시로 RLS를 비활성화할 수 있습니다:

```sql
-- RLS 임시 비활성화 (개발 환경에서만!)
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- 데이터 삽입 후 다시 활성화
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
```

### Foreign Key 오류가 발생하는 경우

먼저 `orders_enhancement.sql`을 실행하여 스키마를 업데이트해야 합니다.

---

## 확인하기

데이터 삽입 후 브라우저에서 확인:

1. 어드민 로그인: http://localhost:3001/login

   - Username: `master` / Password: `admin123`

2. 주문 관리 페이지: http://localhost:3001/dashboard/orders

각 탭별로 주문이 분류되어 표시됩니다.
