export class ConfigService {
  private readonly envConfig: Record<string, any>;

  constructor() {
    this.envConfig = {
      baseIp: process.env.BASE_IP,
      httpPort: process.env.PORT,
    };
  }

  get(key: string): any {
    return this.envConfig[key];
  }
}
