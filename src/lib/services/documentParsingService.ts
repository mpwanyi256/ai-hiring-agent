import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
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
  // Main parsing method using LangChain document loaders
  async parseDocument(file: File): Promise<ParsedDocument> {
    const fileType = this.getFileType(file);

    try {
      // Parsing file
      let documents: Document[];
      let pages: number | undefined;

      // Create a temporary file-like object for LangChain loaders
      const blob = new Blob([file], { type: file.type });
      const tempFile = new File([blob], file.name, { type: file.type });

      switch (fileType) {
        case 'pdf':
          documents = await this.parsePDFWithLangChain(tempFile);
          pages = documents.length; // Each page typically becomes a document
          break;
        case 'docx':
          documents = await this.parseDocxWithLangChain(tempFile);
          break;
        case 'doc':
          // For .doc files, we'll fall back to buffer parsing since LangChain DocxLoader primarily handles .docx
          documents = await this.parseDocWithFallback(tempFile);
          break;
        case 'txt':
          documents = await this.parseTextWithLangChain(tempFile);
          break;
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }

      // Combine all document content
      const combinedText = documents.map((doc) => doc.pageContent).join('\n\n');
      const cleanedText = this.cleanText(combinedText);
      const wordCount = this.countWords(cleanedText);

      return {
        text: cleanedText,
        metadata: {
          pages: pages || documents.length,
          wordCount,
          fileType: fileType.toUpperCase(),
          fileName: file.name,
          fileSize: file.size,
        },
      };
    } catch (error) {
      console.error('LangChain PDF parsing failed:', error);

      // Enhanced fallback for large/complex PDFs
      try {
        console.log('Attempting fallback PDF text extraction...');

        // Try alternative parsing approach for large files
        const buffer = await file.arrayBuffer();

        // Try multiple text extraction approaches
        let extractedText = '';

        // Approach 1: UTF-8 decoding
        try {
          const decoder = new TextDecoder('utf-8');
          const text = decoder.decode(buffer);
          extractedText = this.extractTextFromPDFString(text);
        } catch (_e) {
          console.log('UTF-8 decoding failed, trying latin1...');
        }

        // Approach 2: Latin1 decoding (for older PDFs)
        if (!extractedText || extractedText.length < 10) {
          try {
            const decoder = new TextDecoder('latin1');
            const text = decoder.decode(buffer);
            extractedText = this.extractTextFromPDFString(text);
          } catch (_e) {
            console.log('Latin1 decoding also failed');
          }
        }

        if (extractedText && extractedText.length > 10) {
          console.log(`Fallback extraction successful: ${extractedText.length} characters`);
          return {
            text: extractedText,
            metadata: {
              pages: 1,
              wordCount: this.countWords(extractedText),
              fileType: 'PDF',
              fileName: file.name,
              fileSize: file.size,
            },
          };
        }
      } catch (fallbackError) {
        console.error('Fallback PDF extraction failed:', fallbackError);
      }

      // If all methods fail, provide a more helpful error message
      const errorMessage =
        file.size > 5 * 1024 * 1024
          ? 'Failed to parse large PDF file. The file may contain complex graphics, signatures, or be password-protected. Please try with a simpler PDF or convert to text format.'
          : 'Failed to parse PDF file. The file may be corrupted, password-protected, or in an unsupported format.';

      throw new Error(errorMessage);
    }
  }

  private async parsePDFWithLangChain(file: File): Promise<Document[]> {
    let tempFilePath: string | null = null;

    try {
      console.log(`Attempting to parse PDF: ${file.name} (${file.size} bytes)`);

      // Create a temporary directory and file for LangChain PDFLoader
      const tempDir = mkdtempSync(join(tmpdir(), 'pdf-parsing-'));
      tempFilePath = join(tempDir, file.name);

      // Write the file buffer to temporary file
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      writeFileSync(tempFilePath, buffer);

      // Use LangChain PDFLoader with file path (as recommended)
      const loader = new PDFLoader(tempFilePath);

      // Set a timeout for large file parsing (30 seconds)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('PDF parsing timeout - file may be too complex')), 30000);
      });

      const documents = await Promise.race([loader.load(), timeoutPromise]);

      if (!documents || documents.length === 0) {
        throw new Error('No content extracted from PDF');
      }

      // Optional: Split documents into smaller chunks for better processing
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 2000,
        chunkOverlap: 200,
      });

      const splitDocs = await textSplitter.splitDocuments(documents);

      console.log(
        `Successfully parsed PDF: ${documents.length} pages, ${splitDocs.length} chunks extracted`,
      );
      return splitDocs;
    } catch (error) {
      console.error('LangChain PDF parsing error:', error);
      throw new Error(
        `LangChain PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      // Clean up temporary file
      if (tempFilePath) {
        try {
          unlinkSync(tempFilePath);
          // Also try to remove the temp directory if it's empty
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

      // Use LangChain DocxLoader with blob
      const loader = new DocxLoader(blob);
      const documents = await loader.load();

      if (!documents || documents.length === 0) {
        throw new Error('No content extracted from DOCX');
      }

      return documents;
    } catch {
      // LangChain DOCX parsing error
      throw new Error('LangChain DOCX parsing failed');
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
      throw new Error('Failed to parse DOC file');
    }
  }

  private async parseTextWithLangChain(file: File): Promise<Document[]> {
    try {
      // Convert File to Blob for LangChain TextLoader
      const blob = new Blob([await file.arrayBuffer()], { type: 'text/plain' });

      // Use LangChain TextLoader with blob
      const loader = new TextLoader(blob);
      const documents = await loader.load();

      if (!documents || documents.length === 0) {
        throw new Error('No content extracted from text file');
      }

      return documents;
    } catch {
      // LangChain text parsing error
      throw new Error('LangChain text parsing failed');
    }
  }

  // Extract text from PDF string using basic regex patterns
  private extractTextFromPDFString(pdfString: string): string {
    // Basic PDF text extraction using regex patterns
    // This is a fallback method and may not work for all PDFs
    const textMatches = pdfString.match(/BT\s*[\s\S]*?ET/g);
    if (textMatches) {
      return textMatches
        .map((match) => {
          // Extract text between parentheses or brackets
          const textContent = match.match(/\((.*?)\)/g) || match.match(/\[(.*?)\]/g);
          return textContent ? textContent.map((t) => t.slice(1, -1)).join(' ') : '';
        })
        .join('\n')
        .replace(/\\[rn]/g, '\n')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Fallback: try to extract any readable text
    return pdfString
      .replace(/[^\x20-\x7E\n\r\t]/g, '') // Remove non-printable characters
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Clean extracted text
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '') // Remove control characters
      .trim();
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
