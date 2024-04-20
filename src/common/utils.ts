import * as bcrypt from 'bcrypt';

export const hashFunction = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSaltSync(10);
  return await bcrypt.hashSync(password, salt);
};

// export const createOTPToken = async (): Promise<string> => {
//   let generatedToken = '';

//   // Keep generating random numbers until the token is exactly six digits
//   while (generatedToken.length !== 6) {
//     generatedToken = Math.floor(100000 + Math.random() * 900000).toString();
//   }

//   // Convert the generated token to an integer
//   const tokenInt = parseInt(generatedToken);

//   console.log({ generatedToken, tokenInt });

//   const tokenExpires = Date.now() + 10 * 60 * 1000;

//   console.log(tokenExpires);

//   return generatedToken;
// };

// compare the password

export const createOTPToken = async (): Promise<string> => {
  let generatedToken = '';

  // Keep generating random numbers until the token is exactly four digits
  while (generatedToken.length !== 4) {
    generatedToken = Math.floor(1000 + Math.random() * 9000).toString();
  }

  // Log the generated token and its integer value (optional)
  console.log({ generatedToken, tokenInt: parseInt(generatedToken) });

  // Calculate token expiration (if needed)
  const tokenExpires = Date.now() + 10 * 60 * 1000;
  console.log(tokenExpires);

  return generatedToken;
};

export const comparePassword = async (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

export interface BaseResponse {
  message: string;
  status: number;
  // result: Object;
  result?: any;
  error?: string;
}

export interface CreateAuditTrailDto {
  userId: number;
  fullName: string;
  companyName: string;
  activityType: string;
  activityDescription: string;
  route: string;
  ipAddress: string;
}

export const getUserFromRequest = (req: any) => {
  return JSON.parse(req.headers.user);
};

export const getActivityType = (method: any) => {
  switch (method.toLowerCase()) {
    case 'get':
      return 'read';
    case 'post':
      return 'create';
    case 'put':
      return 'update';
    case 'delete':
      return 'delete';
  }
};
