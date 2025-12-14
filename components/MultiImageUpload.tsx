'use client'

import { useState, useRef, useEffect } from 'react'
import { uploadImage } from '@/lib/actions/upload'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { X, Upload, Info, AlertCircle } from 'lucide-react'
import { processMultipleImages } from '@/lib/image-splitter'

interface MultiImageUploadProps {
  onImagesChange: (urls: string[]) => void
  currentImages?: string[]
  maxImages?: number
}

// 재시도 로직이 포함된 업로드 함수
async function uploadWithRetry(
  file: File,
  maxRetries: number = 2
): Promise<{ url?: string; error?: string; fileName: string }> {
  let lastError = ''

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const result = await uploadImage(formData)

      if (result.url) {
        return { url: result.url, fileName: file.name }
      }

      lastError = result.error || 'Unknown error'

      // 마지막 시도가 아니면 잠시 대기 후 재시도
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Upload failed'

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
      }
    }
  }

  return { error: lastError, fileName: file.name }
}

// 청크 단위 병렬 업로드 (동시에 3개씩)
async function uploadInChunks(
  files: File[],
  chunkSize: number = 3,
  onProgress: (completed: number, total: number) => void
): Promise<{ urls: string[]; failedFiles: string[] }> {
  const urls: string[] = []
  const failedFiles: string[] = []
  let completed = 0

  for (let i = 0; i < files.length; i += chunkSize) {
    const chunk = files.slice(i, i + chunkSize)

    const results = await Promise.all(
      chunk.map(file => uploadWithRetry(file))
    )

    for (const result of results) {
      if (result.url) {
        urls.push(result.url)
      } else {
        failedFiles.push(result.fileName)
      }
      completed++
      onProgress(completed, files.length)
    }
  }

  return { urls, failedFiles }
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
  const [failedUploads, setFailedUploads] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setImages(currentImages)
  }, [currentImages])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setSplitMessages([])
    setFailedUploads([])
    setUploadProgress('이미지 분석 중...')
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

      // Step 3: Upload processed files using parallel upload with retry
      const { urls: uploadedUrls, failedFiles } = await uploadInChunks(
        processedFiles,
        3, // 동시에 3개씩 업로드
        (completed, total) => {
          setUploadProgress(`이미지 업로드 중... (${completed}/${total})`)
        }
      )

      // Step 4: Update state
      const newImages = [...images, ...uploadedUrls]
      setImages(newImages)
      onImagesChange(newImages)
      setSplitMessages(messages)
      setFailedUploads(failedFiles)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      if (failedFiles.length > 0) {
        setUploadProgress(`업로드 완료 (${failedFiles.length}개 실패)`)
      } else {
        setUploadProgress('업로드 완료!')
        setTimeout(() => setUploadProgress(''), 2000)
      }
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

      {/* Failed uploads */}
      {failedUploads.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 mb-1">
                {failedUploads.length}개 이미지 업로드 실패 (재시도 후에도 실패)
              </p>
              {failedUploads.slice(0, 5).map((fileName, idx) => (
                <p key={idx} className="text-sm text-red-700">• {fileName}</p>
              ))}
              {failedUploads.length > 5 && (
                <p className="text-sm text-red-700">... 외 {failedUploads.length - 5}개</p>
              )}
            </div>
          </div>
        </div>
      )}

      {images.length > 0 && (
        <div className="space-y-3">
          {images.map((url, index) => (
            <div key={index} className="relative group border rounded-lg overflow-hidden bg-gray-100 max-w-md">
              {/* 이미지를 적당한 크기로 표시 */}
              <Image
                src={url}
                alt={`Detail image ${index + 1}`}
                width={400}
                height={400}
                className="w-full h-auto"
              />

              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Order badge */}
              <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                {index + 1}
              </div>

              {/* Move buttons */}
              <div className="absolute bottom-2 left-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {index > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => handleMoveImage(index, index - 1)}
                    className="flex-1 text-xs"
                  >
                    ↑ 위로
                  </Button>
                )}
                {index < images.length - 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => handleMoveImage(index, index + 1)}
                    className="flex-1 text-xs"
                  >
                    ↓ 아래로
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
