import "server-only";

import { CopyObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

import { getS3Bucket, getS3Client, getS3ObjectUrl } from "@/lib/s3";

import { buildPendingS3Key } from "../s3-key";

export interface UploadedVideoObject {
  key: string;
  url: string;
}

function encodeCopySource(bucket: string, key: string): string {
  const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  return `${bucket}/${encodedKey}`;
}

export async function uploadPendingVideoToS3(
  finalKey: string,
): Promise<UploadedVideoObject> {
  const bucket = getS3Bucket();
  const pendingKey = buildPendingS3Key(finalKey);
  const client = getS3Client();

  await client.send(
    new CopyObjectCommand({
      Bucket: bucket,
      CopySource: encodeCopySource(bucket, pendingKey),
      Key: finalKey,
    }),
  );

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: pendingKey,
    }),
  );

  return { key: finalKey, url: getS3ObjectUrl(finalKey) };
}
