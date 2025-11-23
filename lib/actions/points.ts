"use server";

import { revalidatePath } from "next/cache";
import { pointsRepository } from "@/repositories/points.repository";

export async function fetchPointHistory(userId: string, limit = 50) {
  return pointsRepository.findHistoryByUserId(userId, limit);
}

export async function adjustUserPoints(
  userId: string,
  points: number,
  reason: string,
  type: "earn" | "use"
) {
  try {
    if (!userId || !points || points <= 0) {
      return { success: false, error: "잘못된 포인트 요청입니다." };
    }

    if (type === "earn") {
      await pointsRepository.addPoints(userId, points, reason);
    } else {
      const hasPoints = await pointsRepository.usePoints(
        userId,
        points,
        reason
      );
      if (!hasPoints) {
        return { success: false, error: "포인트가 부족합니다." };
      }
    }

    revalidatePath("/dashboard/users");
    revalidatePath(`/dashboard/users/${userId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Adjust user points error:", error);
    return {
      success: false,
      error: error.message || "포인트 처리에 실패했습니다.",
    };
  }
}
