import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let transport: Transporter | null = null;

function getTransport(): Transporter | null {
  if (!env.SMTP_URL) return null;
  transport ??= nodemailer.createTransport(env.SMTP_URL);
  return transport;
}

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Sends an email, never throwing: a mail outage must not break payments or
 * sign-ups. Without SMTP_URL the message is written to the log, which is
 * enough for local development.
 */
export async function sendMail(mail: Mail): Promise<boolean> {
  const t = getTransport();
  if (!t) {
    logger.info(`📧 [email not sent — SMTP_URL unset] to=${mail.to} subject="${mail.subject}"\n${mail.text}`);
    return false;
  }
  try {
    await t.sendMail({ from: env.MAIL_FROM, ...mail });
    return true;
  } catch (error) {
    logger.error(`Email to ${mail.to} failed ("${mail.subject}")`, error);
    return false;
  }
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
