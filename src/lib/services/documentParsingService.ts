import mammoth from 'mammoth';

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
  // Main parsing method that routes to specific parsers based on file type
  async parseDocument(file: File): Promise<ParsedDocument> {
    const fileType = this.getFileType(file);
    const buffer = await file.arrayBuffer();

    try {
      let text: string;
      let pages: number | undefined;

      console.log(`Parsing ${fileType.toUpperCase()} file: ${file.name} (${file.size} bytes)`);

      switch (fileType) {
        case 'pdf':
          const pdfResult = await this.parsePDF(buffer, file.name);
          text = pdfResult.text;
          pages = pdfResult.pages;
          break;
        case 'docx':
          text = await this.parseDocx(buffer);
          break;
        case 'doc':
          text = await this.parseDocx(buffer); // mammoth handles both DOC and DOCX
          break;
        case 'txt':
          text = await this.parseText(buffer);
          break;
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }

      // Clean and validate the extracted text
      const cleanedText = this.cleanText(text);
      const wordCount = this.countWords(cleanedText);

      if (!cleanedText || cleanedText.length < 10) {
        throw new Error(`Failed to extract meaningful text from ${fileType.toUpperCase()} file`);
      }

      return {
        text: cleanedText,
        metadata: {
          pages,
          wordCount,
          fileType: fileType.toUpperCase(),
          fileName: file.name,
          fileSize: file.size,
        }
      };
    } catch (error) {
      console.error(`Error parsing ${fileType} file:`, error);
      throw new Error(`Failed to parse ${fileType} file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async parsePDF(buffer: ArrayBuffer, fileName: string): Promise<{ text: string; pages: number }> {
    try {
      console.log(`Starting PDF parsing for: ${fileName}`);
      
      // Store original console methods
      const originalError = console.error;
      const originalWarn = console.warn;
      const originalLog = console.log;
      const originalInfo = console.info;
      
      // Temporarily suppress all console output
      console.error = () => {};
      console.warn = () => {};
      console.log = () => {};
      console.info = () => {};
      
      let pdfParse;
      let data;
      
      try {
        // Dynamic import to avoid initialization issues
        pdfParse = (await import('pdf-parse')).default;
        
        // Restore console for our logging
        console.error = originalError;
        console.warn = originalWarn;
        console.log = originalLog;
        console.info = originalInfo;
        
        console.log('PDF parser loaded, processing file...');
        
        // Suppress console again for parsing
        console.error = () => {};
        console.warn = () => {};
        
        data = await pdfParse(Buffer.from(buffer));
        
      } finally {
        // Always restore console output
        console.error = originalError;
        console.warn = originalWarn;
        console.log = originalLog;
        console.info = originalInfo;
      }
      
      console.log(`PDF parsed successfully: ${data.numpages} pages, ${data.text.length} characters`);
      
      return {
        text: data.text,
        pages: data.numpages
      };
    } catch (error) {
      console.error('PDF parsing error:', error);
      // Fallback to basic text extraction if pdf-parse fails
      try {
        console.log('Attempting fallback PDF text extraction...');
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(buffer);
        const extractedText = this.extractTextFromPDFString(text);
        
        if (extractedText && extractedText.length > 10) {
          console.log('Fallback PDF extraction succeeded');
          return {
            text: extractedText,
            pages: 1
          };
        }
      } catch (fallbackError) {
        console.error('Fallback PDF extraction failed:', fallbackError);
      }
      
      throw new Error('Failed to parse PDF file. The file may be corrupted, password-protected, or in an unsupported format.');
    }
  }

  private extractTextFromPDFString(pdfString: string): string {
    // Basic text extraction from PDF string representation
    // This is a fallback method and won't work for all PDFs
    const textMatches = pdfString.match(/\((.*?)\)/g);
    if (textMatches) {
      return textMatches
        .map(match => match.slice(1, -1))
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

  private async parseDocx(buffer: ArrayBuffer): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) });
      
      if (result.messages.length > 0) {
        console.warn('DOCX parsing warnings:', result.messages);
      }
      
      return result.value;
    } catch (error) {
      console.error('DOCX parsing error:', error);
      throw new Error('Failed to parse DOCX file. The file may be corrupted.');
    }
  }

  private async parseText(buffer: ArrayBuffer): Promise<string> {
    try {
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(buffer);
    } catch (error) {
      console.error('Text parsing error:', error);
      throw new Error('Failed to parse text file. The file encoding may not be supported.');
    }
  }

  private cleanText(text: string): string {
    if (!text || typeof text !== 'string') {
      return '';
    }

    return text
      // Remove extra whitespace and normalize line breaks
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/\s+/g, ' ')
      // Remove special characters that might interfere with processing
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
      // Trim and ensure we have actual content
      .trim();
  }

  private countWords(text: string): number {
    if (!text || typeof text !== 'string') {
      return 0;
    }
    
    return text
      .split(/\s+/)
      .filter(word => word.length > 0)
      .length;
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
      'text/plain'
    ];
    
    const allowedExtensions = ['pdf', 'docx', 'doc', 'txt'];
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size exceeds 10MB limit'
      };
    }

    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(extension || '')) {
      return {
        isValid: false,
        error: 'Unsupported file type. Please upload PDF, DOC, DOCX, or TXT files.'
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

    console.log(`Starting resume parsing for: ${file.name}`);
    const parsedDoc = await this.parseDocument(file);
    
    // Ensure we have meaningful content
    if (!parsedDoc.text || parsedDoc.text.length < 50) {
      throw new Error('The uploaded file appears to be empty or contains insufficient text content.');
    }

    if (parsedDoc.metadata.wordCount < 10) {
      throw new Error('The resume appears to have very little content. Please ensure the file is readable.');
    }

    console.log(`Successfully parsed ${parsedDoc.metadata.fileType} resume:`, {
      fileName: parsedDoc.metadata.fileName,
      wordCount: parsedDoc.metadata.wordCount,
      pages: parsedDoc.metadata.pages,
      textLength: parsedDoc.text.length
    });

    return parsedDoc.text;
  }
}

export const documentParsingService = new DocumentParsingService(); 