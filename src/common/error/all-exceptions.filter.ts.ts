import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Prisma } from '@prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: any, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let status: HttpStatus;
    let message: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message.replace(/\n/g, '');
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.message.replace(/\n/g, '');
    } else if (exception instanceof Prisma.PrismaClientUnknownRequestError) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.message.replace(/\n/g, '');
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      message = exception.message.replace(/\n/g, '');
    } else if (exception instanceof Prisma.PrismaClientInitializationError) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal Server Error';
    }

    const responseBody = {
      statusCode: status,
      message: message,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestMethod(ctx.getRequest()),
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, status);
  }
}

// import {
//   Catch,
//   ArgumentsHost,
//   HttpException,
//   ExceptionFilter,
//   HttpStatus,
// } from '@nestjs/common';
// import { Request, Response } from 'express';
// import { Prisma } from '@prisma/client';

// @Catch(Prisma.PrismaClientKnownRequestError)
// export class AllExceptionsFilter implements ExceptionFilter {
//   catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
//     const ctx = host.switchToHttp();
//     const response = ctx.getResponse<Response>();
//     const request = ctx.getRequest<Request>();

//     const errorCode = exception.code;
//     let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
//     let errorMessage = 'Internal Server Error';
//     console.log(exception);

//     switch (errorCode) {
//       case 'P1000':
//         httpStatus = HttpStatus.UNAUTHORIZED;
//         errorMessage =
//           'Authentication failed. Please provide valid database credentials.';
//         break;

//       // Connection errors
//       case 'P1001':
//       case 'P1002':
//         httpStatus = HttpStatus.SERVICE_UNAVAILABLE;
//         errorMessage = 'Unable to connect to the database server.';
//         break;

//       // Database errors
//       case 'P1003':
//         httpStatus = HttpStatus.NOT_FOUND;
//         errorMessage = 'Database not found.';
//         break;

//       // Other errors
//       case 'P1008':
//         httpStatus = HttpStatus.REQUEST_TIMEOUT;
//         errorMessage = 'Operation timed out.';
//         break;

//       case 'P2000':
//         httpStatus = HttpStatus.BAD_REQUEST;
//         errorMessage = `The provided value for the column is too long for the column's type. Column: ${exception.meta?.column_name}`;
//         break;

//       case 'P2001':
//         httpStatus = HttpStatus.NOT_FOUND;
//         errorMessage = `The record searched for in the where condition (${exception.meta?.model_name}.${exception.meta?.argument_name} = ${exception.meta?.argument_value}) does not exist`;
//         break;

//       case 'P2002':
//         httpStatus = HttpStatus.CONFLICT;
//         errorMessage = `Unique constraint failed on the ${exception.meta?.constraint}`;
//         break;

//       case 'P2003':
//         httpStatus = HttpStatus.CONFLICT;
//         errorMessage = `Foreign key constraint failed on the field: ${exception.meta?.field_name}`;
//         break;

//       case 'P2004':
//         httpStatus = HttpStatus.CONFLICT;
//         errorMessage = `A constraint failed on the database: ${exception.meta?.database_error}`;
//         break;

//       default:
//         errorMessage = exception.message;
//         break;
//     }

//     const errorResponse = {
//       code: errorCode,
//       statusCode: httpStatus,
//       message: errorMessage,
//       timestamp: new Date().toISOString(),
//       path: request.url,
//     };

//     console.error(errorResponse);
//     response.status(httpStatus).json(errorResponse);
//   }
// }
