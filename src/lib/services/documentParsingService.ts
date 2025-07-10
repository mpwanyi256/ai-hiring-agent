import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { DocxLoader } from '@langchain/community/document_loaders/fs/docx';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { Document } from '@langchain/core/documents';

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
          documents = await this.parseDocWithFallback(file);
          break;
        case 'txt':
          documents = await this.parseTextWithLangChain(tempFile);
          break;
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }

      // Combine all document text
      const text = documents.map((doc) => doc.pageContent).join('\n\n');

      // Clean and validate the extracted text
      const cleanedText = this.cleanText(text);
      const wordCount = this.countWords(cleanedText);

      if (!cleanedText || cleanedText.length < 10) {
        throw new Error(`Failed to extract meaningful text from ${fileType.toUpperCase()} file`);
      }

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
    } catch {
      // LangChain PDF parsing error
      // Fallback to basic extraction
      try {
        // Attempting fallback PDF text extraction...
        const buffer = await file.arrayBuffer();
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(buffer);
        const extractedText = this.extractTextFromPDFString(text);
        if (extractedText && extractedText.length > 10) {
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
      } catch {
        // Fallback PDF extraction failed
        throw new Error(
          'Failed to parse PDF file. The file may be corrupted, password-protected, or in an unsupported format.',
        );
      }
      throw new Error(
        'Failed to parse PDF file. The file may be corrupted, password-protected, or in an unsupported format.',
      );
    }
  }

  private async parsePDFWithLangChain(file: File): Promise<Document[]> {
    try {
      // Convert File to Blob for LangChain PDFLoader
      const blob = new Blob([await file.arrayBuffer()], { type: 'application/pdf' });

      // Use LangChain PDFLoader with blob
      const loader = new PDFLoader(blob, {
        splitPages: true, // Split into separate pages for better parsing
      });

      const documents = await loader.load();

      if (!documents || documents.length === 0) {
        throw new Error('No content extracted from PDF');
      }

      return documents;
    } catch {
      // LangChain PDF parsing error
      // Fallback to basic extraction
      try {
        // Attempting fallback PDF text extraction...
        const buffer = await file.arrayBuffer();
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(buffer);
        const extractedText = this.extractTextFromPDFString(text);

        if (extractedText && extractedText.length > 10) {
          return [
            new Document({
              pageContent: extractedText,
              metadata: { source: file.name },
            }),
          ];
        }
      } catch {
        // Fallback PDF extraction failed
      }

      throw new Error(
        'Failed to parse PDF file. The file may be corrupted, password-protected, or in an unsupported format.',
      );
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
    } catch {
      // LangChain DOCX parsing error
      throw new Error('Failed to parse DOCX file. The file may be corrupted.');
    }
  }

  private async parseDocWithFallback(file: File): Promise<Document[]> {
    try {
      // Try to parse as DOCX first (some .doc files are actually .docx)
      return await this.parseDocxWithLangChain(file);
    } catch {
      // Fallback to basic text extraction for older .doc files
      try {
        const buffer = await file.arrayBuffer();
        const decoder = new TextDecoder('utf-8');
        let text = decoder.decode(buffer);

        // Basic cleanup for .doc files
        text = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
        text = this.cleanText(text);

        if (text.length < 10) {
          throw new Error('Insufficient text content extracted');
        }

        return [
          new Document({
            pageContent: text,
            metadata: { source: file.name },
          }),
        ];
      } catch {
        // Fallback .doc parsing failed
        throw new Error(
          'Failed to parse DOC file. Please convert to DOCX format for better compatibility.',
        );
      }
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
    } catch {
      // LangChain text parsing error

      // Fallback to direct text decoding
      try {
        const buffer = await file.arrayBuffer();
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(buffer);

        return [
          new Document({
            pageContent: text,
            metadata: { source: file.name },
          }),
        ];
      } catch {
        // Fallback text parsing failed
        throw new Error('Failed to parse text file. The file encoding may not be supported.');
      }
    }
  }

  private extractTextFromPDFString(pdfString: string): string {
    // Basic text extraction from PDF string representation
    // This is a fallback method and won't work for all PDFs
    const textMatches = pdfString.match(/\((.*?)\)/g);
    if (textMatches) {
      return textMatches
        .map((match) => match.slice(1, -1))
        .join(' ')
        .replace(/\\[a-z]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // If no text matches found, try to extract readable characters
    return pdfString
      .replace(/[^\x20-\x7E]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private cleanText(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    return (
      text
        // Remove extra whitespace and normalize line breaks
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\t/g, ' ')
        .replace(/\s+/g, ' ')
        // Remove special characters that might interfere with processing
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
        // Trim and ensure we have actual content
        .trim()
    );
  }

  private countWords(text: string): number {
    if (!text || typeof text !== 'string') {
      return 0;
    }

    return text.split(/\s+/).filter((word) => word.length > 0).length;
  }

  private getFileType(file: File): string {
    const mimeType = file.type.toLowerCase();
    const extension = file.name.split('.').pop()?.toLowerCase();

    // Check by MIME type first
    switch (mimeType) {
      case 'application/pdf':
        return 'pdf';
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return 'docx';
      case 'application/msword':
        return 'doc';
      case 'text/plain':
        return 'txt';
    }

    // Fallback to extension
    switch (extension) {
      case 'pdf':
        return 'pdf';
      case 'docx':
        return 'docx';
      case 'doc':
        return 'doc';
      case 'txt':
        return 'txt';
      default:
        throw new Error(`Unsupported file type: ${file.name}`);
    }
  }

  // Utility method to validate file before parsing
  validateFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
    ];

    const allowedExtensions = ['pdf', 'docx', 'doc', 'txt'];
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size exceeds 10MB limit',
      };
    }

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(extension || '')) {
      return {
        isValid: false,
        error: 'Unsupported file type. Please upload PDF, DOC, DOCX, or TXT files.',
      };
    }

    return { isValid: true };
  }

  // Enhanced method for resume-specific parsing
  async parseResume(file: File): Promise<string> {
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const parsedDoc = await this.parseDocument(file);

    // Ensure we have meaningful content
    if (!parsedDoc.text || parsedDoc.text.length < 50) {
      throw new Error(
        'The uploaded file appears to be empty or contains insufficient text content.',
      );
    }

    if (parsedDoc.metadata.wordCount < 10) {
      throw new Error(
        'The resume appears to have very little content. Please ensure the file is readable.',
      );
    }

    return parsedDoc.text;
  }
}

export const documentParsingService = new DocumentParsingService();
