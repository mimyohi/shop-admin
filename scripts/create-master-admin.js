const bcrypt = require('bcryptjs');

// 마스터 관리자 비밀번호: admin123
const password = 'admin123';
const hash = bcrypt.hashSync(password, 10);

console.log('='.repeat(80));
console.log('마스터 관리자 계정 생성용 SQL');
console.log('='.repeat(80));
console.log('\nSupabase SQL Editor에서 다음 쿼리를 실행하세요:\n');
console.log(`INSERT INTO admin_users (username, email, password_hash, full_name, role)
VALUES (
  'master',
  'master@shopadmin.com',
  '${hash}',
  'Master Administrator',
  'master'
) ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;`);
console.log('\n로그인 정보:');
console.log('- 아이디: master');
console.log('- 비밀번호: admin123');
console.log('='.repeat(80));
