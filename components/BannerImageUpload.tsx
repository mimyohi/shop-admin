'use client'

import { useState, useRef, useEffect } from 'react'
import { uploadBannerImage } from '@/lib/actions/upload'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface BannerImageUploadProps {
  onUploadComplete: (url: string) => void
  currentImageUrl?: string
  label?: string
  aspectRatio?: 'wide' | 'mobile' | 'square'
}

export default function BannerImageUpload({
  onUploadComplete,
  currentImageUrl,
  label = '이미지 선택',
  aspectRatio = 'wide'
}: BannerImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPreview(currentImageUrl || null)
  }, [currentImageUrl])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.')
      return
    }

    // Validate file size (max 10MB for banners)
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다.')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to Supabase using server action
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const result = await uploadBannerImage(formData)

      if (result.error) {
        throw new Error(result.error)
      }

      if (result.url) {
        onUploadComplete(result.url)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('이미지 업로드에 실패했습니다.')
      setPreview(currentImageUrl || null)
    } finally {
      setUploading(false)
    }
  }

  const dimensions = aspectRatio === 'wide'
    ? { width: 'w-full max-w-xl', height: 'h-40' }
    : aspectRatio === 'square'
    ? { width: 'w-48', height: 'h-48' }
    : { width: 'w-48', height: 'h-80' }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          variant="outline"
        >
          {uploading ? '업로드 중...' : label}
        </Button>
        {preview && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setPreview(null)
              onUploadComplete('')
              if (fileInputRef.current) {
                fileInputRef.current.value = ''
              }
            }}
            disabled={uploading}
            className="text-red-500 hover:text-red-600"
          >
            제거
          </Button>
        )}
      </div>

      {preview && (
        <div className={`relative ${dimensions.width} ${dimensions.height} border rounded-lg overflow-hidden bg-gray-100`}>
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-contain"
          />
        </div>
      )}

      <p className="text-xs text-gray-500">
        JPG, PNG, GIF 형식, 최대 10MB
      </p>
    </div>
  )
}
