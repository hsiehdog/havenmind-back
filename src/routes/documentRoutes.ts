import { Router } from "express";
import multer from "multer";

import { fileUploadMaxBytes } from "../config/env";
import {
  getDocuments,
  uploadDocument,
  getDocumentViewUrl,
} from "../controllers/documentController";
import { requireAuth } from "../middleware/authMiddleware";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: fileUploadMaxBytes,
  },
});

router.get("/:documentId/url", requireAuth, getDocumentViewUrl);
router.get("/", requireAuth, getDocuments);
router.post("/", requireAuth, upload.single("file"), uploadDocument);

export default router;
