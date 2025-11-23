'use client'

import { useState, useRef, useEffect } from 'react'
import { uploadImage } from '@/lib/actions/upload'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { X, Upload, Info } from 'lucide-react'
import { processMultipleImages } from '@/lib/image-splitter'

interface MultiImageUploadProps {
  onImagesChange: (urls: string[]) => void
  currentImages?: string[]
  maxImages?: number
}

export default function MultiImageUpload({
  onImagesChange,
  currentImages = [],
  maxImages = 999
}: MultiImageUploadProps) {
  const [images, setImages] = useState<string[]>(currentImages)
  const [uploading, setUploading] = useState(false)
  const [splitMessages, setSplitMessages] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setImages(currentImages)
  }, [currentImages])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setSplitMessages([])
    setUploadProgress('이미지 분석 중...')
    const uploadedUrls: string[] = []
    const messages: string[] = []

    try {
      // Step 1: Validate and process images (split if needed)
      const filesToProcess: File[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert(`${file.name}은(는) 이미지 파일이 아닙니다.`)
          continue
        }

        // Validate file size (max 13MB)
        if (file.size > 13 * 1024 * 1024) {
          alert(`${file.name}의 크기가 13MB를 초과합니다.`)
          continue
        }

        filesToProcess.push(file)
      }

      // Step 2: Process images (split tall images into squares)
      const { files: processedFiles, messages: splitMsgs } = await processMultipleImages(filesToProcess)
      messages.push(...splitMsgs)

      // Check max images limit after processing (only if a specific limit is set)
      if (maxImages < 999 && images.length + processedFiles.length > maxImages) {
        alert(`분할 처리 후 총 ${processedFiles.length}개의 이미지가 생성되었습니다. 최대 ${maxImages}개까지만 업로드 가능합니다. (현재: ${images.length}개)`)
        setUploading(false)
        setUploadProgress('')
        return
      }

      // Step 3: Upload processed files using server action
      for (let i = 0; i < processedFiles.length; i++) {
        const processedFile = processedFiles[i]
        setUploadProgress(`이미지 업로드 중... (${i + 1}/${processedFiles.length})`)

        // Upload using server action
        const formData = new FormData()
        formData.append('file', processedFile)
        const result = await uploadImage(formData)

        if (result.error) {
          console.error('Upload error:', result.error)
          continue
        }

        if (result.url) {
          uploadedUrls.push(result.url)
        }
      }

      // Step 4: Update state
      const newImages = [...images, ...uploadedUrls]
      setImages(newImages)
      onImagesChange(newImages)
      setSplitMessages(messages)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      setUploadProgress('업로드 완료!')
      setTimeout(() => setUploadProgress(''), 2000)
    } catch (error) {
      console.error('Upload error:', error)
      alert('이미지 업로드에 실패했습니다.')
      setUploadProgress('')
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
          disabled={uploading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? '처리 중...' : '이미지 추가'}
        </Button>
        <span className="text-sm text-gray-500">
          {images.length}개
        </span>
      </div>

      {/* Upload progress */}
      {uploadProgress && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
          <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">{uploadProgress}</p>
        </div>
      )}

      {/* Split messages */}
      {splitMessages.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-1">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800 mb-1">이미지 자동 분할 완료</p>
              {splitMessages.map((message, idx) => (
                <p key={idx} className="text-sm text-green-700">• {message}</p>
              ))}
            </div>
          </div>
        </div>
      )}

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
        JPG, PNG, GIF 형식, 최대 13MB
        <br />
        <span className="text-xs text-gray-400">
          ※ 높이가 너비의 2배 이상인 이미지는 자동으로 정사각형 조각으로 분할됩니다.
        </span>
      </p>
    </div>
  )
}
