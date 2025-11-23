import { NextRequest, NextResponse } from "next/server"
import { resetAdminPassword } from "@/lib/actions/auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { masterAdminId, targetAdminId, newPassword } = body

    // Validate input
    if (!masterAdminId || !targetAdminId || !newPassword) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    // Reset password
    await resetAdminPassword(masterAdminId, targetAdminId, newPassword)

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    })
  } catch (error) {
    console.error("Reset password API error:", error)
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    )
  }
}
