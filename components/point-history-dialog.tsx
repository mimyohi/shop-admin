"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { pointsQueries } from "@/queries/points.queries";

interface UserPoint {
  user_id: string | null;
  points: number;
  user_profiles: {
    email: string;
    display_name: string | null;
  };
}

interface PointHistory {
  id: string;
  points: number;
  type: "earn" | "use";
  reason: string;
  created_at: string;
}

interface PointHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userPoint: UserPoint | null;
}

export function PointHistoryDialog({
  open,
  onOpenChange,
  userPoint,
}: PointHistoryDialogProps) {
  const { toast } = useToast();
  const userId = userPoint?.user_id ?? "";
  const {
    data: history = [],
    isLoading,
    isError,
  } = useQuery({
    ...pointsQueries.history(userId, 50),
    enabled: open && !!userId,
  });

  useEffect(() => {
    if (isError) {
      toast({
        title: "오류",
        description: "포인트 내역을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    }
  }, [isError, toast]);

  if (!userPoint) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            포인트 내역 - {userPoint.user_profiles.display_name || userPoint.user_profiles.email}
          </DialogTitle>
          <div className="text-sm text-gray-500">
            현재 보유: <span className="font-semibold text-blue-600">{userPoint.points.toLocaleString()}P</span>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 -mx-6 px-6">
          {isLoading ? (
          <div className="text-center py-8">로딩중...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            포인트 내역이 없습니다.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>일시</TableHead>
                <TableHead>구분</TableHead>
                <TableHead>포인트</TableHead>
                <TableHead>사유</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-sm">
                    {item.created_at ? new Date(item.created_at).toLocaleString("ko-KR") : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.type === "earn" ? "default" : "secondary"}>
                      {item.type === "earn" ? "적립" : "사용"}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`font-semibold ${
                      item.type === "earn" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {item.type === "earn" ? "+" : "-"}
                    {item.points.toLocaleString()}P
                  </TableCell>
                  <TableCell className="text-sm">{item.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
