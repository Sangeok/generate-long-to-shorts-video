import "server-only";

import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getS3Bucket, getS3Client } from "@/lib/s3";

const UPLOAD_URL_TTL_SECONDS = 60 * 10; // 10분
const VIEW_URL_TTL_SECONDS = 60 * 60 * 24 * 7; // 7일 (SigV4 최대)

export function getViewUrlTtlSeconds(): number {
  return VIEW_URL_TTL_SECONDS;
}

export function createUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: getS3Bucket(),
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(getS3Client(), command, {
    expiresIn: UPLOAD_URL_TTL_SECONDS,
  });
}

export function createViewUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: getS3Bucket(), Key: key });
  return getSignedUrl(getS3Client(), command, {
    expiresIn: VIEW_URL_TTL_SECONDS,
  });
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    await getS3Client().send(
      new HeadObjectCommand({ Bucket: getS3Bucket(), Key: key }),
    );
    return true;
  } catch {
    return false;
  }
}
