"use client"

import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAdminStore } from "@/store/admin-store"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, KeyRound } from "lucide-react"
import { useRouter } from "next/navigation"
import { adminUsersQueries, useDeleteAdminUser, useResetAdminPassword } from "@/queries/admin-users.queries"
import { ResetPasswordDialog } from "@/components/reset-password-dialog"
import { createAdminUser } from "@/lib/actions/auth"

interface AdminUser {
  id: string
  username: string
  email: string
  full_name: string
  role: string
  is_active: boolean
  created_at: string
  last_login_at: string | null
}

export default function AdminsPage() {
  const [showForm, setShowForm] = useState(false)
  const [resetPasswordDialog, setResetPasswordDialog] = useState<{
    open: boolean
    adminId: string
    adminUsername: string
  }>({
    open: false,
    adminId: "",
    adminUsername: "",
  })
  const { toast } = useToast()
  const adminUser = useAdminStore((state) => state.adminUser)
  const router = useRouter()
  const deleteAdminMutation = useDeleteAdminUser()
  const resetPasswordMutation = useResetAdminPassword()

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    full_name: "",
    role: "admin",
  })

  useEffect(() => {
    if (adminUser?.role !== 'master') {
      router.push('/dashboard')
    }
  }, [adminUser, router])

  const {
    data: admins = [],
    isLoading,
    refetch: refetchAdmins,
  } = useQuery({
    ...adminUsersQueries.list(),
    enabled: adminUser?.role === 'master',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!adminUser) return

    try {
      await createAdminUser(
        adminUser.id,
        formData.username,
        formData.email,
        formData.password,
        formData.full_name,
        formData.role as 'admin' | 'master'
      )

      toast({
        title: "성공",
        description: "관리자가 등록되었습니다.",
      })

      resetForm()
      refetchAdmins()
    } catch (error) {
      console.error('Error creating admin:', error)
      toast({
        title: "오류",
        description: "관리자 등록에 실패했습니다.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (id === adminUser?.id) {
      toast({
        title: "오류",
        description: "자신의 계정은 삭제할 수 없습니다.",
        variant: "destructive",
      })
      return
    }

    if (!confirm("정말 삭제하시겠습니까?")) return

    try {
      await deleteAdminMutation.mutateAsync(id)

      toast({
        title: "성공",
        description: "관리자가 삭제되었습니다.",
      })
    } catch (error) {
      console.error('Error deleting admin:', error)
      toast({
        title: "오류",
        description: "관리자 삭제에 실패했습니다.",
        variant: "destructive",
      })
    }
  }

  const handleResetPassword = async (newPassword: string) => {
    if (!adminUser) return

    try {
      await resetPasswordMutation.mutateAsync({
        masterAdminId: adminUser.id,
        targetAdminId: resetPasswordDialog.adminId,
        newPassword,
      })

      toast({
        title: "성공",
        description: "비밀번호가 재설정되었습니다.",
      })
    } catch (error) {
      console.error("Error resetting password:", error)
      toast({
        title: "오류",
        description: "비밀번호 재설정에 실패했습니다.",
        variant: "destructive",
      })
      throw error
    }
  }

  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
      full_name: "",
      role: "admin",
    })
    setShowForm(false)
  }

  if (adminUser?.role !== 'master') {
    return null
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">관리자 관리</h1>
          <p className="text-gray-500">관리자 계정을 생성하고 관리하세요</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          관리자 추가
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>새 관리자 등록</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="username">아이디</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">비밀번호</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_name">이름</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">권한</Label>
                  <select
                    id="role"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="admin">일반 관리자</option>
                    <option value="master">마스터 관리자</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">등록</Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  취소
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>관리자 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">로딩중...</div>
          ) : admins.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              등록된 관리자가 없습니다.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>아이디</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>권한</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>마지막 로그인</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.username}</TableCell>
                    <TableCell>{admin.full_name}</TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      <span className={admin.role === 'master' ? 'text-blue-600 font-semibold' : ''}>
                        {admin.role === 'master' ? '마스터' : '일반'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={admin.is_active ? 'text-green-600' : 'text-red-600'}>
                        {admin.is_active ? '활성' : '비활성'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {admin.last_login_at
                        ? new Date(admin.last_login_at).toLocaleString()
                        : '로그인 기록 없음'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setResetPasswordDialog({
                              open: true,
                              adminId: admin.id,
                              adminUsername: admin.username,
                            })
                          }
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(admin.id)}
                          disabled={admin.id === adminUser?.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ResetPasswordDialog
        open={resetPasswordDialog.open}
        onOpenChange={(open) =>
          setResetPasswordDialog({ ...resetPasswordDialog, open })
        }
        adminId={resetPasswordDialog.adminId}
        adminUsername={resetPasswordDialog.adminUsername}
        onConfirm={handleResetPassword}
      />
    </div>
  )
}
