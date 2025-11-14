import path from "node:path";
import { randomUUID } from "node:crypto";

import { prisma } from "../lib/prisma";
import { uploadToS3, storageConfig, generateSignedGetUrl } from "../lib/storage";
import { ApiError } from "../middleware/errorHandler";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

const normalizeFileName = (originalName: string): string => {
  const ext = path.extname(originalName) || "";
  const base = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, "-");
  return `${base || "upload"}${ext}`;
};

const buildStorageKey = (userId: string, originalName: string): string => {
  const sanitizedName = normalizeFileName(originalName);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${userId}/${timestamp}-${randomUUID()}-${sanitizedName}`;
};

export async function listUserDocuments(userId: string) {
  return prisma.document.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function storeUserDocument({
  userId,
  file,
}: {
  userId: string;
  file: Express.Multer.File;
}) {
  if (!file) {
    throw new ApiError("File is required", 400);
  }

  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new ApiError("Unsupported file type", 415);
  }

  const key = buildStorageKey(userId, file.originalname);
  const uploaded = await uploadToS3({
    key,
    contentType: file.mimetype,
    body: file.buffer,
  });

  return prisma.document.create({
    data: {
      userId,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      bucket: storageConfig.bucket,
      storageKey: uploaded.key,
      url: uploaded.url,
    },
  });
}

export async function getDocumentForUser(documentId: string, userId: string) {
  const document = await prisma.document.findFirst({
    where: {
      id: documentId,
      userId,
    },
  });

  if (!document) {
    throw new ApiError("Document not found", 404);
  }

  return document;
}

export async function getSignedDocumentUrl(documentId: string, userId: string) {
  const document = await getDocumentForUser(documentId, userId);
  const expiresIn = 120;
  const url = await generateSignedGetUrl(document.storageKey, expiresIn);
  return { url, expiresIn };
}
