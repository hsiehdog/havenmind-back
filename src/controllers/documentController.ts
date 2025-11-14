import { Request, Response, NextFunction } from "express";
import { ApiError } from "../middleware/errorHandler";
import {
  listUserDocuments,
  storeUserDocument,
  getSignedDocumentUrl,
} from "../services/documentService";

export const getDocuments = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError("Unauthorized", 401);
    }

    const documents = await listUserDocuments(req.user.id);
    res.json({ documents });
  } catch (error) {
    next(error);
  }
};

export const uploadDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError("Unauthorized", 401);
    }

    if (!req.file) {
      throw new ApiError("No file uploaded", 400);
    }

    const documentRecord = await storeUserDocument({
      userId: req.user.id,
      file: req.file,
    });

    res.status(201).json({ document: documentRecord });
  } catch (error) {
    next(error);
  }
};

export const getDocumentViewUrl = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new ApiError("Unauthorized", 401);
    }

    const { documentId } = req.params;
    if (!documentId) {
      throw new ApiError("Document ID is required", 400);
    }

    const payload = await getSignedDocumentUrl(documentId, req.user.id);
    res.json(payload);
  } catch (error) {
    next(error);
  }
};
