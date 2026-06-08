import "server-only";

import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getS3Bucket, getS3Client } from "@/lib/s3";

const UPLOAD_URL_TTL_SECONDS = 60 * 10; // 10 minutes
const VIEW_URL_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days (SigV4 maximum)

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

// Returns the signed URL together with its expiry so the two never drift apart
// and the TTL never has to leak out of this module.
export async function createViewUrl(
  key: string,
): Promise<{ url: string; expiresAtMs: number }> {
  const command = new GetObjectCommand({ Bucket: getS3Bucket(), Key: key });
  const url = await getSignedUrl(getS3Client(), command, {
    expiresIn: VIEW_URL_TTL_SECONDS,
  });
  return { url, expiresAtMs: Date.now() + VIEW_URL_TTL_SECONDS * 1000 };
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    await getS3Client().send(
      new HeadObjectCommand({ Bucket: getS3Bucket(), Key: key }),
    );
    return true;
  } catch (error) {
    const status =
      typeof error === "object" && error !== null && "$metadata" in error
        ? (error as { $metadata?: { httpStatusCode?: number } }).$metadata
            ?.httpStatusCode
        : undefined;
    if (status === 404) {
      return false;
    }
    // Transient/credential errors propagate so Inngest can retry instead of
    // reporting a misleading "object not found".
    throw error;
  }
}
