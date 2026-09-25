/** The subset of multer's in-memory file this module reads — declared locally so we don't need @types/multer. */
export interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}
