import { COMMON_ERROR_STATUS_MAP } from "@orpc/client";

export const errorStatusMap = {
  ...COMMON_ERROR_STATUS_MAP,
  EMAIL_NOT_VERIFIED: 403,
  WORKSPACE_REQUIRED: 403,
  AVATAR_INVALID: 400,
};
