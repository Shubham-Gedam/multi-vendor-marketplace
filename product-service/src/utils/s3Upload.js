import {
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

import { randomUUID } from "crypto";
import s3 from "../config/s3.js";

const bucketName = process.env.S3_BUCKET_NAME;

// Upload image to S3
export async function uploadToS3(file) {
  const extensionMap = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

  const extension = extensionMap[file.mimetype];

  if (!extension) {
    throw new Error("Unsupported image type");
  }

  const key = `products/${randomUUID()}.${extension}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  return {
    key,
    url: `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
  };
}

// Delete image from S3
export async function deleteFromS3(key) {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
  );
}