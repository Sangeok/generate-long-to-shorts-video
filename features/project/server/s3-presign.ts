import "server-only";

import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getS3Bucket, getS3Client } from "@/lib/s3";

const PUT_URL_TTL_SECONDS = 60 * 10; // 10분
const GET_URL_TTL_SECONDS = 60 * 30; // 30분 (전사용 단기 URL)

// ContentLength가 서명에 포함되어 신고한 크기와 다른 PUT은 S3가 거부한다.
export function presignPutUrl(
  key: string,
  contentType: string,
  contentLength: number,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: getS3Bucket(),
    Key: key,
    ContentType: contentType,
    ContentLength: contentLength,
  });
  return getSignedUrl(getS3Client(), command, {
    expiresIn: PUT_URL_TTL_SECONDS,
  });
}

export function presignGetUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: getS3Bucket(), Key: key });
  return getSignedUrl(getS3Client(), command, {
    expiresIn: GET_URL_TTL_SECONDS,
  });
}

export function presignDownloadUrl(
  key: string,
  filename: string,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: getS3Bucket(),
    Key: key,
    ResponseContentDisposition: `attachment; filename="${filename}"`,
  });
  return getSignedUrl(getS3Client(), command, {
    expiresIn: GET_URL_TTL_SECONDS,
  });
}
