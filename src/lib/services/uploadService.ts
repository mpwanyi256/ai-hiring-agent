import { createClient } from '@/lib/supabase/server';

class ServerUploadService {
  /**
   * Uploads a file to a bucket.
   * @param file - The file to upload
   * @param bucketName - The name of the bucket to upload the file to
   * @param path - The path to upload the file to
   * @returns The public URL of the uploaded file
   */
  async uploadFile({
    file,
    bucketName,
  }: {
    file: File;
    bucketName: string;
    path: string;
  }): Promise<{ public_url: string; path: string }> {
    try {
      const supabase = await createClient();

      const fileName = this.validateFile(file);
      const filePath = `${bucketName}/${fileName}`;

      const { error } = await supabase.storage.from(bucketName).upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (error) {
        throw error;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(filePath);

      return { public_url: publicUrl, path: filePath };
    } catch (e) {
      throw e;
    }
  }

  /**
   * Deletes a file from a bucket.
   * @param bucketName - The name of the bucket to delete the file from
   * @param path - The path of the file to delete
   */
  async deleteFile({ bucketName, path }: { bucketName: string; path: string }): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase.storage.from(bucketName).remove([path]);
    if (error) {
      throw error;
    }
  }

  /**
   * Validates a file and returns a unique file name.
   * @param file - The file to validate
   * @returns The unique file name
   */
  private validateFile(file: File): string {
    if (!file) {
      throw new Error('File is required');
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const fileName = `${Date.now()}.${fileExt}`;

    if (!fileExt) {
      throw new Error('Invalid file extension');
    }

    return fileName;
  }
}

export const uploadService = new ServerUploadService();
