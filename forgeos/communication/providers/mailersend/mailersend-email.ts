export interface MailerSendEmailValidation {
  status: 'READY' | 'BLOCKED';
  email?: string;
  error?: string;
}

export function validateMailerSendEmail(
  rawEmail: string,
): MailerSendEmailValidation {
  const email =
    rawEmail.trim().toLowerCase();

  if (
    email.length === 0 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email,
    )
  ) {
    return {
      status: 'BLOCKED',
      error:
        'MailerSend email address is invalid',
    };
  }

  return {
    status: 'READY',
    email,
  };
}
