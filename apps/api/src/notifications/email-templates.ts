import { RequestStatus } from '@prisma/client';

/** Escape user-supplied strings before interpolating them into HTML email bodies. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDateTime(date: Date): string {
  return date.toLocaleString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const statusLabels: Record<RequestStatus, string> = {
  [RequestStatus.Active]: 'Active',
  [RequestStatus.Completed]: 'Approved',
  [RequestStatus.Rejected]: 'Rejected',
  [RequestStatus.Cancelled]: 'Cancelled',
};

const statusMessages: Record<RequestStatus, string> = {
  [RequestStatus.Active]: 'Your request is under review.',
  [RequestStatus.Completed]:
    'Great news — the venue has approved your request. We will be in touch shortly with next steps.',
  [RequestStatus.Rejected]:
    'Unfortunately the venue is unavailable for your requested dates. We encourage you to explore other venues.',
  [RequestStatus.Cancelled]: 'Your availability request has been cancelled.',
};

export function requestSubmittedHtml(params: {
  userName: string;
  venueName: string;
  venueLocation: string;
  dateFrom: Date;
  dateTo: Date;
  guests: number;
  eventType: string;
}): string {
  const { dateFrom, dateTo, guests } = params;
  const userName = escapeHtml(params.userName);
  const venueName = escapeHtml(params.venueName);
  const venueLocation = escapeHtml(params.venueLocation);
  const eventType = escapeHtml(params.eventType);
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F7F5F0;font-family:Georgia,serif;color:#1C1916;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border:1px solid #D8D4CC;padding:40px;">
    <h1 style="font-size:28px;font-weight:400;color:#2C4A3E;margin:0 0 8px">Availability Request Submitted</h1>
    <p style="color:#8A8278;margin:0 0 32px;font-family:Arial,sans-serif;font-size:14px">We've received your request and the venue will be in touch.</p>
    <p style="font-family:Arial,sans-serif;font-size:15px;margin:0 0 24px">Hello ${userName},</p>
    <p style="font-family:Arial,sans-serif;font-size:15px;margin:0 0 24px">
      Your availability request for <strong>${venueName}</strong> has been submitted successfully.
    </p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:32px;font-family:Arial,sans-serif;font-size:14px;">
      <tr style="background:#F7F5F0;">
        <td style="padding:10px 16px;font-weight:bold;width:40%">Venue</td>
        <td style="padding:10px 16px">${venueName}, ${venueLocation}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-weight:bold">Event Type</td>
        <td style="padding:10px 16px">${eventType}</td>
      </tr>
      <tr style="background:#F7F5F0;">
        <td style="padding:10px 16px;font-weight:bold">From</td>
        <td style="padding:10px 16px">${formatDate(dateFrom)}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-weight:bold">To</td>
        <td style="padding:10px 16px">${formatDate(dateTo)}</td>
      </tr>
      <tr style="background:#F7F5F0;">
        <td style="padding:10px 16px;font-weight:bold">Guests</td>
        <td style="padding:10px 16px">${guests}</td>
      </tr>
    </table>
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#8A8278;border-top:1px solid #D8D4CC;padding-top:24px;margin:0">
      You will receive an update when the venue responds. You can manage your requests in your dashboard.
    </p>
  </div>
</body>
</html>`.trim();
}

export function requestStatusUpdatedHtml(params: {
  userName: string;
  venueName: string;
  newStatus: RequestStatus;
  eventType: string;
}): string {
  const { newStatus } = params;
  const userName = escapeHtml(params.userName);
  const venueName = escapeHtml(params.venueName);
  const eventType = escapeHtml(params.eventType);
  const label = statusLabels[newStatus];
  const message = statusMessages[newStatus];
  const accentColor = newStatus === RequestStatus.Completed ? '#2C4A3E' : '#8A8278';
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F7F5F0;font-family:Georgia,serif;color:#1C1916;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border:1px solid #D8D4CC;padding:40px;">
    <h1 style="font-size:28px;font-weight:400;color:${accentColor};margin:0 0 8px">Request ${label}</h1>
    <p style="color:#8A8278;margin:0 0 32px;font-family:Arial,sans-serif;font-size:14px">Status update for your availability request.</p>
    <p style="font-family:Arial,sans-serif;font-size:15px;margin:0 0 24px">Hello ${userName},</p>
    <p style="font-family:Arial,sans-serif;font-size:15px;margin:0 0 24px">
      Your availability request for <strong>${venueName}</strong> (${eventType}) has been updated.
    </p>
    <div style="background:#F7F5F0;border-left:3px solid ${accentColor};padding:16px;margin-bottom:32px;font-family:Arial,sans-serif;font-size:14px;">
      ${message}
    </div>
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#8A8278;border-top:1px solid #D8D4CC;padding-top:24px;margin:0">
      Visit your dashboard to view all your requests.
    </p>
  </div>
</body>
</html>`.trim();
}

export function viewingScheduledHtml(params: {
  userName: string;
  venueName: string;
  venueLocation: string;
  scheduledAt: Date;
}): string {
  const { scheduledAt } = params;
  const userName = escapeHtml(params.userName);
  const venueName = escapeHtml(params.venueName);
  const venueLocation = escapeHtml(params.venueLocation);
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F7F5F0;font-family:Georgia,serif;color:#1C1916;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border:1px solid #D8D4CC;padding:40px;">
    <h1 style="font-size:28px;font-weight:400;color:#2C4A3E;margin:0 0 8px">Viewing Confirmed</h1>
    <p style="color:#8A8278;margin:0 0 32px;font-family:Arial,sans-serif;font-size:14px">Your venue visit has been scheduled.</p>
    <p style="font-family:Arial,sans-serif;font-size:15px;margin:0 0 24px">Hello ${userName},</p>
    <p style="font-family:Arial,sans-serif;font-size:15px;margin:0 0 24px">
      Your viewing of <strong>${venueName}</strong> is confirmed.
    </p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:32px;font-family:Arial,sans-serif;font-size:14px;">
      <tr style="background:#F7F5F0;">
        <td style="padding:10px 16px;font-weight:bold;width:40%">Venue</td>
        <td style="padding:10px 16px">${venueName}</td>
      </tr>
      <tr>
        <td style="padding:10px 16px;font-weight:bold">Location</td>
        <td style="padding:10px 16px">${venueLocation}</td>
      </tr>
      <tr style="background:#F7F5F0;">
        <td style="padding:10px 16px;font-weight:bold">Date &amp; Time</td>
        <td style="padding:10px 16px">${formatDateTime(scheduledAt)}</td>
      </tr>
    </table>
    <p style="font-family:Arial,sans-serif;font-size:14px;color:#8A8278;border-top:1px solid #D8D4CC;padding-top:24px;margin:0">
      You can cancel or reschedule your viewing from your dashboard. We look forward to seeing you there.
    </p>
  </div>
</body>
</html>`.trim();
}

export function emailVerificationHtml(params: {
  userName: string;
  verificationUrl: string;
}): string {
  const userName = escapeHtml(params.userName);
  const { verificationUrl } = params;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F7F5F0;font-family:Georgia,serif;color:#1C1916;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border:1px solid #D8D4CC;padding:40px;">
    <h1 style="font-size:28px;font-weight:400;color:#2C4A3E;margin:0 0 8px">Verify your email address</h1>
    <p style="color:#8A8278;margin:0 0 32px;font-family:Arial,sans-serif;font-size:14px">One last step to activate your account.</p>
    <p style="font-family:Arial,sans-serif;font-size:15px;margin:0 0 24px">Hello ${userName},</p>
    <p style="font-family:Arial,sans-serif;font-size:15px;margin:0 0 32px">
      Thank you for creating an account. Please verify your email address by clicking the button below.
    </p>
    <a href="${verificationUrl}" style="display:inline-block;background:#2C4A3E;color:#F7F5F0;font-family:Arial,sans-serif;font-size:14px;font-weight:bold;padding:14px 28px;text-decoration:none;border-radius:2px;">
      Verify Email Address
    </a>
    <p style="font-family:Arial,sans-serif;font-size:13px;color:#8A8278;margin:32px 0 0;border-top:1px solid #D8D4CC;padding-top:24px;">
      If you did not create this account, you can safely ignore this email.<br>
      This link expires in 24 hours.
    </p>
  </div>
</body>
</html>`.trim();
}
