import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { Document } from '@langchain/core/documents';
import { writeFileSync, unlinkSync, mkdtempSync, rmdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export interface ParsedDocument {
  text: string;
  metadata: {
    pages?: number;
    wordCount: number;
    fileType: string;
    fileName: string;
    fileSize: number;
  };
}

class DocumentParsingService {
  async parseDocument(file: File): Promise<ParsedDocument> {
    const fileType = this.getFileType(file);

    try {
      let documents: Document[];
      let pages: number | undefined;

      switch (fileType) {
        case 'pdf':
          documents = await this.parsePDFWithMultipleStrategies(file);
          // Get pages from PDF metadata if available
          pages = documents[0]?.metadata?.pdf?.totalPages || documents.length;
          break;
        case 'docx':
          documents = await this.parseDocxWithLangChain(file);
          break;
        case 'doc':
          documents = await this.parseDocWithFallback(file);
          break;
        case 'txt':
          documents = await this.parseTextWithLangChain(file);
          break;
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }

      // Combine all document content without cleaning
      const combinedText = documents.map((doc) => doc.pageContent).join('\n\n');
      const wordCount = this.countWords(combinedText);

      return {
        text: combinedText,
        metadata: {
          pages: pages || documents.length,
          wordCount,
          fileType: fileType.toUpperCase(),
          fileName: file.name,
          fileSize: file.size,
        },
      };
    } catch (error) {
      console.error('Document parsing failed:', error);
      throw new Error(
        `Failed to parse ${fileType.toUpperCase()} file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private async parsePDFWithMultipleStrategies(file: File): Promise<Document[]> {
    console.log(`Attempting to parse PDF: ${file.name} (${file.size} bytes)`);

    // Strategy 1: Try LangChain PDFLoader with default settings
    try {
      console.log('Strategy 1: Trying LangChain PDFLoader with default settings...');
      const documents = await this.parsePDFWithLangChain(file, { splitPages: true });
      if (documents && documents.length > 0) {
        const totalContent = documents.map((doc) => doc.pageContent).join('');
        if (totalContent.trim().length > 10) {
          console.log(`Strategy 1 successful: ${documents.length} pages extracted`);
          return documents;
        }
      }
    } catch (error) {
      console.log('Strategy 1 failed:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Strategy 2: Try LangChain PDFLoader without page splitting
    try {
      console.log('Strategy 2: Trying LangChain PDFLoader without page splitting...');
      const documents = await this.parsePDFWithLangChain(file, { splitPages: false });
      if (documents && documents.length > 0) {
        const totalContent = documents.map((doc) => doc.pageContent).join('');
        if (totalContent.trim().length > 10) {
          console.log(`Strategy 2 successful: ${documents.length} pages extracted`);
          return documents;
        }
      }
    } catch (error) {
      console.log('Strategy 2 failed:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Strategy 3: Try LangChain PDFLoader with empty separator
    try {
      console.log('Strategy 3: Trying LangChain PDFLoader with empty separator...');
      const documents = await this.parsePDFWithLangChain(file, {
        splitPages: true,
        parsedItemSeparator: '',
      });
      if (documents && documents.length > 0) {
        const totalContent = documents.map((doc) => doc.pageContent).join('');
        if (totalContent.trim().length > 10) {
          console.log(`Strategy 3 successful: ${documents.length} pages extracted`);
          return documents;
        }
      }
    } catch (error) {
      console.log('Strategy 3 failed:', error instanceof Error ? error.message : 'Unknown error');
    }

    throw new Error(
      'All PDF parsing strategies failed - file may be corrupted, password-protected, or contain only images/scanned content',
    );
  }

  private async parsePDFWithLangChain(
    file: File,
    options: { splitPages?: boolean; parsedItemSeparator?: string } = {},
  ): Promise<Document[]> {
    let tempFilePath: string | null = null;

    try {
      // Create a temporary directory and file for LangChain PDFLoader
      const tempDir = mkdtempSync(join(tmpdir(), 'pdf-parsing-'));
      tempFilePath = join(tempDir, file.name);

      // Write the file buffer to temporary file
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      writeFileSync(tempFilePath, buffer);

      // Use LangChain PDFLoader with provided configuration
      const loaderOptions: any = {};
      if (options.splitPages !== undefined) {
        loaderOptions.splitPages = options.splitPages;
      }
      if (options.parsedItemSeparator !== undefined) {
        loaderOptions.parsedItemSeparator = options.parsedItemSeparator;
      }

      const loader = new PDFLoader(tempFilePath, loaderOptions);

      // Set a timeout for large file parsing (30 seconds for LangChain)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('LangChain PDF parsing timeout')), 30000);
      });

      const documents = await Promise.race([loader.load(), timeoutPromise]);

      if (!documents || documents.length === 0) {
        throw new Error('LangChain returned empty documents');
      }

      return documents;
    } finally {
      // Clean up temporary file
      if (tempFilePath) {
        try {
          unlinkSync(tempFilePath);
          const tempDir = join(tempFilePath, '..');
          try {
            rmdirSync(tempDir);
          } catch {
            // Ignore if directory is not empty or doesn't exist
          }
        } catch (cleanupError) {
          console.warn('Failed to clean up temporary file:', cleanupError);
        }
      }
    }
  }

  private async parseDocxWithLangChain(file: File): Promise<Document[]> {
    try {
      // Convert File to Blob for LangChain DocxLoader
      const blob = new Blob([await file.arrayBuffer()], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });

      const loader = new DocxLoader(blob);
      const documents = await loader.load();

      if (!documents || documents.length === 0) {
        throw new Error('No content extracted from DOCX');
      }

      return documents;
    } catch (error) {
      throw new Error(
        `DOCX parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  private async parseDocWithFallback(file: File): Promise<Document[]> {
    try {
      // For .doc files, try to use DocxLoader first (sometimes works)
      return await this.parseDocxWithLangChain(file);
    } catch {
      // If DocxLoader fails, try basic text extraction
      try {
        const buffer = await file.arrayBuffer();
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(buffer);
        if (text && text.length > 10) {
          return [
            new Document({
              pageContent: text,
              metadata: { source: file.name },
            }),
          ];
        }
      } catch {
        // Fallback text extraction failed
      }
      throw new Error('Failed to parse DOC file - format may not be supported');
    }
  }

  private async parseTextWithLangChain(file: File): Promise<Document[]> {
    try {
      // Convert File to Blob for LangChain TextLoader
      const blob = new Blob([await file.arrayBuffer()], { type: 'text/plain' });

      const loader = new TextLoader(blob);
      const documents = await loader.load();

      if (!documents || documents.length === 0) {
        throw new Error('No content extracted from text file');
      }

      return documents;
    } catch (error) {
      throw new Error(
        `Text parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // Count words in text
  private countWords(text: string): number {
    return text.split(/\s+/).filter((word) => word.length > 0).length;
  }

  // Get file type from file extension
  private getFileType(file: File): string {
    const extension = file.name.split('.').pop()?.toLowerCase();
    return extension || '';
  }

  // Utility method to validate file before parsing
  validateFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const supportedTypes = ['pdf', 'docx', 'doc', 'txt'];

    if (file.size > maxSize) {
      return { isValid: false, error: 'File size exceeds 10MB limit' };
    }

    const fileType = this.getFileType(file);
    if (!supportedTypes.includes(fileType)) {
      return { isValid: false, error: `Unsupported file type: ${fileType}` };
    }

    return { isValid: true };
  }

  // Enhanced method for resume-specific parsing
  async parseResume(file: File): Promise<string> {
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid file');
    }

    const parsedDocument = await this.parseDocument(file);
    return parsedDocument.text;
  }
}

export const documentParsingService = new DocumentParsingService();
