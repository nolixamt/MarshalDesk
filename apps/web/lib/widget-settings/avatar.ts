import "server-only";
import { randomUUID } from "node:crypto";
import {
  AVATAR_MAX_BYTES,
  avatarContentTypeSchema,
  avatarExtension,
  type AvatarContentType,
  type AvatarUpload,
} from "@marshaldesk/shared";
import {
  deleteObjectQuietly,
  headObject,
  presignPut,
  PROFILE_IMAGES_BUCKET,
  readObjectPrefix,
} from "@/lib/storage/s3";

const AVATAR_CACHE_CONTROL = "public, max-age=31536000, immutable";
const UPLOAD_URL_TTL_SECONDS = 120;

export function avatarKeyPrefix(workspaceId: string): string {
  return `workspaces/${workspaceId}/agent-avatar/`;
}

const keyPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|webp|gif)$/;

export function isOwnAvatarKey(workspaceId: string, key: string): boolean {
  const prefix = avatarKeyPrefix(workspaceId);
  return key.startsWith(prefix) && keyPattern.test(key.slice(prefix.length));
}

export async function createAvatarUpload(
  workspaceId: string,
  contentType: AvatarContentType,
): Promise<AvatarUpload> {
  const key = `${avatarKeyPrefix(workspaceId)}${randomUUID()}.${avatarExtension(contentType)}`;
  const uploadUrl = await presignPut({
    bucket: PROFILE_IMAGES_BUCKET,
    key,
    contentType,
    cacheControl: AVATAR_CACHE_CONTROL,
    expiresInSeconds: UPLOAD_URL_TTL_SECONDS,
  });
  return {
    key,
    uploadUrl,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": AVATAR_CACHE_CONTROL,
    },
  };
}

function startsWith(bytes: Uint8Array, signature: number[], offset = 0) {
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

// The stored Content-Type is whatever the browser declared, so check the file's own signature too.
function matchesSignature(
  contentType: AvatarContentType,
  bytes: Uint8Array,
): boolean {
  switch (contentType) {
    case "image/png":
      return startsWith(
        bytes,
        [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      );
    case "image/jpeg":
      return startsWith(bytes, [0xff, 0xd8, 0xff]);
    case "image/gif":
      return startsWith(bytes, [0x47, 0x49, 0x46, 0x38]);
    case "image/webp":
      return (
        startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
        startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)
      );
    default: {
      const unreachable: never = contentType;
      return unreachable;
    }
  }
}

/** The presigned PUT can't limit size, so this HEAD is the real type and size check. */
export async function verifyUploadedAvatar(
  key: string,
): Promise<"ok" | "missing" | "invalid"> {
  const head = await headObject(PROFILE_IMAGES_BUCKET, key);
  if (!head) return "missing";
  const type = avatarContentTypeSchema.safeParse(head.contentType);
  const extensionMatches =
    type.success && key.endsWith(`.${avatarExtension(type.data)}`);
  const valid =
    type.success &&
    extensionMatches &&
    head.size > 0 &&
    head.size <= AVATAR_MAX_BYTES &&
    matchesSignature(
      type.data,
      await readObjectPrefix(PROFILE_IMAGES_BUCKET, key, 12),
    );
  if (!valid) {
    await deleteObjectQuietly(PROFILE_IMAGES_BUCKET, key);
    return "invalid";
  }
  return "ok";
}
