import { SendChampBaseUrls, SendChampEndpoints } from '../../..';

const baseUrl: SendChampBaseUrls = Object.freeze({
  SENDCHAMP: 'https://api.sendchamp.com/api/v1/',
  SENDGRID: 'https://api.sendgrid.com/v3/',
  'LOCAL-SIMULATOR': 'http://localhost:2920/api/v1/',
});

const endpoints: SendChampEndpoints = Object.freeze({
  SEND_SMS: 'sms/send',
  SEND_VOICE: 'voice/send',
  SEND_EMAIL: "email/send",
  SEND_EMAIL_SENDGRID:'mail/send',
  getReport: (sms_message_id: string): string => `sms/status/${sms_message_id}`,
  REGISTER_SENDER: 'sms/create-sender-id',
  SEND_VERIFICATION_OTP: 'verification/create',
  VERIFY_VERIFICATION_OTP: 'verification/confirm',
  SEND_WHATSAPP: 'whatsapp/message/send',
});

export default endpoints;
export { baseUrl };
