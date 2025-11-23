'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { X, Upload } from 'lucide-react'

interface MultiImageUploadProps {
  onImagesChange: (urls: string[]) => void
  currentImages?: string[]
  maxImages?: number
}

export default function MultiImageUpload({
  onImagesChange,
  currentImages = [],
  maxImages = 10
}: MultiImageUploadProps) {
  const [images, setImages] = useState<string[]>(currentImages)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setImages(currentImages)
  }, [currentImages])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Check max images limit
    if (images.length + files.length > maxImages) {
      alert(`최대 ${maxImages}개까지 업로드 가능합니다.`)
      return
    }

    setUploading(true)
    const uploadedUrls: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert(`${file.name}은(는) 이미지 파일이 아닙니다.`)
          continue
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name}의 크기가 5MB를 초과합니다.`)
          continue
        }

        // Upload to Supabase
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `products/details/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          continue
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath)

        uploadedUrls.push(publicUrl)
      }

      const newImages = [...images, ...uploadedUrls]
      setImages(newImages)
      onImagesChange(newImages)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('이미지 업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
    onImagesChange(newImages)
  }

  const handleMoveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images]
    const [movedImage] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, movedImage)
    setImages(newImages)
    onImagesChange(newImages)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || images.length >= maxImages}
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? '업로드 중...' : '이미지 추가'}
        </Button>
        <span className="text-sm text-gray-500">
          {images.length} / {maxImages}개
        </span>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((url, index) => (
            <div key={index} className="relative group">
              <div className="relative w-full h-40 border rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={url}
                  alt={`Detail image ${index + 1}`}
                  fill
                  className="object-cover"
                />

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* Order badge */}
                <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>
              </div>

              {/* Move buttons */}
              <div className="flex gap-1 mt-2">
                {index > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleMoveImage(index, index - 1)}
                    className="flex-1 text-xs"
                  >
                    ←
                  </Button>
                )}
                {index < images.length - 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleMoveImage(index, index + 1)}
                    className="flex-1 text-xs"
                  >
                    →
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-sm text-gray-500">
        JPG, PNG, GIF 형식, 최대 5MB, 최대 {maxImages}개
      </p>
    </div>
  )
}
