import { Injectable, BadRequestException } from '@nestjs/common';
import * as AWS from 'aws-sdk';
// import { S3Client } from '@aws-sdk/client-s3';
import * as path from 'path';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { promisify } from 'util';
import * as bytes from 'bytes';

@Injectable()
export class LocalUploadService {
  private uploadDirectory: string;
  private baseUrl: string;
  private uploadSizeLimit: number;
  private uploadSizeLimitConfig: string;

  constructor(private readonly configService: ConfigService) {
    // Define the directory where files will be stored locally
    this.uploadDirectory = path.join(process.cwd(), 'uploads');

    // Create the directory if it doesn't exist
    if (!fs.existsSync(this.uploadDirectory)) {
      fs.mkdirSync(this.uploadDirectory, { recursive: true });
    }

    // Set the base URL dynamically based on the host

    // const serverHost = this.configService.get<string>('IS_DEVMODE')
    //   ? 'localhost'
    //   : this.configService.get<string>('BASE_IP');
    const serverHost = this.configService.get<string>('BASE_IP');
    const serverPort =
      this.configService.get<number>(
        'USER_MANAGER_AND_AUTH_SERVICE_HTTP_PORT',
      ) || 3000;
    this.baseUrl = `http://${serverHost}:${serverPort}`;

    // const isDevMode = this.configService.get<boolean>('IS_DEVMODE');
    // const serverHost = isDevMode
    //   ? 'localhost'
    //   : this.configService.get<string>('BASE_IP', '');
    // const serverPort = this.configService.get<number>(
    //   'USER_MANAGER_AND_AUTH_SERVICE_HTTP_PORT',
    //   3000,
    // );
    // this.baseUrl = `http://${serverHost}:${serverPort}`;

    // this.uploadSizeLimit = this.configService.get<number>(
    //   'LOCAL_UPLOAD_SIZE_LIMIT',
    //   5 * 1024 * 1024,
    // ); // Default: 5MB

    this.uploadSizeLimitConfig = this.configService.get<string>(
      'LOCAL_UPLOAD_SIZE_LIMIT',
    );
    this.uploadSizeLimit = this.uploadSizeLimitConfig
      ? this.parseBytesValue(this.uploadSizeLimitConfig)
      : null;
  }

  async uploadFile(file: any): Promise<string> {
    try {
      // Check file extension or MIME type if needed
      // const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
      // const ext = path.extname(file.originalname).toLowerCase();
      // if (!allowedExtensions.includes(ext)) {
      //   throw new BadRequestException('Only image files are allowed');
      // }

      // Check file size if uploadSizeLimit is provided
      if (this.uploadSizeLimit !== null && file.size > this.uploadSizeLimit) {
        throw new BadRequestException(
          `File size exceeds the limit of ${this.uploadSizeLimitConfig}`,
        );
      }

      // Use the original filename
      const filename = `${Date.now()}-${file.originalname}`;

      // Write the file to the local storage
      const filePath = path.join(this.uploadDirectory, filename);
      await promisify(fs.writeFile)(filePath, file.buffer);

      // Return the URL of the uploaded file
      const fileUrl = `${this.baseUrl}/${filename}`;
      return fileUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async uploadFiles(files: any[]): Promise<any[]> {
    const uploadedFiles = [];

    for (const file of files) {
      const uploadedFile = await this.uploadFile(file);
      uploadedFiles.push({ fileUrl: uploadedFile });
    }

    return uploadedFiles;
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      // Check if the file exists
      if (fs.existsSync(filePath)) {
        // Delete the file
        await promisify(fs.unlink)(filePath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  public parseBytesValue(value: string): number {
    return bytes.parse(value);
  }
}

@Injectable()
export class S3UploadService {
  private s3: AWS.S3;
  private bucketName: string;
  private uploadSizeLimit: number;
  private uploadSizeLimitConfig: string;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new AWS.S3({
      accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
    });
    this.bucketName = this.configService.get<string>('AWS_BUCKET_NAME');

    this.uploadSizeLimitConfig = this.configService.get<string>(
      'S3_UPLOAD_SIZE_LIMIT',
    );
    this.uploadSizeLimit = this.uploadSizeLimitConfig
      ? this.parseBytesValue(this.uploadSizeLimitConfig)
      : null;
  }

  async uploadFile(file: any): Promise<string> {
    try {
      // Check file extension or MIME type
      // const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
      // const ext = path.extname(file.originalname).toLowerCase();
      // if (!allowedExtensions.includes(ext)) {
      //   throw new BadRequestException('Only image files are allowed');
      // }

      // Check file size if uploadSizeLimit is provided
      if (this.uploadSizeLimit !== null && file.size > this.uploadSizeLimit) {
        throw new BadRequestException(
          `File size exceeds the limit of ${this.uploadSizeLimitConfig}`,
        );
      }

      // const randomString = this.generateRandomString(15);
      // const key = `${randomString}-${Date.now()}${ext}`;
      const key = `${Date.now()}-${file.originalname}`;

      const params = {
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      };

      const data = await this.s3.upload(params).promise();
      return data.Location;
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw error;
    }
  }

  async uploadFiles(files: any[]): Promise<any[]> {
    const imageUrls = [];

    for (const file of files) {
      const imageUrl = await this.uploadFile(file);
      imageUrls.push({ imageUrl });
    }

    return imageUrls;
  }

  public extractFileKeyFromUrl(url: string | URL) {
    try {
      const parsedUrl = new URL(url);
      const pathName = parsedUrl.pathname;
      const fileKey = decodeURIComponent(pathName.slice(1)); // Remove the leading '/'

      return fileKey;
    } catch (error) {
      console.error('Invalid URL:', error);
      return null;
    }
  }

  async deleteFile(fileKey: string): Promise<void> {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: fileKey,
      };

      await this.s3.deleteObject(params).promise();
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      throw error;
    }
  }

  public parseBytesValue(value: string): number {
    return bytes.parse(value);
  }

  private generateRandomString(length: number): string {
    const charset =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charsetLength = charset.length;
    const randomValues = new Uint8Array(length);

    crypto.getRandomValues(randomValues);

    for (let i = 0; i < length; i++) {
      result += charset[randomValues[i] % charsetLength];
    }

    return result;
  }
}
