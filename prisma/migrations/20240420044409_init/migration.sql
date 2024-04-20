-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "phoneNumber" TEXT,
    "isActivated" BOOLEAN NOT NULL DEFAULT false,
    "twoStepVerification" BOOLEAN NOT NULL DEFAULT false,
    "companyName" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "companyId" INTEGER,
    "createdDate" TIMESTAMP(3),
    "lastModifiedDate" TIMESTAMP(3),
    "roleId" INTEGER,
    "profileImage" TEXT,
    "lastLogin" TIMESTAMP(3),
    "isActive" BOOLEAN DEFAULT false,
    "isEmailVerified" BOOLEAN DEFAULT false,
    "verificationCode" TEXT,
    "status" TEXT DEFAULT 'inactive',
    "gender" TEXT,
    "maritalStatus" TEXT,
    "empyloID" TEXT,
    "passwordResetCode" TEXT,
    "industry" TEXT,
    "website" TEXT,
    "companyDescription" TEXT,
    "address" TEXT,
    "addressCity" TEXT,
    "addressState" TEXT,
    "emailNotification" BOOLEAN DEFAULT false,
    "campaignNtification" BOOLEAN DEFAULT false,
    "termsConditions" BOOLEAN DEFAULT false,
    "socialId" TEXT,
    "socialProvider" TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenManager" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "operationType" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "TokenManager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivationToken" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER,

    CONSTRAINT "ActivationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Modules" (
    "id" SERIAL NOT NULL,
    "moduleName" TEXT NOT NULL,
    "moduleDescription" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdDate" TIMESTAMP(3),
    "lastModifiedDate" TIMESTAMP(3),

    CONSTRAINT "Modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpObject" (
    "id" SERIAL NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "jwt" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER,

    CONSTRAINT "OtpObject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permissions" (
    "id" SERIAL NOT NULL,
    "permissionTitle" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdDate" TIMESTAMP(3),
    "lastModifiedDate" TIMESTAMP(3),
    "moduleId" INTEGER,

    CONSTRAINT "Permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResetToken" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER,

    CONSTRAINT "ResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "roleName" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdDate" TIMESTAMP(3),
    "lastModifiedDate" TIMESTAMP(3),

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneNumber_key" ON "User"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "User_verificationCode_key" ON "User"("verificationCode");

-- CreateIndex
CREATE UNIQUE INDEX "User_passwordResetCode_key" ON "User"("passwordResetCode");

-- CreateIndex
CREATE UNIQUE INDEX "Modules_moduleName_key" ON "Modules"("moduleName");

-- CreateIndex
CREATE UNIQUE INDEX "Permissions_permissionTitle_key" ON "Permissions"("permissionTitle");

-- CreateIndex
CREATE UNIQUE INDEX "Role_roleName_key" ON "Role"("roleName");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenManager" ADD CONSTRAINT "TokenManager_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivationToken" ADD CONSTRAINT "ActivationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtpObject" ADD CONSTRAINT "OtpObject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permissions" ADD CONSTRAINT "Permissions_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResetToken" ADD CONSTRAINT "ResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
