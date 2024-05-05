import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import Handlebars from 'handlebars';

@Injectable()
export class MailerService {
  private readonly transporter: nodemailer.Transporter;
  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: configService.get('MAIL_HOST', { infer: true }),
      // port: configService.get('MAIL_PORT', { infer: true }),
      // service: configService.get('MAIL_SERVICE_PROVIDER', { infer: true }),
      // ignoreTLS: configService.get('MAIL_IGNORE_TLS', { infer: true }),
      // secure: configService.get('MAIL_SECURE', { infer: true }),
      // requireTLS: configService.get('MAIL_REQUIRE_TLS', { infer: true }),
      auth: {
        user: configService.get('MAIL_USER', { infer: true }),
        pass: configService.get('MAIL_PASSWORD', { infer: true }),
      },
    });
  }

  async sendMail({
    templatePath,
    context,
    ...mailOptions
  }: nodemailer.SendMailOptions & {
    templatePath: string;
    context: Record<string, unknown>;
  }): Promise<void> {
    let html: string | undefined;

    if (templatePath) {
      const template = await fs.readFile(templatePath, 'utf-8');
      html = Handlebars.compile(template, {
        strict: true,
      })(context);
    }

    await this.transporter.sendMail({
      ...mailOptions,
      from: mailOptions.from
        ? mailOptions.from
        : `"${this.configService.get('MAIL_DEFAULT_NAME', {
            infer: true,
          })}"`,
      html: mailOptions.html ? mailOptions.html : html,
    });
  }
}
