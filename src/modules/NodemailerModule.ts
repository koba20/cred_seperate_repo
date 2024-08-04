import nodemailer, { Transporter } from 'nodemailer';
import config from '../../config/config';

export type MailData = {
  from: string;
  to: string;
  html?: string;
  firstName?: string;
  subject?: string;
};

export default class NodemailerModule {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.MAIL_HOST,
      port: Number(config.MAIL_PORT),
      connectionTimeout: 300000,
      pool: true,
      logger: true,
      secure: false,
      auth: {
        user: config.MAIL_USER,
        pass: config.MAIL_PASSWORD,
      },
      ignoreTLS: false,
      requireTLS: true,
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  async send(mailData: MailData) {
    this.transporter.verify((error) => {
      if (error) console.error(`Error sending email :::::: ${error}`);
      else console.info('Server 🚀 is ready to send out mails');
    });

    return this.transporter.sendMail(mailData, (error, info) => {
      if (error) console.error('Error sending email :::::: ', error);
      else {
        console.info('Email sent: ' + info.response);
        console.info('Email sent to: ' + info.accepted);
        console.info('Email sent count: ' + info.accepted?.length);
        console.info('Email failed Count : ' + info.rejected?.length);
      }
    });
  }
}
