"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { usersQueries } from "@/queries/users.queries";
import { parseAsString, useQueryState } from "nuqs";

interface User {
  id: string;
  email: string;
  display_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  points: number | null;
  total_earned: number | null;
  total_used: number | null;
}

export default function UsersPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useQueryState(
    "search",
    parseAsString.withDefault("")
  );
  const { toast } = useToast();
  const {
    data: usersResult,
    isLoading,
    isError,
  } = useQuery(
    usersQueries.list({
      search: searchTerm || undefined,
      limit: "all",
    })
  );
  const users = useMemo(() => usersResult?.users ?? [], [usersResult]);

  useEffect(() => {
    if (isError) {
      toast({
        title: "오류",
        description: "유저 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    }
  }, [isError, toast]);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">유저 관리</h1>
        <p className="text-gray-500">유저 정보 및 포인트를 관리하세요</p>
      </div>

      {/* 필터 영역 */}
      <Card className="mb-6">
        <CardContent className="pt-6 flex justify-between">
          <div className="space-y-2 w-full">
            <Label htmlFor="search">검색</Label>
            <Input
              id="search"
              placeholder="이메일, 이름, 전화번호"
              value={searchTerm}
              onChange={(e) => void setSearchTerm(e.target.value || null)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 유저 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>유저 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">로딩중...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              조건에 맞는 유저가 없습니다.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이름</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>전화번호</TableHead>
                  <TableHead>보유 포인트</TableHead>
                  <TableHead>총 적립</TableHead>
                  <TableHead>총 사용</TableHead>
                  <TableHead>가입일</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow
                    key={user.id}
                    onClick={() =>
                      router.push(`/dashboard/users/${user.user_id}`)
                    }
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell>{user.display_name || "이름 없음"}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {user.email}
                    </TableCell>
                    <TableCell>{user.phone || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="font-semibold text-base px-3 py-1"
                      >
                        {(user.points || 0).toLocaleString()}P
                      </Badge>
                    </TableCell>
                    <TableCell className="text-green-600 text-sm">
                      +{(user.total_earned || 0).toLocaleString()}P
                    </TableCell>
                    <TableCell className="text-red-600 text-sm">
                      -{(user.total_used || 0).toLocaleString()}P
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString("ko-KR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
