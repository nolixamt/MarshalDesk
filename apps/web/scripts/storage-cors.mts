// Sets the CORS rule on the profile-images bucket so browsers can PUT avatars directly.
// Idempotent: it replaces the whole rule set. Run once per branch's storage, and again
// whenever the app's origin changes. Extra origins can be passed as arguments.
//   pnpm --filter @marshaldesk/web storage:cors [https://extra.example.com ...]
import {
  GetBucketCorsCommand,
  PutBucketCorsCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const BUCKET = "profile-images";

function required(name: string): string {
  const value = process.env[name];
  if (!value)
    throw new Error(`${name} is not set (expected in apps/web/.env.local)`);
  return value;
}

const appOrigin = new URL(required("NEXT_PUBLIC_APP_URL")).origin;
const extraOrigins = process.argv
  .slice(2)
  .map((value) => new URL(value).origin);
const origins = [...new Set([appOrigin, ...extraOrigins])];

const s3 = new S3Client({
  endpoint: required("AWS_ENDPOINT_URL_S3"),
  region: required("AWS_REGION"),
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

await s3.send(
  new PutBucketCorsCommand({
    Bucket: BUCKET,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedOrigins: origins,
          AllowedMethods: ["PUT", "GET", "HEAD"],
          AllowedHeaders: ["content-type", "cache-control"],
          ExposeHeaders: ["ETag"],
          MaxAgeSeconds: 3600,
        },
      ],
    },
  }),
);

const current = await s3.send(new GetBucketCorsCommand({ Bucket: BUCKET }));
console.log(`CORS on ${BUCKET}:`, JSON.stringify(current.CORSRules, null, 2));
