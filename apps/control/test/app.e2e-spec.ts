import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import type { StatusReportDto } from '@double-o/shared';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/api/status (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/status')
      .expect(200)
      .expect((res) => {
        const report = res.body as StatusReportDto;
        expect(report.codename).toBe('control');
        expect(report.status).toBe('operational');
      });
  });
});
