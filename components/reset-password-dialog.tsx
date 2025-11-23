"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface ResetPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  adminId: string
  adminUsername: string
  onConfirm: (password: string) => Promise<void>
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  adminId,
  adminUsername,
  onConfirm,
}: ResetPasswordDialogProps) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      alert("비밀번호가 일치하지 않습니다.")
      return
    }

    if (password.length < 6) {
      alert("비밀번호는 최소 6자 이상이어야 합니다.")
      return
    }

    setIsLoading(true)
    try {
      await onConfirm(password)
      setPassword("")
      setConfirmPassword("")
      onOpenChange(false)
    } catch (error) {
      console.error("Password reset error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>비밀번호 재설정</DialogTitle>
          <DialogDescription>
            <span className="font-semibold">{adminUsername}</span> 관리자의 새
            비밀번호를 입력하세요.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="password">새 비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="최소 6자 이상"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호를 다시 입력하세요"
                required
                minLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "재설정 중..." : "비밀번호 재설정"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
