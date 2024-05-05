// // src/users/entities/user.entity.ts
// import { ApiProperty } from '@nestjs/swagger';
// import { Role, ResetToken, ActivationToken, OtpObject } from '@prisma/client';

// import { Exclude } from 'class-transformer';

// export class UserEntity {
//   @ApiProperty()
//   id: number;

//   @ApiProperty()
//   firstName?: string;

//   @ApiProperty()
//   lastName?: string;

//   @ApiProperty({ uniqueItems: true })
//   email: string;

//   @Exclude()
//   password?: string;

//   @ApiProperty({ uniqueItems: true })
//   phoneNumber?: string;

//   @ApiProperty({ default: false })
//   isActivated: boolean;

//   @ApiProperty({ default: false })
//   twoStepVerification: boolean;

//   @ApiProperty()
//   companyName?: string;

//   @ApiProperty({ default: false })
//   isDeleted: boolean;

//   @ApiProperty()
//   companyId?: number;

//   @ApiProperty()
//   createdDate?: Date;

//   @ApiProperty()
//   lastModifiedDate?: Date;

//   @ApiProperty()
//   roleId?: number;

//   @ApiProperty()
//   profileImage?: string;

//   @ApiProperty({ default: 'current date and time' })
//   createdAt: Date;

//   @ApiProperty()
//   lastLogin?: Date;

//   @ApiProperty({ default: false })
//   isActive: boolean;

//   @ApiProperty()
//   updatedAt: Date;

//   @ApiProperty({ default: false })
//   isEmailVerified: boolean;

//   @ApiProperty({ uniqueItems: true })
//   verificationCode?: string;

//   @ApiProperty({ default: 'inactive' })
//   status: string;

//   @ApiProperty()
//   gender?: string;

//   @ApiProperty()
//   maritalStatus?: string;

//   @ApiProperty()
//   empyloID?: string;

//   @ApiProperty({ uniqueItems: true })
//   passwordResetCode?: string;

//   @ApiProperty()
//   industry?: string;

//   @ApiProperty()
//   website?: string;

//   @ApiProperty()
//   companyDescription?: string;

//   @ApiProperty()
//   address?: string;

//   @ApiProperty()
//   addressCity?: string;

//   @ApiProperty()
//   addressState?: string;

//   @ApiProperty({ default: false })
//   emailNotification: boolean;

//   @ApiProperty({ default: false })
//   campaignNtification: boolean;

//   @ApiProperty({ default: false })
//   termsConditions: boolean;

//   @ApiProperty()
//   socialId?: string;

//   @ApiProperty()
//   socialProvider?: string;

//   @ApiProperty()
//   activationToken?: ActivationToken[];

//   @ApiProperty()
//   otpObject?: OtpObject[];

//   @ApiProperty()
//   resetToken?: ResetToken[];

//   @ApiProperty()
//   role?: Role;
// }
