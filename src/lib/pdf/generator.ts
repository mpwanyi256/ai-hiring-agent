// PDF generation service for contracts
// Note: This is a simplified implementation. For production, consider using:
// - Puppeteer (for full HTML to PDF conversion)
// - jsPDF (for programmatic PDF creation)
// - External services like PDFShift, HTMLCSSPdf, etc.

import { createClient } from '@/lib/supabase/server';

// Helper function to replace contract placeholders with actual data
function replaceContractPlaceholders(htmlContent: string, data: Record<string, any>): string {
  let result = htmlContent;

  const placeholders = {
    candidate_name: data.candidateName || '',
    candidate_email: data.candidateEmail || '',
    job_title: data.jobTitle || '',
    company_name: data.companyName || '',
    start_date: data.startDate ? new Date(data.startDate).toLocaleDateString() : '',
    end_date: data.endDate ? new Date(data.endDate).toLocaleDateString() : '',
    salary_amount: data.salaryAmount ? data.salaryAmount.toLocaleString() : '',
    salary_currency: data.salaryCurrency || '',
    contract_duration: data.contractDuration || '',
    employment_type: data.employmentType || '',
    signing_date: new Date().toLocaleDateString(),
    ...data.additionalTerms, // Allow custom placeholders
  };

  Object.entries(placeholders).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, String(value));
  });

  return result;
}

// Convert HTML to styled text format for simple PDF generation
function htmlToSimpleText(html: string): string {
  // Simple HTML to text conversion for basic contract generation
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n$1\n' + '='.repeat(50) + '\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n$1\n' + '-'.repeat(30) + '\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n$1\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '$1')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '$1')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')
    .replace(/<ul[^>]*>(.*?)<\/ul>/gi, '$1\n')
    .replace(/<ol[^>]*>(.*?)<\/ol>/gi, '$1\n')
    .replace(/<[^>]+>/g, '') // Remove all other HTML tags
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Clean up extra newlines
    .trim();
}

// Simple PDF generation (placeholder implementation)
// TODO: Replace with actual PDF library implementation
export async function generateContractPDF(data: {
  contractHtml: string;
  candidateName: string;
  candidateEmail: string;
  companyName: string;
  jobTitle: string;
  employmentType?: string;
  startDate?: string;
  endDate?: string;
  salaryAmount?: number;
  salaryCurrency?: string;
  contractDuration?: string;
  additionalTerms?: Record<string, any>;
}): Promise<{
  success: boolean;
  buffer?: Buffer;
  error?: any;
}> {
  try {
    // Replace placeholders in the HTML content
    const processedHtml = replaceContractPlaceholders(data.contractHtml, data);

    // For now, we'll create a simple text-based representation
    // In production, this should be replaced with proper PDF generation
    const contractText = htmlToSimpleText(processedHtml);

    const fullContract = `
EMPLOYMENT CONTRACT
${data.companyName} - ${data.jobTitle}
Generated on: ${new Date().toLocaleDateString()}

${contractText}

---
This contract was generated electronically through the Intavia platform.
This document contains confidential information and is intended solely for the named recipient.
`;

    // Create a simple text buffer (in production, this should be a proper PDF)
    const buffer = Buffer.from(fullContract, 'utf8');

    return {
      success: true,
      buffer,
    };
  } catch (error) {
    console.error('Error generating PDF:', error);
    return {
      success: false,
      error,
    };
  }
}

// Save PDF to Supabase Storage
export async function saveContractPDF(
  pdfBuffer: Buffer,
  fileName: string,
  bucketName: string = 'contracts',
): Promise<{
  success: boolean;
  path?: string;
  url?: string;
  error?: any;
}> {
  try {
    const supabase = await createClient();

    // Upload PDF to Supabase Storage
    const { data, error } = await supabase.storage.from(bucketName).upload(fileName, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: false, // Don't overwrite existing files
    });

    if (error) {
      console.error('Error uploading PDF to storage:', error);
      return { success: false, error };
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(data.path);

    return {
      success: true,
      path: data.path,
      url: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Error saving PDF:', error);
    return { success: false, error };
  }
}

// Complete contract PDF workflow
export async function generateAndSaveContractPDF(data: {
  contractOffer: any;
  contractHtml: string;
  candidateData: any;
  companyData: any;
}): Promise<{
  success: boolean;
  pdfPath?: string;
  pdfUrl?: string;
  error?: any;
}> {
  try {
    // Generate PDF
    const pdfResult = await generateContractPDF({
      contractHtml: data.contractHtml,
      candidateName:
        `${data.candidateData.first_name || ''} ${data.candidateData.last_name || ''}`.trim(),
      candidateEmail: data.candidateData.email,
      companyName: data.companyData.name,
      jobTitle: data.candidateData.job?.title || '',
      employmentType: data.contractOffer.employment_type?.name,
      startDate: data.contractOffer.start_date,
      endDate: data.contractOffer.end_date,
      salaryAmount: data.contractOffer.salary_amount,
      salaryCurrency: data.contractOffer.salary_currency,
      contractDuration: data.contractOffer.contract_duration,
      additionalTerms: data.contractOffer.additional_terms,
    });

    if (!pdfResult.success || !pdfResult.buffer) {
      return { success: false, error: pdfResult.error };
    }

    // Generate unique filename
    const timestamp = new Date().toISOString().split('T')[0];
    const candidateName =
      `${data.candidateData.first_name || ''} ${data.candidateData.last_name || ''}`.trim();
    const fileName = `signed/${data.companyData.slug}/${timestamp}_${candidateName.replace(/\s+/g, '-')}_${data.contractOffer.id}.pdf`;

    // Save to storage
    const saveResult = await saveContractPDF(pdfResult.buffer, fileName);

    if (!saveResult.success) {
      return { success: false, error: saveResult.error };
    }

    return {
      success: true,
      pdfPath: saveResult.path,
      pdfUrl: saveResult.url,
    };
  } catch (error) {
    console.error('Error in generateAndSaveContractPDF:', error);
    return { success: false, error };
  }
}

// Utility function to create PDF preview
export async function generateContractPreviewPDF(
  contractHtml: string,
  previewData: Record<string, any>,
): Promise<{
  success: boolean;
  buffer?: Buffer;
  error?: any;
}> {
  return generateContractPDF({
    contractHtml,
    candidateName: 'John Doe',
    candidateEmail: 'john.doe@example.com',
    companyName: previewData.companyName || 'Your Company',
    jobTitle: previewData.jobTitle || 'Job Title',
    ...previewData,
  });
}

// Additional helper function for future PDF enhancement
export function generatePDFConfig() {
  return {
    format: 'A4' as const,
    printBackground: true,
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm',
    },
    // Additional config for when proper PDF library is implemented
  };
}
