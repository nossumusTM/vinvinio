const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

const buildAuthHeader = () => {
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials are not configured.');
  }

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  return `Basic ${credentials}`;
};

export const isTwilioConfigured = () => {
  return Boolean(accountSid && authToken && verifyServiceSid);
};

export const sendVerificationCode = async (to: string) => {
  if (!verifyServiceSid) {
    throw new Error('Twilio Verify service SID is not configured.');
  }

  const body = new URLSearchParams({
    To: to,
    Channel: 'sms',
  });

  const response = await fetch(
    `https://verify.twilio.com/v2/Services/${verifyServiceSid}/Verifications`,
    {
      method: 'POST',
      headers: {
        Authorization: buildAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to start verification: ${errorText}`);
  }

  return response.json();
};

export const checkVerificationCode = async (to: string, code: string) => {
  if (!verifyServiceSid) {
    throw new Error('Twilio Verify service SID is not configured.');
  }

  const body = new URLSearchParams({
    To: to,
    Code: code,
  });

  const response = await fetch(
    `https://verify.twilio.com/v2/Services/${verifyServiceSid}/VerificationCheck`,
    {
      method: 'POST',
      headers: {
        Authorization: buildAuthHeader(),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to verify code: ${errorText}`);
  }

  return response.json();
};