import "server-only";

import { PutObjectCommand } from "@aws-sdk/client-s3";

import { getS3Bucket, getS3Client } from "@/lib/s3";

export function uploadObject(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<unknown> {
  return getS3Client().send(
    new PutObjectCommand({
      Bucket: getS3Bucket(),
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}
