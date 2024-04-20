import { Injectable, NestMiddleware } from '@nestjs/common';

import * as jwt from 'jsonwebtoken';

function decodeJwtToken(token: string): any {
  try {
    console.log(token);
    const decoded = jwt.verify(token, 'jwtConstants.secret');
    return decoded;
  } catch (error) {
    console.error('Error decoding JWT:', error.message);
    return null;
  }
}

export { decodeJwtToken };

@Injectable()
export class UserMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const jwtToken = req.headers.authorization?.split(' ')[1];
    if (jwtToken) {
      const decodedUser = decodeJwtToken(jwtToken);
      req.user = decodedUser;
    }
    next();
  }
}
