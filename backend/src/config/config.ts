import { ConfigService } from '@nestjs/config';

export const jwtConfig = (configService: ConfigService) => ({
  secret: configService.get<string>('JWT_SECRET'),
  expiresIn: configService.get<string>('JWT_EXPIRY', '7d'),
});

export const databaseConfig = (configService: ConfigService) => ({
  url: configService.get<string>('DATABASE_URL'),
});

export const awsS3Config = (configService: ConfigService) => ({
  region: configService.get<string>('AWS_REGION'),
  credentials: {
    accessKeyId: configService.get<string>('AWS_ACCESS_KEY_ID'),
    secretAccessKey: configService.get<string>('AWS_SECRET_ACCESS_KEY'),
  },
  bucket: configService.get<string>('AWS_S3_BUCKET'),
});

export const twilioConfig = (configService: ConfigService) => ({
  accountSid: configService.get<string>('TWILIO_ACCOUNT_SID'),
  authToken: configService.get<string>('TWILIO_AUTH_TOKEN'),
  phoneNumber: configService.get<string>('TWILIO_PHONE_NUMBER'),
});
