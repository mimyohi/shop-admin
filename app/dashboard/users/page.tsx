"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { usersQueries } from "@/queries/users.queries";
import { parseAsString, useQueryState } from "nuqs";
import { PermissionGuard } from "@/components/permission-guard";

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

const ITEMS_PER_PAGE = 50;

export default function UsersPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useQueryState(
    "search",
    parseAsString.withDefault("")
  );
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const filters = useMemo(
    () => ({
      search: searchTerm || undefined,
      page: currentPage,
      limit: ITEMS_PER_PAGE,
    }),
    [searchTerm, currentPage]
  );

  const {
    data: usersResult,
    isLoading,
    isError,
  } = useQuery(usersQueries.list(filters));

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    const pages = usersResult?.totalPages ?? 1;

    if (currentPage > pages) {
      setCurrentPage(pages);
    }
  }, [currentPage, usersResult?.totalPages]);

  const displayedPage = usersResult?.currentPage ?? currentPage;
  const totalPages = usersResult?.totalPages ?? 1;
  const totalCount = usersResult?.totalCount ?? 0;

  const isFirstPage = displayedPage <= 1;
  const isLastPage = displayedPage >= totalPages;

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  return (
    <PermissionGuard requireMaster>
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
                  <TableHead className="w-16">번호</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>전화번호</TableHead>
                  <TableHead>보유 포인트</TableHead>
                  <TableHead>총 적립</TableHead>
                  <TableHead>총 사용</TableHead>
                  <TableHead>가입일시</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user, index) => (
                  <TableRow
                    key={user.id}
                    onClick={() =>
                      router.push(`/dashboard/users/${user.user_id}`)
                    }
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell className="font-semibold text-gray-600">
                      {index + 1}
                    </TableCell>
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
                      {new Date(user.created_at).toLocaleString("ko-KR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!isLoading && (
            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <p>
                총 {totalCount.toLocaleString()}명 · {displayedPage}/
                {totalPages}페이지
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePreviousPage}
                  disabled={isFirstPage}
                >
                  이전
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleNextPage}
                  disabled={isLastPage}
                >
                  다음
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </PermissionGuard>
  );
}
