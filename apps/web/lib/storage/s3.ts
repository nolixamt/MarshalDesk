import "server-only";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { serverEnv } from "@/lib/env";

export const PROFILE_IMAGES_BUCKET = "profile-images";

// Without WHEN_REQUIRED the presigner signs a checksum of an empty body and every browser PUT fails.
const s3 = new S3Client({
  endpoint: serverEnv.AWS_ENDPOINT_URL_S3,
  region: serverEnv.AWS_REGION,
  credentials: {
    accessKeyId: serverEnv.AWS_ACCESS_KEY_ID,
    secretAccessKey: serverEnv.AWS_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

export function publicObjectUrl(bucket: string, key: string): string {
  const base = serverEnv.STORAGE_PUBLIC_BASE_URL.replace(/\/+$/, "");
  const path = key.split("/").map(encodeURIComponent).join("/");
  return `${base}/${bucket}/${path}`;
}

export async function presignPut(input: {
  bucket: string;
  key: string;
  contentType: string;
  cacheControl: string;
  expiresInSeconds: number;
}): Promise<string> {
  return getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: input.bucket,
      Key: input.key,
      ContentType: input.contentType,
      CacheControl: input.cacheControl,
    }),
    {
      expiresIn: input.expiresInSeconds,
      signableHeaders: new Set(["content-type", "cache-control"]),
    },
  );
}

export type ObjectHead = { size: number; contentType: string | null };

export async function headObject(
  bucket: string,
  key: string,
): Promise<ObjectHead | null> {
  try {
    const head = await s3.send(
      new HeadObjectCommand({ Bucket: bucket, Key: key }),
    );
    return {
      size: head.ContentLength ?? 0,
      contentType: head.ContentType ?? null,
    };
  } catch (error) {
    if (error instanceof NotFound) return null;
    if (
      error instanceof Error &&
      "name" in error &&
      (error.name === "NotFound" || error.name === "NoSuchKey")
    ) {
      return null;
    }
    throw error;
  }
}

export async function readObjectPrefix(
  bucket: string,
  key: string,
  length: number,
): Promise<Uint8Array> {
  const result = await s3.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      Range: `bytes=0-${length - 1}`,
    }),
  );
  return (await result.Body?.transformToByteArray()) ?? new Uint8Array();
}

export async function deleteObject(bucket: string, key: string) {
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

/** Deletes without failing the caller: an orphaned object is acceptable, a failed save is not. */
export async function deleteObjectQuietly(bucket: string, key: string) {
  try {
    await deleteObject(bucket, key);
  } catch (error) {
    console.error(`Couldn't delete ${bucket}/${key}`, error);
  }
}
