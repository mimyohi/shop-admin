"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { productsQueries, useUpdateProductOrder } from "@/queries/products.queries";
import { PermissionGuard } from "@/components/permission-guard";
import { useRouter } from "next/navigation";

interface OrderProduct {
  id: string;
  name: string;
  category: string;
  image_url: string;
  display_order: number;
}

function SortableRow({ product, index }: { product: OrderProduct; index: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-lg mb-2"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 p-1"
        aria-label="드래그 핸들"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <span className="text-sm text-gray-400 w-6 text-center">{index + 1}</span>
      <img
        src={product.image_url}
        alt={product.name}
        className="w-10 h-10 object-cover rounded"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
        <p className="text-xs text-gray-500">{product.category}</p>
      </div>
    </div>
  );
}

export default function ProductOrderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const updateOrderMutation = useUpdateProductOrder();

  const { data: initialProducts = [], isLoading } = useQuery(
    productsQueries.allForOrder()
  );

  const [products, setProducts] = useState<OrderProduct[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (initialProducts.length > 0) {
      setProducts(initialProducts as OrderProduct[]);
    }
  }, [initialProducts]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setProducts((prev) => {
      const oldIndex = prev.findIndex((p) => p.id === active.id);
      const newIndex = prev.findIndex((p) => p.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
    setIsDirty(true);
  }

  async function handleSave() {
    const orders = products.map((p, index) => ({
      id: p.id,
      display_order: index + 1,
    }));

    try {
      await updateOrderMutation.mutateAsync(orders);
      setIsDirty(false);
      toast({ title: "저장 완료", description: "상품 순서가 저장되었습니다." });
    } catch {
      toast({
        title: "저장 실패",
        description: "순서 저장에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  }

  return (
    <PermissionGuard requireMaster>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard/products")}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              목록으로
            </Button>
            <div>
              <h1 className="text-3xl font-bold">상품 순서 변경</h1>
              <p className="text-gray-500">드래그하여 노출 순서를 변경하세요</p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={!isDirty || updateOrderMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {updateOrderMutation.isPending ? "저장 중..." : "저장"}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>전체 상품 ({products.length}개)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">로딩중...</div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={products.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {products.map((product, index) => (
                    <SortableRow
                      key={product.id}
                      product={product}
                      index={index}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
