import { Module, Global } from '@nestjs/common';
import { LocalUploadService, S3UploadService } from './upload.service';

@Global()
@Module({
  providers: [LocalUploadService, S3UploadService],
  exports: [LocalUploadService, S3UploadService],
})
export class UploadServiceModule {}
