/**
 * 이미지 분할 유틸리티
 * 높이가 너비의 2배 이상인 이미지를 정사각형 조각으로 분할합니다.
 */

export interface SplitResult {
  shouldSplit: boolean;
  files: File[];
  message?: string;
}

/**
 * 이미지 파일을 로드하여 분할이 필요한지 확인하고, 필요시 분할합니다.
 * @param file 원본 이미지 파일
 * @param originalFileName 원본 파일명 (분할된 파일명 생성에 사용)
 * @returns 분할 결과 (원본 또는 분할된 파일들)
 */
export async function splitImageIfNeeded(
  file: File,
  originalFileName?: string
): Promise<SplitResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = async () => {
        const { width, height } = img;

        // 높이가 너비의 2배 미만이면 분할하지 않음
        if (height < width * 2) {
          resolve({
            shouldSplit: false,
            files: [file],
          });
          return;
        }

        try {
          // 이미지를 정사각형으로 분할
          const splitFiles = await splitImageIntoSquares(
            img,
            file.type,
            originalFileName || file.name
          );

          resolve({
            shouldSplit: true,
            files: splitFiles,
            message: `높이가 긴 이미지가 감지되어 ${splitFiles.length}개의 이미지로 분할되었습니다`,
          });
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('이미지를 로드할 수 없습니다'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('파일을 읽을 수 없습니다'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * 이미지를 정사각형 조각으로 분할합니다.
 * @param img HTML 이미지 요소
 * @param mimeType 이미지 MIME 타입
 * @param fileName 원본 파일명
 * @returns 분할된 파일 배열
 */
async function splitImageIntoSquares(
  img: HTMLImageElement,
  mimeType: string,
  fileName: string
): Promise<File[]> {
  const { width, height } = img;
  const squareSize = width; // 정사각형의 크기는 원본 너비와 동일
  const pieces: File[] = [];

  // 분할할 조각 수 계산
  const numPieces = Math.ceil(height / squareSize);

  // Canvas 생성
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas context를 생성할 수 없습니다');
  }

  // 파일명에서 확장자 분리
  const lastDotIndex = fileName.lastIndexOf('.');
  const nameWithoutExt =
    lastDotIndex > 0 ? fileName.slice(0, lastDotIndex) : fileName;
  const ext = lastDotIndex > 0 ? fileName.slice(lastDotIndex) : '.jpg';

  // 각 조각 생성
  for (let i = 0; i < numPieces; i++) {
    const yPos = i * squareSize;
    const pieceHeight = Math.min(squareSize, height - yPos);

    // 마지막 조각이 정사각형보다 작을 수 있음
    canvas.width = width;
    canvas.height = pieceHeight;

    // 이미지의 해당 부분을 캔버스에 그리기
    ctx.drawImage(
      img,
      0, // source x
      yPos, // source y
      width, // source width
      pieceHeight, // source height
      0, // dest x
      0, // dest y
      width, // dest width
      pieceHeight // dest height
    );

    // Canvas를 Blob으로 변환
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Blob 생성 실패'));
          }
        },
        mimeType,
        0.95 // 품질 (0.95 = 95%)
      );
    });

    // Blob을 File로 변환
    const pieceFileName = `${nameWithoutExt}_part${i + 1}of${numPieces}${ext}`;
    const pieceFile = new File([blob], pieceFileName, { type: mimeType });
    pieces.push(pieceFile);
  }

  return pieces;
}

/**
 * 여러 이미지 파일을 처리하여 필요시 분할합니다.
 * @param files 원본 이미지 파일 배열
 * @returns 처리된 파일 배열과 메시지
 */
export async function processMultipleImages(files: File[]): Promise<{
  files: File[];
  messages: string[];
}> {
  const processedFiles: File[] = [];
  const messages: string[] = [];

  for (const file of files) {
    const result = await splitImageIfNeeded(file, file.name);
    processedFiles.push(...result.files);

    if (result.shouldSplit && result.message) {
      messages.push(result.message);
    }
  }

  return {
    files: processedFiles,
    messages,
  };
}
