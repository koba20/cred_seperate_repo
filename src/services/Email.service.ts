import config from '../../config/config';
import NodemailerModule from '../modules/NodemailerModule';
import PASSWORD_RESET_EMAIL from '../mail/password-reset';
import WELCOME_EMAIL from '../mail/welcome-email';
import EMAIL_VERIFICATION from '../mail/email-verification';
import PAYMENT_TRACKING from '../mail/payment-tracking';
import TRANSACTION_NOTIFICATION from '../mail/user-account-credited';
import USER_ACCOUNT_DEBITED from '../mail/user-account-debited';
import PAYMENT_UNSUCCESSFUL from '../mail/payment-unsuccessful';
import SCHEDULE_ENDED from '../mail/schedule-ended';
import ADMIN_LOGIN_CREDENTIALS from '../mail/admin-login-credentials';
import NOTIFY_STATION_USERS_OF_NOTIFICATION from '../mail/notify-station-users-of-notification';
import SEND_TX_PIN_RESET from '../mail/send-tx-pin-reset';
import CONTESTANT_NOTIFICATION from '../mail/contest-notification';
const _nodeMailerModule = new NodemailerModule();

const emailType: EmailType = {
  WELCOME_EMAIL: [`Welcome to ${config.appName}`, 'welcome'],
  PASSWORD_RESET_INSTRUCTION: ['Password Reset Requested', 'password-reset'],
  PASSWORD_RESET_SUCCESSFUL: ['Password Reset', 'password-reset-successful'],
  EMAIL_VERIFICATION: ['Email Verification Requested', 'email-verification'],
  PASSWORD_CHANGED: ['Password Changed', 'password-changed'],
  PAYMENT_TRACKING: ['Payment Tracking', 'payment-tracking'],
  PAYMENT_UNSUCCESSFUL: ['Payment Unsuccessful', 'payment-unsuccessful'],
  SCHEDULE_ENDED: ['Schedule payment period ended', 'schedule-ended'],
  ADMIN_LOGIN_CREDENTIALS: [
    `${config.appName} Login Credentials`,
    'admin-login-credentials',
  ],
  NOTIFY_STATION_USERS_OF_NOTIFICATION: [
    `${config.appName} New Notification`,
    'notify-station-users-of-notification',
  ],
  SEND_TX_PIN_RESET: [
    `${config.appName} Transaction Pin Reset`,
    'send-tx-pin-reset',
  ],
  TRANSACTION_NOTIFICATION: [
    `${config.appName} Transaction Notification`,
    'transaction-notification',
  ],
  CONTEST_NOTIFICATION: [
    `${config.appName} Contest Notification`,
    'contest-notification',
  ],
};

type Data = {
  [T: string]: string | { [key: string]: string }[];
};

type EmailOptions = {
  from: string;
  to: string;
  html?: string;
  fullName?: string;
  subject?: string;
};

type EmailType = {
  [k: string]: string[];
};
export default class EmailService {
  /** Send email takes the following parameters:
   * type - refers to the type of the email eg WelcomeEmail
   * to - refers to who you are sending the email to
   * data - refers to what you want to send to the user
   */
  async _sendMail(type: string, email: string, data: Data) {
    const mailOptions: EmailOptions = {
      from: config.from,
      to: email,
    };
    const [subject, templatePath] = emailType[type] || [];
    if (!subject || !templatePath) return;
    switch (templatePath) {
      case 'welcome':
        mailOptions.html = WELCOME_EMAIL(
          data.fullName as string,
          data.url as string
        );
        mailOptions.subject = `${subject} ${data.fullName}`;
        break;
      case 'password-reset':
        mailOptions.html = PASSWORD_RESET_EMAIL(
          data.fullName as string,
          data.token as string
        );
        mailOptions.subject = `[URGENT] - ${subject}`;
        break;
      case 'email-verification':
        mailOptions.html = EMAIL_VERIFICATION(
          data.fullName as string,
          data.token as string
        );
        mailOptions.subject = `[${config.appName}] ${subject}`;
        break;
      case 'payment-tracking':
        mailOptions.html = PAYMENT_TRACKING(data.message as string);
        mailOptions.subject = `[${config.appName}] ${subject}`;
        break;
      case 'user-account-credited':
        mailOptions.html = TRANSACTION_NOTIFICATION(
          data.fullName as string,
          data.message as string
        );
        mailOptions.subject = `${subject}`;
        break;
      case 'user-account-debited':
        mailOptions.html = USER_ACCOUNT_DEBITED(
          data.fullName as string,
          data.message as string
        );
        mailOptions.subject = `${subject}`;
        break;
      case 'payment-unsuccessful':
        mailOptions.html = PAYMENT_UNSUCCESSFUL(
          data.fullName as string,
          data.users as { [key: string]: string }[]
        );
        mailOptions.subject = `${subject}`;
        break;
      case 'schedule-ended':
        mailOptions.html = SCHEDULE_ENDED(
          data.fullName as string,
          data.message as string
        );
        mailOptions.subject = `${subject}`;
        break;
      case 'admin-login-credentials':
        mailOptions.html = ADMIN_LOGIN_CREDENTIALS(
          data.fullName as string,
          data.message as string,
          data.password as string
        );
        mailOptions.subject = `${subject}`;
        break;
      case 'notify-station-users-of-notification':
        mailOptions.html = NOTIFY_STATION_USERS_OF_NOTIFICATION(
          data.fullName as string,
          data.message as string
        );
        mailOptions.subject = subject;
        break;
      case 'send-tx-pin-reset':
        mailOptions.html = SEND_TX_PIN_RESET(
          data.fullName as string,
          data.token as string
        );
        mailOptions.subject = subject;
        break;
      case 'transaction-notification':
        mailOptions.html = TRANSACTION_NOTIFICATION(
          data.fullName as string,
          data.message as string
        );
        mailOptions.subject = subject;
        break;
      case 'contest-notification':
        mailOptions.html = CONTESTANT_NOTIFICATION(
          data.fullName as string,
          data.message as string
        );
        mailOptions.subject = subject;
        break;
    }

    await _nodeMailerModule.send(mailOptions);
    console.info(`Email on it's way to ${email}`);
  }

  async _sendWelcomeEmail(fullName: string, email: string) {
    const url = `${config.FRONTEND_APP_URL}/sign-in`;
    return await this._sendMail('WELCOME_EMAIL', email, { fullName, url });
  }

  async _sendUserEmailVerificationEmail(
    fullName: string,
    email: string,
    token: string
  ) {
    return await this._sendMail('EMAIL_VERIFICATION', email, {
      fullName,
      token,
    });
  }

  async _sendUserPasswordResetInstructionEmail(
    fullName: string,
    email: string,
    token: string
  ) {
    return await this._sendMail('PASSWORD_RESET_INSTRUCTION', email, {
      fullName,
      token,
    });
  }

  async sendPaymentTrackingEmail(message: string) {
    return await this._sendMail('PAYMENT_TRACKING', 'danpraise4@gmail.com', {
      message,
    });
  }

  async sendUserAccountCreditedEmail(
    to: string,
    fullName: string,
    message: string
  ) {
    return await this._sendMail('TRANSACTION_NOTIFICATION', to, {
      fullName,
      message,
    });
  }

  async debitUserAccountEmail(to: string, fullName: string, message: string) {
    return await this._sendMail('USER_ACCOUNT_DEBITED', to, {
      fullName,
      message,
    });
  }

  async paymentUnsuccessfulEmail(
    to: string,
    fullName: string,
    users: { [key: string]: string }[]
  ) {
    return await this._sendMail('PAYMENT_UNSUCCESSFUL', to, {
      fullName,
      users: users as { [key: string]: string }[],
    });
  }

  async scheduleEndedEmail(to: string, fullName: string, message: string) {
    return await this._sendMail('SCHEDULE_ENDED', to, {
      fullName,
      message,
    });
  }

  async sendAdminLoginCredentials(
    to: string,
    fullName: string,
    message: string,
    password: string
  ) {
    return await this._sendMail('ADMIN_LOGIN_CREDENTIALS', to, {
      fullName,
      message,
      password,
    });
  }

  async notifyStationUsersOfNotification(
    to: string,
    fullName: string,
    message: string
  ) {
    return await this._sendMail('NOTIFY_STATION_USERS_OF_NOTIFICATION', to, {
      fullName,
      message,
    });
  }

  async sendTxPinResetEmail(
    fullName: string,
    email: string,
    token: string
  ): Promise<void> {
    return await this._sendMail('SEND_TX_PIN_RESET', email, {
      fullName,
      token,
    });
  }

  async transactionNotificationEmail(
    to: string,
    fullName: string,
    message: string
  ) {
    return await this._sendMail('TRANSACTION_NOTIFICATION', to, {
      fullName,
      message,
    });
  }

  async sendContestantEmail(to: string, fullName: string, message: string) {
    return await this._sendMail('CONTEST_NOTIFICATION', to, {
      fullName,
      message,
    });
  }

  async sendPollStartedEmail(to: string, fullName: string, message: string) {
    return await this._sendMail('CONTEST_NOTIFICATION', to, {
      fullName,
      message,
    });
  }
}
