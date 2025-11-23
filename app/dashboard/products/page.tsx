"use client"

import { useEffect, useMemo } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { productsQueries, useDeleteProduct } from "@/queries/products.queries"

interface Product {
  id: string
  slug: string
  name: string
  description: string
  price: number
  stock: number
  category: string
  image_url: string
  is_visible_on_main: boolean
  sale_start_at: string | null
  sale_end_at: string | null
  created_at: string
}

export default function ProductsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const deleteProductMutation = useDeleteProduct()
  const {
    data: productList,
    isLoading,
    isError,
  } = useQuery(productsQueries.list({ limit: 'all' }))

  const products = useMemo(() => productList?.products ?? [], [productList])

  useEffect(() => {
    if (isError) {
      toast({
        title: "오류",
        description: "상품 목록을 불러오는데 실패했습니다.",
        variant: "destructive",
      })
    }
  }, [isError, toast])

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return

    try {
      await deleteProductMutation.mutateAsync(id)

      toast({
        title: "성공",
        description: "상품이 삭제되었습니다.",
      })
    } catch (error) {
      console.error('Error deleting product:', error)
      toast({
        title: "오류",
        description: "상품 삭제에 실패했습니다.",
        variant: "destructive",
      })
    }
  }


  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">상품 관리</h1>
          <p className="text-gray-500">상품을 등록하고 관리하세요</p>
        </div>
        <Button onClick={() => router.push('/dashboard/products/new')}>
          <Plus className="mr-2 h-4 w-4" />
          상품 등록
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>상품 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">로딩중...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              등록된 상품이 없습니다.
            </div>
          ) : (
<Table>
              <TableHeader>
                <TableRow>
                  <TableHead>상품명</TableHead>
                  <TableHead>카테고리</TableHead>
                  <TableHead>가격</TableHead>
                  <TableHead>재고</TableHead>
                  <TableHead>메인노출</TableHead>
                  <TableHead>판매기간</TableHead>
                  <TableHead>링크</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{product.price.toLocaleString()}원</TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>
                      {product.is_visible_on_main ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          노출
                        </span>
                      ) : (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          숨김
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {product.sale_start_at && product.sale_end_at ? (
                        <>
                          <div>{new Date(product.sale_start_at).toLocaleDateString()}</div>
                          <div>~ {new Date(product.sale_end_at).toLocaleDateString()}</div>
                        </>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-mono">
                      {product.slug || "생성중"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/dashboard/products/${product.id}`)}
                          title="상품 수정"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(product.id)}
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
    </div>
  )
}
