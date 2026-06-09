import "server-only";

import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getS3Bucket, getS3Client } from "@/lib/s3";

const PUT_URL_TTL_SECONDS = 60 * 10; // 10분
const GET_URL_TTL_SECONDS = 60 * 30; // 30분 (전사용 단기 URL)

export function presignPutUrl(
  key: string,
  contentType: string,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: getS3Bucket(),
    Key: key,
    ContentType: contentType,
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
