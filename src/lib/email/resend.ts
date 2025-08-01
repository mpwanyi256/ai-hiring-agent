import { Resend } from 'resend';
import { integrations, domainEmails } from '@/lib/constants';

if (!integrations.resend.apiKey) {
  throw new Error('RESEND_API_KEY environment variable is required');
}

const resend = new Resend(integrations.resend.apiKey);

// Email templates
const CONTRACT_OFFER_TEMPLATE = {
  subject: 'Contract Offer from {{company_name}}',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #386B43, #44B675); padding: 30px; border-radius: 8px 8px 0 0; color: white; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Contract Offer</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">{{company_name}}</p>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="color: #1f2937; margin: 0 0 20px 0;">Dear {{candidate_name}},</h2>
        
        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 15px 0;">
          We are pleased to offer you the position of <strong>{{job_title}}</strong> at {{company_name}}. 
          We believe your skills and experience make you an excellent fit for our team.
        </p>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Position Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Position:</td>
              <td style="padding: 8px 0; color: #1f2937;">{{job_title}}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Employment Type:</td>
              <td style="padding: 8px 0; color: #1f2937;">{{employment_type}}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Start Date:</td>
              <td style="padding: 8px 0; color: #1f2937;">{{start_date}}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Salary:</td>
              <td style="padding: 8px 0; color: #1f2937;">{{salary_amount}} {{salary_currency}}</td>
            </tr>
          </table>
        </div>
        
        <p style="color: #4b5563; line-height: 1.6; margin: 20px 0;">
          Please review the complete contract details and provide your response by clicking the button below. 
          This offer expires on <strong>{{expires_at}}</strong>.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{signing_link}}" 
             style="display: inline-block; background: #386B43; color: white; padding: 15px 30px; 
                    text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            Review & Sign Contract
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 20px 0 0 0;">
          If you have any questions about this offer, please don't hesitate to contact us at 
          <a href="mailto:{{contact_email}}" style="color: #386B43;">{{contact_email}}</a>.
        </p>
      </div>
      
      <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; text-align: center;">
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          This email was sent by {{company_name}} through the Intavia hiring platform.
        </p>
      </div>
    </div>
  `,
};

const CONTRACT_SIGNED_TEMPLATE = {
  subject: 'Contract Signed - {{candidate_name}} - {{job_title}}',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; border-radius: 8px 8px 0 0; color: white; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Contract Signed! 🎉</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">{{company_name}}</p>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="color: #1f2937; margin: 0 0 20px 0;">Great news!</h2>
        
        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 15px 0;">
          <strong>{{candidate_name}}</strong> has signed the contract for the <strong>{{job_title}}</strong> position.
        </p>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Contract Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Candidate:</td>
              <td style="padding: 8px 0; color: #1f2937;">{{candidate_name}} ({{candidate_email}})</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Position:</td>
              <td style="padding: 8px 0; color: #1f2937;">{{job_title}}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Start Date:</td>
              <td style="padding: 8px 0; color: #1f2937;">{{start_date}}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Signed On:</td>
              <td style="padding: 8px 0; color: #1f2937;">{{signed_at}}</td>
            </tr>
          </table>
        </div>
        
        <p style="color: #4b5563; line-height: 1.6; margin: 20px 0;">
          The signed contract is attached to this email. You can also access it through your Intavia dashboard.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{dashboard_link}}" 
             style="display: inline-block; background: #386B43; color: white; padding: 15px 30px; 
                    text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            View in Dashboard
          </a>
        </div>
      </div>
      
      <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; text-align: center;">
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          This email was sent by the Intavia hiring platform.
        </p>
      </div>
    </div>
  `,
};

const CANDIDATE_CONTRACT_CONFIRMATION_TEMPLATE = {
  subject: 'Contract Signed Successfully - {{job_title}} at {{company_name}}',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; border-radius: 8px 8px 0 0; color: white; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Contract Signed Successfully!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">{{company_name}}</p>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="color: #1f2937; margin: 0 0 20px 0;">Dear {{candidate_name}},</h2>
        
        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 15px 0;">
          Congratulations! You have successfully signed your employment contract for the <strong>{{job_title}}</strong> position at {{company_name}}.
        </p>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Contract Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Position:</td>
              <td style="padding: 8px 0; color: #1f2937;">{{job_title}}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Start Date:</td>
              <td style="padding: 8px 0; color: #1f2937;">{{start_date}}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Signed On:</td>
              <td style="padding: 8px 0; color: #1f2937;">{{signed_at}}</td>
            </tr>
          </table>
        </div>
        
        <p style="color: #4b5563; line-height: 1.6; margin: 20px 0;">
          Your signed contract is attached to this email and can also be downloaded using the link below:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{download_link}}" 
             style="display: inline-block; background: #10b981; color: white; padding: 15px 30px; 
                    text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin-right: 10px;">
            Download Contract
          </a>
        </div>
        
        <p style="color: #4b5563; line-height: 1.6; margin: 20px 0;">
          Please keep this contract for your records. If you have any questions, feel free to contact us.
        </p>
        
        <p style="color: #4b5563; line-height: 1.6; margin: 20px 0;">
          Welcome to the team!
        </p>
      </div>
      
      <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; text-align: center;">
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          This email was sent by the AI Automated Hiring platform.
        </p>
      </div>
    </div>
  `,
};

const CONTRACT_REJECTED_TEMPLATE = {
  subject: 'Contract Declined - {{candidate_name}} - {{job_title}}',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 30px; border-radius: 8px 8px 0 0; color: white; text-align: center;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Contract Declined</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">{{company_name}}</p>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
        <h2 style="color: #1f2937; margin: 0 0 20px 0;">Contract Status Update</h2>
        
        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 15px 0;">
          <strong>{{candidate_name}}</strong> has declined the contract offer for the <strong>{{job_title}}</strong> position.
        </p>
        
        <div style="background: #fef2f2; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px;">Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Candidate:</td>
              <td style="padding: 8px 0; color: #1f2937;">{{candidate_name}} ({{candidate_email}})</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Position:</td>
              <td style="padding: 8px 0; color: #1f2937;">{{job_title}}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Declined On:</td>
              <td style="padding: 8px 0; color: #1f2937;">{{rejected_at}}</td>
            </tr>
            {{#if rejection_reason}}
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-weight: 600;">Reason:</td>
              <td style="padding: 8px 0; color: #1f2937;">{{rejection_reason}}</td>
            </tr>
            {{/if}}
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="{{dashboard_link}}" 
             style="display: inline-block; background: #386B43; color: white; padding: 15px 30px; 
                    text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            View in Dashboard
          </a>
        </div>
      </div>
      
      <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; text-align: center;">
        <p style="color: #6b7280; font-size: 12px; margin: 0;">
          This email was sent by the Intavia hiring platform.
        </p>
      </div>
    </div>
  `,
};

// Helper function to replace template variables
function replaceTemplateVariables(template: string, variables: Record<string, any>): string {
  let result = template;

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, value || '');
  });

  return result;
}

// Email service functions
export async function sendContractOfferEmail(data: {
  to: string;
  candidateName: string;
  companyName: string;
  jobTitle: string;
  employmentType: string;
  startDate: string;
  salaryAmount: number;
  salaryCurrency: string;
  expiresAt: string;
  signingLink: string;
  contactEmail: string;
  cc?: string[];
}) {
  const subject = replaceTemplateVariables(CONTRACT_OFFER_TEMPLATE.subject, {
    company_name: data.companyName,
  });

  const html = replaceTemplateVariables(CONTRACT_OFFER_TEMPLATE.html, {
    candidate_name: data.candidateName,
    company_name: data.companyName,
    job_title: data.jobTitle,
    employment_type: data.employmentType,
    start_date: data.startDate,
    salary_amount: data.salaryAmount.toLocaleString(),
    salary_currency: data.salaryCurrency,
    expires_at: new Date(data.expiresAt).toLocaleDateString(),
    signing_link: data.signingLink,
    contact_email: data.contactEmail,
  });

  try {
    const emailData: any = {
      from: domainEmails.noReply,
      to: data.to,
      subject,
      html,
    };

    // Add CC if provided
    if (data.cc && data.cc.length > 0) {
      emailData.cc = data.cc;
    }

    const result = await resend.emails.send(emailData);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending contract offer email:', error);
    return { success: false, error };
  }
}

export async function sendContractSignedEmail(data: {
  to: string | string[];
  candidateName: string;
  candidateEmail: string;
  companyName: string;
  jobTitle: string;
  startDate: string;
  signedAt: string;
  dashboardLink: string;
  attachmentPath?: string;
}) {
  const subject = replaceTemplateVariables(CONTRACT_SIGNED_TEMPLATE.subject, {
    candidate_name: data.candidateName,
    job_title: data.jobTitle,
  });

  const html = replaceTemplateVariables(CONTRACT_SIGNED_TEMPLATE.html, {
    candidate_name: data.candidateName,
    candidate_email: data.candidateEmail,
    company_name: data.companyName,
    job_title: data.jobTitle,
    start_date: data.startDate,
    signed_at: new Date(data.signedAt).toLocaleDateString(),
    dashboard_link: data.dashboardLink,
  });

  try {
    const emailData: any = {
      from: domainEmails.noReply,
      to: Array.isArray(data.to) ? data.to : [data.to],
      subject,
      html,
    };

    // Add attachment if provided
    if (data.attachmentPath) {
      emailData.attachments = [
        {
          filename: `contract-${data.candidateName.replace(/\s+/g, '-')}.pdf`,
          path: data.attachmentPath,
        },
      ];
    }

    const result = await resend.emails.send(emailData);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending contract signed email:', error);
    return { success: false, error };
  }
}

export async function sendCandidateContractConfirmation(data: {
  to: string;
  candidateName: string;
  companyName: string;
  jobTitle: string;
  startDate: string;
  signedAt: string;
  downloadLink: string;
  attachmentPath?: string;
}) {
  const subject = replaceTemplateVariables(CANDIDATE_CONTRACT_CONFIRMATION_TEMPLATE.subject, {
    job_title: data.jobTitle,
    company_name: data.companyName,
  });

  const html = replaceTemplateVariables(CANDIDATE_CONTRACT_CONFIRMATION_TEMPLATE.html, {
    candidate_name: data.candidateName,
    company_name: data.companyName,
    job_title: data.jobTitle,
    start_date: new Date(data.startDate).toLocaleDateString(),
    signed_at: new Date(data.signedAt).toLocaleDateString(),
    download_link: data.downloadLink,
  });

  try {
    const emailData: any = {
      from: domainEmails.noReply,
      to: data.to,
      subject,
      html,
    };

    // Add attachment if provided
    if (data.attachmentPath) {
      emailData.attachments = [
        {
          filename: `contract-${data.candidateName.replace(/\s+/g, '-')}.pdf`,
          path: data.attachmentPath,
        },
      ];
    }

    const result = await resend.emails.send(emailData);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending candidate contract confirmation:', error);
    return { success: false, error };
  }
}

export async function sendContractRejectedEmail(data: {
  to: string | string[];
  candidateName: string;
  candidateEmail: string;
  companyName: string;
  jobTitle: string;
  rejectedAt: string;
  rejectionReason?: string;
  dashboardLink: string;
}) {
  const subject = replaceTemplateVariables(CONTRACT_REJECTED_TEMPLATE.subject, {
    candidate_name: data.candidateName,
    job_title: data.jobTitle,
  });

  const html = replaceTemplateVariables(CONTRACT_REJECTED_TEMPLATE.html, {
    candidate_name: data.candidateName,
    candidate_email: data.candidateEmail,
    company_name: data.companyName,
    job_title: data.jobTitle,
    rejected_at: new Date(data.rejectedAt).toLocaleDateString(),
    rejection_reason: data.rejectionReason || 'No reason provided',
    dashboard_link: data.dashboardLink,
  });

  try {
    const result = await resend.emails.send({
      from: domainEmails.noReply,
      to: Array.isArray(data.to) ? data.to : [data.to],
      subject,
      html,
    });
    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending contract rejected email:', error);
    return { success: false, error };
  }
}

export { resend };
