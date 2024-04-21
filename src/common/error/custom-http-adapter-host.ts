import { HttpAdapterHost, AbstractHttpAdapter } from '@nestjs/core';

export class CustomHttpAdapterHost extends HttpAdapterHost<AbstractHttpAdapter> {
  constructor(httpAdapter: AbstractHttpAdapter) {
    super();
    this.httpAdapter = httpAdapter;
  }
}
