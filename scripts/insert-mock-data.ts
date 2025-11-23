/**
 * Mock 데이터 삽입 스크립트
 *
 * 실행 방법 (기본: .env.local):
 *   npx tsx scripts/insert-mock-data.ts
 *
 * 다른 env 파일을 사용하려면 ENV_FILE을 지정하세요:
 *   ENV_FILE=.env.dev npx tsx scripts/insert-mock-data.ts
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../env";

const __dirname = dirname(fileURLToPath(import.meta.url));

const envFileName = process.env.ENV_FILE ?? ".env.local";
const envFilePath = isAbsolute(envFileName)
  ? envFileName
  : join(__dirname, "..", envFileName);

config({ path: envFilePath });
console.log(`Using environment file: ${envFilePath}`);

const safeGet = <T>(fn: () => T): T | undefined => {
  try {
    return fn();
  } catch {
    return undefined;
  }
};

const supabaseUrl = safeGet(() => env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseServiceKey =
  env.SUPABASE_SERVICE_ROLE_KEY ??
  safeGet(() => env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Supabase 환경 변수가 설정되지 않았습니다.");
  console.error("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
  console.error("SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "✓" : "✗");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

type MockOrder = {
  user_email: string;
  user_name: string;
  user_phone: string;
  total_amount: number;
  status: string;
  order_id: string;
  consultation_status: string;
  created_at: string;
  assigned_admin_id?: string;
  handler_admin_id?: string;
  handled_at?: string;
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

async function insertMockData() {
  console.log("🚀 Mock 데이터 삽입을 시작합니다...\n");

  try {
    // 1. 테스트용 어드민 사용자 추가
    console.log("📝 Step 1: 어드민 사용자 추가");
    const adminUsers = [
      {
        username: "admin1",
        email: "admin1@shopadmin.com",
        password_hash:
          "$2b$10$hiy2wlrz27qG1/YbHTllIeLDlCoGlMxifOrOh.KytuiZhZHJlU10i",
        full_name: "김민수",
        role: "admin",
      },
      {
        username: "admin2",
        email: "admin2@shopadmin.com",
        password_hash:
          "$2b$10$hiy2wlrz27qG1/YbHTllIeLDlCoGlMxifOrOh.KytuiZhZHJlU10i",
        full_name: "박지영",
        role: "admin",
      },
      {
        username: "admin3",
        email: "admin3@shopadmin.com",
        password_hash:
          "$2b$10$hiy2wlrz27qG1/YbHTllIeLDlCoGlMxifOrOh.KytuiZhZHJlU10i",
        full_name: "이서준",
        role: "admin",
      },
    ];

    const { data: existingAdmins } = await supabase
      .from("admin_users")
      .select("username")
      .in("username", ["admin1", "admin2", "admin3"]);

    const existingUsernames = new Set(
      existingAdmins?.map((u) => u.username) || []
    );
    const newAdmins = adminUsers.filter(
      (admin) => !existingUsernames.has(admin.username)
    );

    if (newAdmins.length > 0) {
      const { error } = await supabase.from("admin_users").insert(newAdmins);
      if (error) {
        console.error("⚠️  어드민 추가 중 오류:", error.message);
      } else {
        console.log(`✅ ${newAdmins.length}명의 어드민 사용자 추가됨`);
      }
    } else {
      console.log("ℹ️  어드민 사용자가 이미 존재합니다.");
    }

    // 어드민 ID 가져오기
    const { data: admins } = await supabase
      .from("admin_users")
      .select("id, username")
      .in("username", ["admin1", "admin2", "admin3"]);

    const adminMap: Record<string, string | undefined> = {};
    admins?.forEach((admin) => {
      adminMap[admin.username] = admin.id;
    });

    console.log(`✅ ${Object.keys(adminMap).length}명의 어드민 ID 확인\n`);

    // 2. Mock 주문 데이터 생성
    console.log("📝 Step 2: 주문 데이터 생성");

    const now = new Date();
    const mockOrders: MockOrder[] = [];

    // 차팅 필요 (5건)
    mockOrders.push(
      {
        user_email: "test1@example.com",
        user_name: "조수민",
        user_phone: "01045346789",
        total_amount: 129000,
        status: "pending",
        order_id: "ORD-2023-001",
        consultation_status: "chatting_required",
        created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        user_email: "test2@example.com",
        user_name: "강민호",
        user_phone: "01012345678",
        total_amount: 89000,
        status: "pending",
        order_id: "ORD-2023-002",
        consultation_status: "chatting_required",
        created_at: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      },
      {
        user_email: "test3@example.com",
        user_name: "윤서아",
        user_phone: "01098765432",
        total_amount: 174000,
        status: "pending",
        order_id: "ORD-2023-003",
        consultation_status: "chatting_required",
        created_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        user_email: "test4@example.com",
        user_name: "정우진",
        user_phone: "01055556666",
        total_amount: 45000,
        status: "pending",
        order_id: "ORD-2023-004",
        consultation_status: "chatting_required",
        created_at: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      },
      {
        user_email: "test5@example.com",
        user_name: "최하은",
        user_phone: "01077778888",
        total_amount: 164000,
        status: "pending",
        order_id: "ORD-2023-005",
        consultation_status: "chatting_required",
        created_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      }
    );

    // 상담 필요 (4건)
    mockOrders.push(
      {
        user_email: "test6@example.com",
        user_name: "김태희",
        user_phone: "01011112222",
        total_amount: 214000,
        status: "paid",
        order_id: "ORD-2023-006",
        consultation_status: "consultation_required",
        assigned_admin_id: adminMap["admin1"],
        created_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        user_email: "test7@example.com",
        user_name: "박준영",
        user_phone: "01022223333",
        total_amount: 89000,
        status: "paid",
        order_id: "ORD-2023-007",
        consultation_status: "consultation_required",
        assigned_admin_id: adminMap["admin2"],
        created_at: new Date(
          now.getTime() - 2 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        user_email: "test8@example.com",
        user_name: "이수진",
        user_phone: "01033334444",
        total_amount: 258000,
        status: "paid",
        order_id: "ORD-2023-008",
        consultation_status: "consultation_required",
        assigned_admin_id: adminMap["admin1"],
        created_at: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
      },
      {
        user_email: "test9@example.com",
        user_name: "한지우",
        user_phone: "01044445555",
        total_amount: 45000,
        status: "paid",
        order_id: "ORD-2023-009",
        consultation_status: "consultation_required",
        assigned_admin_id: adminMap["admin3"],
        created_at: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      }
    );

    // 보류 (3건)
    mockOrders.push(
      {
        user_email: "test10@example.com",
        user_name: "서예린",
        user_phone: "01055556666",
        total_amount: 129000,
        status: "paid",
        order_id: "ORD-2023-010",
        consultation_status: "on_hold",
        assigned_admin_id: adminMap["admin2"],
        created_at: new Date(
          now.getTime() - 3 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        user_email: "test11@example.com",
        user_name: "김도현",
        user_phone: "01066667777",
        total_amount: 174000,
        status: "paid",
        order_id: "ORD-2023-011",
        consultation_status: "on_hold",
        assigned_admin_id: adminMap["admin1"],
        created_at: new Date(
          now.getTime() - 2 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        user_email: "test12@example.com",
        user_name: "최윤아",
        user_phone: "01077778888",
        total_amount: 89000,
        status: "paid",
        order_id: "ORD-2023-012",
        consultation_status: "on_hold",
        assigned_admin_id: adminMap["admin3"],
        created_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      }
    );

    // 상담완료 (4건)
    mockOrders.push(
      {
        user_email: "test13@example.com",
        user_name: "장민재",
        user_phone: "01088889999",
        total_amount: 214000,
        status: "preparing",
        order_id: "ORD-2023-013",
        consultation_status: "consultation_completed",
        assigned_admin_id: adminMap["admin1"],
        handler_admin_id: adminMap["admin1"],
        handled_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(
          now.getTime() - 4 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        user_email: "test14@example.com",
        user_name: "윤서연",
        user_phone: "01099990000",
        total_amount: 129000,
        status: "preparing",
        order_id: "ORD-2023-014",
        consultation_status: "consultation_completed",
        assigned_admin_id: adminMap["admin2"],
        handler_admin_id: adminMap["admin2"],
        handled_at: new Date(
          now.getTime() - 2 * 24 * 60 * 60 * 1000
        ).toISOString(),
        created_at: new Date(
          now.getTime() - 5 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        user_email: "test15@example.com",
        user_name: "정현우",
        user_phone: "01011110000",
        total_amount: 258000,
        status: "preparing",
        order_id: "ORD-2023-015",
        consultation_status: "consultation_completed",
        assigned_admin_id: adminMap["admin3"],
        handler_admin_id: adminMap["admin3"],
        handled_at: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(
          now.getTime() - 2 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        user_email: "test16@example.com",
        user_name: "박소희",
        user_phone: "01022221111",
        total_amount: 89000,
        status: "preparing",
        order_id: "ORD-2023-016",
        consultation_status: "consultation_completed",
        assigned_admin_id: adminMap["admin1"],
        handler_admin_id: adminMap["admin1"],
        handled_at: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      }
    );

    // 배송완료 (5건)
    mockOrders.push(
      {
        user_email: "test17@example.com",
        user_name: "이지훈",
        user_phone: "01033332222",
        total_amount: 174000,
        status: "delivered",
        order_id: "ORD-2023-017",
        consultation_status: "shipping_completed",
        assigned_admin_id: adminMap["admin2"],
        handler_admin_id: adminMap["admin2"],
        handled_at: new Date(
          now.getTime() - 5 * 24 * 60 * 60 * 1000
        ).toISOString(),
        created_at: new Date(
          now.getTime() - 10 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        user_email: "test18@example.com",
        user_name: "김서윤",
        user_phone: "01044443333",
        total_amount: 129000,
        status: "delivered",
        order_id: "ORD-2023-018",
        consultation_status: "shipping_completed",
        assigned_admin_id: adminMap["admin1"],
        handler_admin_id: adminMap["admin1"],
        handled_at: new Date(
          now.getTime() - 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        created_at: new Date(
          now.getTime() - 12 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        user_email: "test19@example.com",
        user_name: "최준호",
        user_phone: "01055554444",
        total_amount: 214000,
        status: "delivered",
        order_id: "ORD-2023-019",
        consultation_status: "shipping_completed",
        assigned_admin_id: adminMap["admin3"],
        handler_admin_id: adminMap["admin3"],
        handled_at: new Date(
          now.getTime() - 3 * 24 * 60 * 60 * 1000
        ).toISOString(),
        created_at: new Date(
          now.getTime() - 8 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        user_email: "test20@example.com",
        user_name: "한예진",
        user_phone: "01066665555",
        total_amount: 89000,
        status: "delivered",
        order_id: "ORD-2023-020",
        consultation_status: "shipping_completed",
        assigned_admin_id: adminMap["admin2"],
        handler_admin_id: adminMap["admin2"],
        handled_at: new Date(
          now.getTime() - 4 * 24 * 60 * 60 * 1000
        ).toISOString(),
        created_at: new Date(
          now.getTime() - 9 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        user_email: "test21@example.com",
        user_name: "서민준",
        user_phone: "01077776666",
        total_amount: 258000,
        status: "delivered",
        order_id: "ORD-2023-021",
        consultation_status: "shipping_completed",
        assigned_admin_id: adminMap["admin1"],
        handler_admin_id: adminMap["admin1"],
        handled_at: new Date(
          now.getTime() - 6 * 24 * 60 * 60 * 1000
        ).toISOString(),
        created_at: new Date(
          now.getTime() - 11 * 24 * 60 * 60 * 1000
        ).toISOString(),
      }
    );

    // 취소건 (3건)
    mockOrders.push(
      {
        user_email: "test22@example.com",
        user_name: "강하늘",
        user_phone: "01088887777",
        total_amount: 129000,
        status: "cancelled",
        order_id: "ORD-2023-022",
        consultation_status: "cancelled",
        assigned_admin_id: adminMap["admin2"],
        created_at: new Date(
          now.getTime() - 5 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        user_email: "test23@example.com",
        user_name: "윤재원",
        user_phone: "01099998888",
        total_amount: 45000,
        status: "cancelled",
        order_id: "ORD-2023-023",
        consultation_status: "cancelled",
        assigned_admin_id: adminMap["admin3"],
        created_at: new Date(
          now.getTime() - 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        user_email: "test24@example.com",
        user_name: "박채원",
        user_phone: "01000009999",
        total_amount: 174000,
        status: "cancelled",
        order_id: "ORD-2023-024",
        consultation_status: "cancelled",
        assigned_admin_id: adminMap["admin1"],
        created_at: new Date(
          now.getTime() - 3 * 24 * 60 * 60 * 1000
        ).toISOString(),
      }
    );

    // 3. 주문 데이터 삽입
    console.log(`📦 ${mockOrders.length}건의 주문 데이터 삽입 중...`);

    const { data, error } = await supabase
      .from("orders")
      .insert(mockOrders)
      .select();

    if (error) {
      console.error("❌ 주문 삽입 중 오류:", error.message);
      process.exit(1);
    }

    console.log(`✅ ${data?.length || 0}건의 주문 데이터가 삽입되었습니다.\n`);

    // 4. 삽입 결과 확인
    console.log("📊 상태별 주문 통계:");
    const { data: stats } = await supabase
      .from("orders")
      .select("consultation_status");

    const statusCount = (
      (stats ?? []) as Array<{ consultation_status: string }>
    ).reduce<Record<string, number>>((acc, order) => {
      const key = order.consultation_status;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const statusLabels: Record<string, string> = {
      chatting_required: "차팅 필요",
      consultation_required: "상담 필요",
      on_hold: "보류",
      consultation_completed: "상담완료",
      shipping_completed: "배송처리 완료",
      cancelled: "취소건",
    };

    Object.entries(statusLabels).forEach(([key, label]) => {
      console.log(`  ${label}: ${statusCount[key] || 0}건`);
    });

    console.log("\n✅ Mock 데이터 삽입이 완료되었습니다!");
    console.log("🌐 http://localhost:3001/dashboard/orders 에서 확인하세요\n");
  } catch (error) {
    console.error("❌ 오류 발생:", getErrorMessage(error));
    console.error(error);
    process.exit(1);
  }
}

void insertMockData();
