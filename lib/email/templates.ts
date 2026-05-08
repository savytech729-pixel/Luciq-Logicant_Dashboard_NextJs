type EmailTemplate = { subject: string; html: string; text: string };

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getAppBaseUrl() {
  const raw =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'http://localhost:3001';
  return raw.replace(/\/+$/, '');
}

function getLogoUrl() {
  const inlineLogo = (process.env.EMAIL_LOGO_DATA_URI || '').trim();
  if (inlineLogo) return inlineLogo;

  const explicitLogoUrl = (process.env.EMAIL_LOGO_URL || '').trim();
  if (explicitLogoUrl) return explicitLogoUrl;

  const appBase = getAppBaseUrl();
  if (appBase.startsWith('http://localhost')) {
    // Localhost image links fail for real email recipients.
    return 'https://dashboard.luciqandlogicant.com/luciq-logicant-logo-email.png';
  }
  return `${appBase}/luciq-logicant-logo-email.png`;
}

function infoCard(title: string, content: string) {
  return `
    <div style="margin:14px 0; padding:14px; border:1px solid #243044; border-radius:10px; background:#0f172a;">
      <div style="font-size:12px; text-transform:uppercase; letter-spacing:0.06em; color:#94a3b8; font-weight:700; margin-bottom:6px;">${escapeHtml(title)}</div>
      <div style="color:#dbe3ef; font-size:14px; line-height:1.6;">${content}</div>
    </div>
  `;
}

function actionList(items: string[]) {
  const lines = items
    .map((item) => `<li style="margin:0 0 6px;">${escapeHtml(item)}</li>`)
    .join('');
  return `<ul style="margin:10px 0 0 18px; padding:0; color:#dbe3ef;">${lines}</ul>`;
}

function baseTemplate(title: string, body: string, accent = '#2563eb') {
  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0; padding:0; background:#0b1220; font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0b1220; padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px; background:#111827; border:1px solid #1f2937; border-radius:14px; overflow:hidden;">
            <tr>
              <td style="padding:20px 24px; border-bottom:1px solid #1f2937;">
                <img src="${escapeHtml(getLogoUrl())}" alt="Luciq & Logicant" style="display:block; width:150px; max-width:100%; height:auto; margin:0 0 12px;" />
                <div style="font-size:11px; letter-spacing:0.08em; color:${accent}; font-weight:700; text-transform:uppercase;">Luciq & Logicant</div>
                <div style="margin-top:6px; font-size:24px; color:#f9fafb; font-weight:700;">${escapeHtml(title)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 24px; color:#d1d5db; line-height:1.65; font-size:15px;">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px; border-top:1px solid #1f2937; color:#94a3b8; font-size:12px;">
                AI Talent Platform · This is an automated message.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function signupOtpTemplate(otp: string): EmailTemplate {
  const subject = "Your verification OTP for account creation";
  const html = baseTemplate(
    "Verify your email",
    `<p style="margin:0 0 10px;">Welcome to Luciq & Logicant AI Talent Platform.</p>
     <p style="margin:0 0 10px;">Use the OTP below to complete your account registration and activate your secure access:</p>
     <div style="margin:12px 0 14px; padding:14px; border-radius:10px; border:1px solid #1e3a8a; background:#172554; text-align:center;">
       <span style="font-size:30px; font-weight:700; letter-spacing:6px; color:#93c5fd;">${escapeHtml(otp)}</span>
     </div>
     ${infoCard(
       'Important',
       'This OTP is valid for 10 minutes and can be used only once. Do not share this OTP with anyone.'
     )}
     <p style="margin:0;">If you did not initiate this request, you can ignore this email safely.</p>`,
    '#3b82f6'
  );
  return { subject, html, text: `Your OTP is ${otp}. It expires in 10 minutes.` };
}

export function loginOtpTemplate(otp: string): EmailTemplate {
  const subject = "Your login verification OTP";
  const html = baseTemplate(
    "Complete secure login",
    `<p style="margin:0 0 10px;">A secure login attempt was detected for your recruiter account.</p>
     <p style="margin:0 0 10px;">Use this OTP to complete verification:</p>
     <div style="margin:12px 0 14px; padding:14px; border-radius:10px; border:1px solid #14532d; background:#052e16; text-align:center;">
       <span style="font-size:30px; font-weight:700; letter-spacing:6px; color:#86efac;">${escapeHtml(otp)}</span>
     </div>
     ${infoCard(
       'Security note',
       'OTP expires in 10 minutes. If this was not you, please reset your password and inform the administrator.'
     )}
     <p style="margin:0;">For security reasons, multiple invalid attempts may temporarily block login.</p>`,
    '#22c55e'
  );
  return { subject, html, text: `Your login OTP is ${otp}. It expires in 10 minutes.` };
}

export function welcomeTemplate(nameOrEmail: string, role: string): EmailTemplate {
  const subject = `Welcome to the platform (${role})`;
  const html = baseTemplate(
    "Welcome aboard",
    `<p style="margin:0 0 10px;">Hello ${escapeHtml(nameOrEmail)},</p>
     <p style="margin:0 0 10px;">Your <strong>${escapeHtml(role.toLowerCase())}</strong> account has been created successfully.</p>
     <p style="margin:0;">You can now log in and start using the platform.</p>`,
    '#8b5cf6'
  );
  return { subject, html, text: `Welcome ${nameOrEmail}, your ${role} account is now active.` };
}

export function adminWelcomeTemplate(nameOrEmail: string): EmailTemplate {
  const subject = 'Welcome Admin - AI Talent Platform';
  const html = baseTemplate(
    'Admin access activated',
    `<p style="margin:0 0 10px;">Hello ${escapeHtml(nameOrEmail)},</p>
     <p style="margin:0 0 10px;">Your administrator access is now active and fully provisioned.</p>
     ${infoCard('Admin capabilities enabled', actionList([
       'Create and manage vacancies',
       'Review and shortlist candidates',
       'Manage recruiter network and permissions',
       'Track hiring pipeline and AI insights'
     ]))}
     <p style="margin:0;">Please review system settings and communication templates before going live.</p>`,
    '#a855f7'
  );
  return { subject, html, text: `Hello ${nameOrEmail}, your admin access is active.` };
}

export function candidateWelcomeTemplate(nameOrEmail: string): EmailTemplate {
  const subject = 'Welcome Candidate - Profile is ready';
  const html = baseTemplate(
    'Welcome to your candidate workspace',
    `<p style="margin:0 0 10px;">Hi ${escapeHtml(nameOrEmail)},</p>
     <p style="margin:0 0 10px;">Your candidate account is active and ready to use.</p>
     ${infoCard('Recommended next steps', actionList([
       'Complete profile with skills, experience, and location',
       'Upload your latest resume for better AI matching',
       'Apply to relevant opportunities',
       'Track your status updates from screening to selection'
     ]))}
     <p style="margin:0;">A complete profile significantly improves shortlist chances.</p>`,
    '#0ea5e9'
  );
  return { subject, html, text: `Hi ${nameOrEmail}, your candidate profile is active.` };
}

export function recruiterWelcomeTemplate(nameOrEmail: string): EmailTemplate {
  const subject = 'Welcome Recruiter - Access enabled';
  const html = baseTemplate(
    'Recruiter account created',
    `<p style="margin:0 0 10px;">Hello ${escapeHtml(nameOrEmail)},</p>
     <p style="margin:0 0 10px;">Your recruiter account has been created by the admin team.</p>
     ${infoCard('What you can do now', actionList([
       'Review assigned vacancies and priority requirements',
       'Screen and shortlist relevant candidates',
       'Coordinate interviews and hiring status updates',
       'Use AI matching to speed up sourcing'
     ]))}
     <p style="margin:0;">Please complete OTP verification at first login to activate recruiter operations.</p>`,
    '#22c55e'
  );
  return { subject, html, text: `Hello ${nameOrEmail}, your recruiter account has been created.` };
}

export function vacancyCreatedTemplate(vacancyTitle: string, createdBy: string): EmailTemplate {
  const subject = `New vacancy created: ${vacancyTitle}`;
  const html = baseTemplate(
    'New vacancy posted',
    `<p style="margin:0 0 10px;">A new vacancy has been published:</p>
     ${infoCard('Vacancy details', `<strong>${escapeHtml(vacancyTitle)}</strong><br />Created by: ${escapeHtml(createdBy)}`)}
     <p style="margin:0 0 10px;">You can now trigger AI matching and begin shortlist operations from the admin panel.</p>
     <p style="margin:0;">Ensure JD quality, skills, and notice constraints are reviewed before outreach.</p>`,
    '#f59e0b'
  );
  return { subject, html, text: `Vacancy "${vacancyTitle}" was created by ${createdBy}.` };
}

export function candidateAppliedAdminTemplate(candidateName: string, candidateEmail: string, jobTitle: string): EmailTemplate {
  const subject = `New candidate application: ${candidateName}`;
  const html = baseTemplate(
    "New application received",
    `<p style="margin:0 0 10px;">A new application has been received and is ready for review.</p>
     ${infoCard(
       'Application snapshot',
       `<strong>Candidate:</strong> ${escapeHtml(candidateName)}<br /><strong>Email:</strong> ${escapeHtml(candidateEmail)}<br /><strong>Role:</strong> ${escapeHtml(jobTitle)}`
     )}
     <p style="margin:0;">Review profile quality, move to screening/shortlist, and trigger candidate communication updates.</p>`,
    '#f59e0b'
  );
  return { subject, html, text: `${candidateName} (${candidateEmail}) applied for ${jobTitle}.` };
}

export function candidateAppliedTemplate(candidateName: string, jobTitle: string): EmailTemplate {
  const subject = `Application received for ${jobTitle}`;
  const html = baseTemplate(
    "Application received",
    `<p style="margin:0 0 10px;">Hi ${escapeHtml(candidateName)},</p>
     <p style="margin:0 0 10px;">We’ve successfully received your application for <strong>${escapeHtml(jobTitle)}</strong>.</p>
     ${infoCard('What happens next', actionList([
       'Initial profile and skills screening',
       'Shortlist decision by recruiter/admin team',
       'Status updates via email at each stage'
     ]))}
     <p style="margin:0;">Please keep your phone/email available for fast interview coordination.</p>`,
    '#0ea5e9'
  );
  return { subject, html, text: `Hi ${candidateName}, we received your application for ${jobTitle}.` };
}

export function candidateStatusTemplate(candidateName: string, jobTitle: string, status: string): EmailTemplate {
  const subject = `Application update: ${status}`;
  const html = baseTemplate(
    `Your status is now ${status}`,
    `<p style="margin:0 0 10px;">Hi ${escapeHtml(candidateName)},</p>
     <p style="margin:0 0 10px;">Your application for <strong>${escapeHtml(jobTitle)}</strong> is now marked as <strong>${escapeHtml(status)}</strong>.</p>
     <p style="margin:0;">Our team will share further updates based on this stage.</p>`,
    '#14b8a6'
  );
  return { subject, html, text: `Hi ${candidateName}, your status for ${jobTitle} is now ${status}.` };
}

export function candidateShortlistedTemplate(candidateName: string, jobTitle: string): EmailTemplate {
  const subject = `You are shortlisted: ${jobTitle}`;
  const html = baseTemplate(
    'You have been shortlisted',
    `<p style="margin:0 0 10px;">Hi ${escapeHtml(candidateName)},</p>
     <p style="margin:0 0 10px;">Great news - your profile has been <strong>shortlisted</strong> for <strong>${escapeHtml(jobTitle)}</strong>.</p>
     <p style="margin:0 0 10px;">To take your application forward, please share your further details (latest resume, current/expected CTC, notice period, and preferred interview slots).</p>
     ${infoCard('Next likely steps', actionList([
      'Share requested details to proceed quickly',
      'Recruiter validation call',
       'Interview schedule confirmation',
       'Additional details/documents (if needed)'
     ]))}
     <p style="margin:0;">Please keep your profile updated for smoother coordination.</p>`,
    '#3b82f6'
  );
  return { subject, html, text: `Hi ${candidateName}, you have been shortlisted for ${jobTitle}. Please share your further details to take your application forward.` };
}

export function candidateRejectedTemplate(candidateName: string, jobTitle: string): EmailTemplate {
  const subject = `Application update: ${jobTitle}`;
  const html = baseTemplate(
    'Application status updated',
    `<p style="margin:0 0 10px;">Hi ${escapeHtml(candidateName)},</p>
     <p style="margin:0 0 10px;">Thank you for your interest in <strong>${escapeHtml(jobTitle)}</strong>.</p>
     <p style="margin:0 0 10px;">At this stage, your profile has not moved forward for this specific role.</p>
     ${infoCard('Recommendation', 'Please continue applying to matching opportunities in the platform. Your profile remains active for future roles.')}
     <p style="margin:0;">We appreciate your time and effort.</p>`,
    '#ef4444'
  );
  return { subject, html, text: `Hi ${candidateName}, your application for ${jobTitle} was not selected in this cycle.` };
}

export function candidateSelectedTemplate(candidateName: string, jobTitle: string): EmailTemplate {
  const subject = `Congratulations - selected for ${jobTitle}`;
  const html = baseTemplate(
    'You are selected',
    `<p style="margin:0 0 10px;">Hi ${escapeHtml(candidateName)},</p>
     <p style="margin:0 0 10px;">Congratulations! You have been <strong>selected</strong> for <strong>${escapeHtml(jobTitle)}</strong>.</p>
     ${infoCard('What to expect', actionList([
       'Offer/onboarding communication from recruiter team',
       'Document and joining formalities',
       'Final date/time confirmation'
     ]))}
     <p style="margin:0;">Please respond promptly to recruiter communication for faster closure.</p>`,
    '#16a34a'
  );
  return { subject, html, text: `Hi ${candidateName}, congratulations! You are selected for ${jobTitle}.` };
}

export function candidateScreeningTemplate(candidateName: string, jobTitle: string): EmailTemplate {
  const subject = `Screening in progress: ${jobTitle}`;
  const html = baseTemplate(
    'Screening started',
    `<p style="margin:0 0 10px;">Hi ${escapeHtml(candidateName)},</p>
     <p style="margin:0 0 10px;">Your application has entered <strong>screening</strong> for <strong>${escapeHtml(jobTitle)}</strong>.</p>
     ${infoCard('Screening process', actionList([
       'Profile relevance and skills check',
       'Experience and notice period evaluation',
       'Role-fit review by recruiter/admin team'
     ]))}
     <p style="margin:0;">You will receive the next update once screening is completed.</p>`,
    '#14b8a6'
  );
  return { subject, html, text: `Hi ${candidateName}, screening has started for ${jobTitle}.` };
}
