// server/src/utils/mailHelper.ts
import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import SGMail from '@sendgrid/mail';

type MailOptions = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  attachments?: { filename: string; content: Buffer | string; contentType?: string }[];
};

const ENV = process.env.NODE_ENV || 'development';
const FROM = process.env.SMTP_FROM || process.env.SENDGRID_FROM || `no-reply@${process.env.FRONTEND_HOST || 'localhost'}`;

const MAX_RETRIES = 3;
const RETRY_BASE_MS = 300; 

let smtpTransport: nodemailer.Transporter<SMTPTransport.SentMessageInfo> | null = null;
let useSendGrid = false;

/**
 * initMailer()
 * - call once at server start (optional). The helper will auto-init on first use if omitted.
 */
export function initMailer() {
  // prefer SendGrid API if API key provided
  if (process.env.SENDGRID_API_KEY) {
    SGMail.setApiKey(process.env.SENDGRID_API_KEY);
    useSendGrid = true;
    console.info('mailHelper: using SendGrid');
    return;
  }

  // otherwise fallback to SMTP -- require SMTP_HOST/PORT and auth
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  if (!host) {
    console.warn('mailHelper: SMTP_HOST not set; falling back to console logger (dev only)');
    return;
  }

  const authUser = process.env.SMTP_USER;
  const authPass = process.env.SMTP_PASS;
  const secure = (process.env.SMTP_SECURE || 'false') === 'true';

  smtpTransport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: authUser && authPass ? { user: authUser, pass: authPass } : undefined,
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
  } as SMTPTransport.Options);

  // optional: verify connection
  smtpTransport.verify().then(() => {
    console.info('mailHelper: SMTP transporter verified');
  }).catch(err => {
    console.warn('mailHelper: warning — SMTP verify failed:', err?.message || err);
  });
}

/** small template function: replaces {{key}} in template with vars[key] (string) */
export function renderTemplate(template: string, vars: Record<string, string | number | boolean | undefined> = {}) {
  return template.replace(/{{\s*([\w.-]+)\s*}}/g, (_, key) => {
    const v = vars[key];
    if (v === undefined || v === null) return '';
    return String(v);
  });
}

/** generic send with retries; uses SendGrid if configured else SMTP else console (dev) */
export async function sendMail(opts: MailOptions): Promise<any> {
  // lazy init
  if (!smtpTransport && !useSendGrid) initMailer();

  const from = opts.from || FROM;
  let attempt = 0;
  let lastError: any = null;

  while (attempt < MAX_RETRIES) {
    try {
      if (useSendGrid) {
        // SendGrid
        const msg: any = {
          to: opts.to,
          from,
          subject: opts.subject,
          text: opts.text,
          html: opts.html,
        };
        if (opts.attachments) {
          msg.attachments = opts.attachments.map(a => ({
            filename: a.filename,
            content: typeof a.content === 'string' ? Buffer.from(a.content).toString('base64') : a.content.toString('base64'),
            type: a.contentType,
            disposition: 'attachment'
          }));
        }
        const res = await SGMail.send(msg);
        return res[0]; // return SendGrid response
      }

      if (smtpTransport) {
        const info = await smtpTransport.sendMail({
          from,
          to: opts.to,
          subject: opts.subject,
          text: opts.text,
          html: opts.html,
          attachments: opts.attachments?.map(a => ({
            filename: a.filename,
            content: a.content,
            contentType: a.contentType
          }))
        });
        return info;
      }

      // fallback for dev: log to console
      console.log('mailHelper [dev console] sendMail', { from, to: opts.to, subject: opts.subject, text: opts.text, html: opts.html });
      return { accepted: [opts.to], rejected: [], envelope: { from, to: [opts.to] }, messageId: 'dev', response: 'dev' };
    } catch (err) {
      lastError = err;
      attempt += 1;
      const sleepMs = RETRY_BASE_MS * Math.pow(2, attempt);
      console.warn(`mailHelper: send attempt ${attempt} failed, retrying in ${sleepMs}ms —`, (err as any)?.message || err);
      await new Promise(r => setTimeout(r, sleepMs));
    }
  }

  // all retries failed
  console.error('mailHelper: all send attempts failed', lastError);
  throw lastError || new Error('mailHelper: unknown send error');
}

/** helper to send template email (subject + html/text templates) */
export async function sendTemplateMail(to: string, subjectTemplate: string, htmlTemplate: string, vars: Record<string, string | number | boolean | undefined> = {}, textTemplate?: string) {
  const subject = renderTemplate(subjectTemplate, vars);
  const html = renderTemplate(htmlTemplate, vars);
  const text = textTemplate ? renderTemplate(textTemplate, vars) : stripHtml(html);
  return sendMail({ to, subject, html, text });
}

/** simple html -> text fallback */
function stripHtml(html = '') {
  return html.replace(/<\/?[^>]+(>|$)/g, '').replace(/\s+/g, ' ').trim();
}

/* ----------------- Common transactional emails ----------------- */

/** password reset email */
export async function sendResetPasswordEmail(to: string, resetUrl: string, options?: { name?: string }) {
  const subjectT = 'Reset your password';
  const htmlT = `
    <div style="font-family:system-ui, -apple-system, Roboto, 'Segoe UI', Arial; color:#111;">
      <h2>Reset your password</h2>
      <p>Hello {{name}},</p>
      <p>We received a request to reset your password. Click the button below to set a new password. This link will expire in an hour.</p>
      <p style="margin:20px 0;"><a href="{{resetUrl}}" style="display:inline-block;padding:10px 14px;background:#2563EB;color:white;border-radius:6px;text-decoration:none;">Reset password</a></p>
      <p>If you did not request this, ignore this email.</p>
      <hr />
      <small>If the button doesn't work, paste this link in your browser:<br/><a href="{{resetUrl}}">{{resetUrl}}</a></small>
    </div>
  `;
  const vars = { resetUrl, name: options?.name || 'there' };
  return sendTemplateMail(to, subjectT, htmlT, vars);
}

/** invite email */
export async function sendInviteEmail(to: string, inviteUrl: string, inviter?: string) {
  const subjectT = 'You have been invited';
  const htmlT = `
    <div style="font-family:system-ui, -apple-system, Roboto, 'Segoe UI', Arial; color:#111;">
      <h2>Admin invite</h2>
      <p>{{inviter}} has invited you to join as an admin.</p>
      <p style="margin:20px 0;"><a href="{{inviteUrl}}" style="display:inline-block;padding:10px 14px;background:#10B981;color:white;border-radius:6px;text-decoration:none;">Accept invite</a></p>
      <p>This invite expires soon.</p>
      <hr />
      <small>If the button doesn't work, paste this link in your browser:<br/><a href="{{inviteUrl}}">{{inviteUrl}}</a></small>
    </div>
  `;
  const vars = { inviteUrl, inviter: inviter || 'An admin' };
  return sendTemplateMail(to, subjectT, htmlT, vars);
}

/** welcome email */
export async function sendWelcomeEmail(to: string, options?: { name?: string; loginUrl?: string }) {
  const subjectT = 'Welcome to My Blog';
  const htmlT = `
    <div style="font-family:system-ui, -apple-system, Roboto, 'Segoe UI', Arial; color:#111;">
      <h2>Welcome{{#name}}{{name}}{{/name}}</h2>
      <p>Thanks for joining. You can log in here: <a href="{{loginUrl}}">{{loginUrl}}</a></p>
      <p>— The team</p>
    </div>
  `;
  const vars = { name: options?.name || '', loginUrl: options?.loginUrl || process.env.FRONTEND_URL || 'http://localhost:3000' };
  return sendTemplateMail(to, subjectT, htmlT, vars);
}

/* ----------------- Utilities / Examples ----------------- */

/**
 * Example usage within controllers:
 *
 * import { sendResetPasswordEmail, sendInviteEmail, sendWelcomeEmail } from '../utils/mailHelper';
 *
 * await sendResetPasswordEmail(user.email, resetUrl, { name: user.name });
 * await sendInviteEmail(inviteeEmail, inviteLink, req.user?.email);
 * await sendWelcomeEmail(newUser.email, { name: newUser.email });
 *
 */

/* Initialize on import (optional) */
initMailer();

export default {
  initMailer,
  sendMail,
  sendTemplateMail,
  sendResetPasswordEmail,
  sendInviteEmail,
  sendWelcomeEmail,
  renderTemplate
};