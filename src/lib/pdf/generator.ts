// PDF generation service for contracts using Puppeteer
import { createClient } from '@/lib/supabase/server';
import puppeteer from 'puppeteer';

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
    candidate_signature: data.candidateSignature || '',
    ...data.additionalTerms, // Allow custom placeholders
  };

  Object.entries(placeholders).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, String(value));
  });

  return result;
}

// Generate PDF using Puppeteer for proper PDF output
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
  candidateSignature?: string;
  additionalTerms?: Record<string, any>;
}): Promise<{
  success: boolean;
  buffer?: Buffer;
  error?: any;
}> {
  let browser;
  try {
    // Replace placeholders in the HTML content
    const filledHtml = replaceContractPlaceholders(data.contractHtml, data);

    // Create a complete HTML document with proper styling for PDF
    const htmlDocument = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Employment Contract - ${data.candidateName}</title>
        <style>
          body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            color: #000;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            background: white;
          }
          h1 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 30px;
            font-size: 28px;
          }
          h2 {
            color: #34495e;
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 20px;
          }
          h3 {
            color: #34495e;
            margin-top: 25px;
            margin-bottom: 10px;
            font-size: 16px;
          }
          p {
            margin-bottom: 15px;
            text-align: justify;
          }
          strong {
            color: #2c3e50;
          }
          .signature-section {
            margin-top: 40px;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background-color: #f9f9f9;
          }
          .contract-header {
            text-align: center;
            margin-bottom: 40px;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
          }
          .contract-footer {
            margin-top: 40px;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 5px;
            font-size: 12px;
            color: #666;
            text-align: center;
          }
          @media print {
            body { margin: 0; padding: 20px; }
            .contract-header { background: #667eea !important; }
          }
        </style>
      </head>
      <body>
        ${filledHtml}
      </body>
      </html>
    `;

    // Launch Puppeteer browser
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
      ],
    });

    const page = await browser.newPage();

    // Set content and generate PDF
    await page.setContent(htmlDocument, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    });

    await browser.close();

    return {
      success: true,
      buffer: Buffer.from(pdfBuffer),
    };
  } catch (error) {
    console.error('Error generating PDF with Puppeteer:', error);
    if (browser) {
      await browser.close();
    }
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
  bucketName: string = 'signed-contracts',
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
    // Use company name as slug if slug is not available
    const companySlug =
      data.companyData.slug ||
      data.companyData.name?.replace(/\s+/g, '-').toLowerCase() ||
      'company';
    const fileName = `signed/${companySlug}/${timestamp}_${candidateName.replace(/\s+/g, '-')}_${data.contractOffer.id}.pdf`;

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
