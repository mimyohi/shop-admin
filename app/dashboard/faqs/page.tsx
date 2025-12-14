"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import {
  faqsQueries,
  useCreateFAQ,
  useUpdateFAQ,
  useDeleteFAQ,
  useToggleFAQActive,
  useUpdateFAQOrder,
} from "@/queries/faqs.queries";
import { FAQ } from "@/models";
import { CreateFAQData, UpdateFAQData } from "@/types/faqs.types";
import { PermissionGuard } from "@/components/permission-guard";

type FAQFormData = {
  question: string;
  answer: string;
  category: string;
  is_active: boolean;
};

const initialFormData: FAQFormData = {
  question: "",
  answer: "",
  category: "",
  is_active: true,
};

export default function FAQsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [formData, setFormData] = useState<FAQFormData>(initialFormData);

  const { data, isLoading } = useQuery(faqsQueries.list({ limit: "all" }));
  const createFAQ = useCreateFAQ();
  const updateFAQ = useUpdateFAQ();
  const deleteFAQ = useDeleteFAQ();
  const toggleActive = useToggleFAQActive();
  const updateOrder = useUpdateFAQOrder();

  const faqs = data?.faqs || [];

  const handleOpenDialog = (faq?: FAQ) => {
    if (faq) {
      setEditingFAQ(faq);
      setFormData({
        question: faq.question,
        answer: faq.answer,
        category: faq.category || "",
        is_active: faq.is_active,
      });
    } else {
      setEditingFAQ(null);
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingFAQ(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.question.trim()) {
      toast({ title: "오류", description: "질문을 입력해주세요.", variant: "destructive" });
      return;
    }
    if (!formData.answer.trim()) {
      toast({ title: "오류", description: "답변을 입력해주세요.", variant: "destructive" });
      return;
    }

    const faqData: CreateFAQData = {
      question: formData.question,
      answer: formData.answer,
      category: formData.category || undefined,
      is_active: formData.is_active,
    };

    try {
      if (editingFAQ) {
        await updateFAQ.mutateAsync({ id: editingFAQ.id, data: faqData });
        toast({ title: "성공", description: "FAQ가 수정되었습니다." });
      } else {
        await createFAQ.mutateAsync(faqData);
        toast({ title: "성공", description: "FAQ가 등록되었습니다." });
      }
      handleCloseDialog();
    } catch (error) {
      console.error("FAQ save error:", error);
      toast({ title: "오류", description: "FAQ 저장에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      await deleteFAQ.mutateAsync(id);
      toast({ title: "성공", description: "FAQ가 삭제되었습니다." });
    } catch (error) {
      console.error("Delete error:", error);
      toast({ title: "오류", description: "FAQ 삭제에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await toggleActive.mutateAsync({ id, isActive: !currentStatus });
      toast({
        title: "성공",
        description: !currentStatus ? "FAQ가 활성화되었습니다." : "FAQ가 비활성화되었습니다.",
      });
    } catch (error) {
      console.error("Toggle error:", error);
      toast({ title: "오류", description: "상태 변경에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleMoveOrder = async (index: number, direction: "up" | "down") => {
    const faqsList = [...faqs];
    const newIndex = direction === "up" ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= faqsList.length) return;

    [faqsList[index], faqsList[newIndex]] = [faqsList[newIndex], faqsList[index]];

    const orderUpdates = faqsList.map((faq, i) => ({ id: faq.id, display_order: i }));

    try {
      await updateOrder.mutateAsync(orderUpdates);
      toast({ title: "성공", description: "순서가 변경되었습니다." });
    } catch (error) {
      console.error("Order update error:", error);
      toast({ title: "오류", description: "순서 변경에 실패했습니다.", variant: "destructive" });
    }
  };

  return (
    <PermissionGuard requireMaster>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">FAQ 관리</h1>
            <p className="text-gray-500">자주 묻는 질문을 관리하세요</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            FAQ 등록
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>FAQ 목록</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">로딩중...</div>
            ) : faqs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">등록된 FAQ가 없습니다.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">순서</TableHead>
                    <TableHead>질문</TableHead>
                    <TableHead className="w-32">카테고리</TableHead>
                    <TableHead className="w-20">상태</TableHead>
                    <TableHead className="text-right w-32">관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faqs.map((faq, index) => (
                    <TableRow key={faq.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMoveOrder(index, "up")}
                            disabled={index === 0}
                            className="h-6 w-6 p-0"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMoveOrder(index, "down")}
                            disabled={index === faqs.length - 1}
                            className="h-6 w-6 p-0"
                          >
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{faq.question}</p>
                          <p className="text-xs text-gray-500 truncate max-w-md mt-1">
                            {faq.answer}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {faq.category || <span className="text-gray-400">-</span>}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={faq.is_active}
                          onCheckedChange={() => handleToggleActive(faq.id, faq.is_active)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenDialog(faq)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(faq.id)}
                          >
                            <Trash2 className="h-3 w-3" />
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

        {/* FAQ Form Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingFAQ ? "FAQ 수정" : "FAQ 등록"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="question">질문 *</Label>
                <Input
                  id="question"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="자주 묻는 질문을 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="answer">답변 *</Label>
                <Textarea
                  id="answer"
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="질문에 대한 답변을 입력하세요"
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">카테고리</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="카테고리 (선택)"
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">활성화</Label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  취소
                </Button>
                <Button
                  type="submit"
                  disabled={createFAQ.isPending || updateFAQ.isPending}
                >
                  {editingFAQ ? "수정" : "등록"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  );
}
