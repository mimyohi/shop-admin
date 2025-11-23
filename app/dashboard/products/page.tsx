"use client"

import { useEffect, useMemo, useState } from "react"
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

const ITEMS_PER_PAGE = 10

type VisibilityFilterOption = "all" | "visible" | "hidden"
type StockFilterOption = "all" | "in_stock" | "out_of_stock"

export default function ProductsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const deleteProductMutation = useDeleteProduct()

  const [searchFilter, setSearchFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<"all" | string>("all")
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilterOption>(
    "all"
  )
  const [stockFilter, setStockFilter] = useState<StockFilterOption>("all")
  const [currentPage, setCurrentPage] = useState(1)

  const filters = useMemo(
    () => ({
      search: searchFilter.trim() || undefined,
      category: categoryFilter === "all" ? undefined : categoryFilter,
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      isVisibleOnMain:
        visibilityFilter === "visible"
          ? true
          : visibilityFilter === "hidden"
            ? false
            : undefined,
      stockStatus: stockFilter === "all" ? undefined : stockFilter,
    }),
    [searchFilter, categoryFilter, visibilityFilter, stockFilter, currentPage]
  )

  const {
    data: productList,
    isLoading,
    isError,
  } = useQuery(productsQueries.list(filters))

  const { data: categoryOptions = [] } = useQuery(productsQueries.categories())

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

  useEffect(() => {
    setCurrentPage(1)
  }, [searchFilter, categoryFilter, visibilityFilter, stockFilter])

  useEffect(() => {
    const pages = productList?.totalPages ?? 1

    if (currentPage > pages) {
      setCurrentPage(pages)
    }
  }, [currentPage, productList?.totalPages])

  const displayedPage = productList?.currentPage ?? currentPage
  const totalPages = productList?.totalPages ?? 1
  const totalCount = productList?.totalCount ?? 0

  const isFirstPage = displayedPage <= 1
  const isLastPage = displayedPage >= totalPages

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return

    try {
      await deleteProductMutation.mutateAsync(id)

      toast({
        title: "성공",
        description: "상품이 삭제되었습니다.",
      })
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "오류",
        description: "상품 삭제에 실패했습니다.",
        variant: "destructive",
      })
    }
  }

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1))
  }

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">상품 관리</h1>
          <p className="text-gray-500">상품을 등록하고 관리하세요</p>
        </div>
        <Button onClick={() => router.push("/dashboard/products/new")}>
          <Plus className="mr-2 h-4 w-4" />
          상품 등록
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>상품 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-sm font-semibold">검색</Label>
              <Input
                placeholder="상품명 혹은 설명"
                value={searchFilter}
                onChange={(event) => setSearchFilter(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-semibold">카테고리</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="카테고리" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 카테고리</SelectItem>
                  {categoryOptions.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-semibold">메인 노출</Label>
              <Select
                value={visibilityFilter}
                onValueChange={(value) =>
                  setVisibilityFilter(value as VisibilityFilterOption)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="노출 여부" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="visible">노출</SelectItem>
                  <SelectItem value="hidden">숨김</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-sm font-semibold">재고 상태</Label>
              <Select
                value={stockFilter}
                onValueChange={(value) =>
                  setStockFilter(value as StockFilterOption)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="재고 상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="in_stock">재고 있음</SelectItem>
                  <SelectItem value="out_of_stock">재고 없음</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

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
                          <div>
                            {new Date(product.sale_start_at).toLocaleDateString()}
                          </div>
                          <div>
                            ~ {new Date(product.sale_end_at).toLocaleDateString()}
                          </div>
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

          {!isLoading && (
            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <p>
                총 {totalCount.toLocaleString()}개 · {displayedPage}/{totalPages}페이지
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handlePreviousPage} disabled={isFirstPage}>
                  이전
                </Button>
                <Button size="sm" variant="outline" onClick={handleNextPage} disabled={isLastPage}>
                  다음
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
