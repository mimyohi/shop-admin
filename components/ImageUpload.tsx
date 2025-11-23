'use client'

import { useState, useRef, useEffect } from 'react'
import { uploadImage } from '@/lib/actions/upload'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface ImageUploadProps {
  onUploadComplete: (url: string) => void
  currentImageUrl?: string
}

export default function ImageUpload({ onUploadComplete, currentImageUrl }: ImageUploadProps) {
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

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.')
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

      const result = await uploadImage(formData)

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
        >
          {uploading ? '업로드 중...' : '이미지 선택'}
        </Button>
        {preview && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setPreview(null)
              onUploadComplete('')
              if (fileInputRef.current) {
                fileInputRef.current.value = ''
              }
            }}
            disabled={uploading}
          >
            이미지 제거
          </Button>
        )}
      </div>

      {preview && (
        <div className="relative w-64 h-64 border rounded-lg overflow-hidden">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-cover"
          />
        </div>
      )}

      <p className="text-sm text-gray-500">
        JPG, PNG, GIF 형식, 최대 5MB
      </p>
    </div>
  )
}
