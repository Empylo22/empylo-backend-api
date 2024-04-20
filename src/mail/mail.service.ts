import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailData } from './interfaces/mail-data.interface';
import { MailerService } from '../mailer/mailer.service';
import * as path from 'path';

@Injectable()
export class MailService {
  private readonly app_name;
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.app_name = this.configService.get('APP', { infer: true });
  }

  async userSocialSignUp(mailData: MailData<{ name: string }>): Promise<void> {
    const emailConfirmTitle = `Thank you for signing up on ${this.app_name}`;
    await this.mailerService.sendMail({
      to: mailData.to,
      subject: emailConfirmTitle,
      templatePath: path.join(
        process.cwd(),
        'src',
        'mail',
        'mail-templates',
        'socialActivation.hbs',
      ),
      context: {
        title: emailConfirmTitle,
        actionTitle: emailConfirmTitle,
        app_name: this.configService.get('APP', { infer: true }),
        name: mailData.data.name,
      },
    });
  }
  async userSignUp(
    mailData: MailData<{ name?: string; code: string }>,
  ): Promise<void> {
    const emailConfirmTitle = `Thank you for signing up on ${this.app_name}`;

    await this.mailerService.sendMail({
      to: mailData.to,
      subject: emailConfirmTitle,
      templatePath: path.join(
        process.cwd(),
        'src',
        'mail',
        'mail-templates',
        'activations.hbs',
      ),
      context: {
        title: emailConfirmTitle,
        // url: url?.toString(),
        actionTitle: emailConfirmTitle,
        app_name: this.configService.get('APP', { infer: true }),
        code: mailData.data.code,
      },
    });
  }
  async addUserSignUp(
    mailData: MailData<{ name?: string; password: string; code?: string }>,
  ): Promise<void> {
    const emailConfirmTitle = `Welcome on ${this.app_name}`;
    await this.mailerService.sendMail({
      to: mailData.to,
      subject: emailConfirmTitle,
      templatePath: path.join(
        process.cwd(),
        'src',
        'mail',
        'mail-templates',
        'addMemberActivation.hbs',
      ),
      context: {
        title: emailConfirmTitle,
        // url: url?.toString(),
        actionTitle: emailConfirmTitle,
        app_name: this.configService.get('APP', { infer: true }),
        // name: mailData.data.name,
        code: mailData.data.code,
        password: mailData.data.password,
      },
    });
  }

  async forgotPassword(
    mailData: MailData<{ name: string; code: string }>,
  ): Promise<void> {
    const resetPasswordTitle = `Password Reset Instructions for ${this.app_name}`;
    await this.mailerService.sendMail({
      to: mailData.to,
      subject: resetPasswordTitle,
      templatePath: path.join(
        process.cwd(),
        'src',
        'mail',
        'mail-templates',
        'forgot-password.hbs',
      ),
      context: {
        title: resetPasswordTitle,
        actionTitle: resetPasswordTitle,
        app_name: this.app_name,
        name: mailData.data.name,
        code: mailData.data.code,
      },
    });
  }

  async deactiveVariousUsers(
    mailData: MailData<{ name: string }>,
  ): Promise<void> {
    const decativationTitle = `Notification for Deactivation of Account on ${this.app_name}`;

    await this.mailerService.sendMail({
      to: mailData.to,
      subject: decativationTitle,
      templatePath: path.join(
        process.cwd(),
        'src',
        'mail',
        'mail-templates',
        'accountDeactivation.hbs',
      ),
      context: {
        title: decativationTitle,
        actionTitle: decativationTitle,
        app_name: this.app_name,
        name: mailData.data.name,
      },
    });
  }
  async activateVariousUsers(
    mailData: MailData<{ name: string }>,
  ): Promise<void> {
    const decativationTitle = `Notification for Activation of Account on ${this.app_name}`;

    await this.mailerService.sendMail({
      to: mailData.to,
      subject: decativationTitle,
      templatePath: path.join(
        process.cwd(),
        'src',
        'mail',
        'mail-templates',
        'accountReactivation.hbs',
      ),
      context: {
        title: decativationTitle,
        actionTitle: decativationTitle,
        app_name: this.app_name,
        name: mailData.data.name,
      },
    });
  }
}
