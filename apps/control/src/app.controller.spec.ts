import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('status', () => {
    it('should report Control as operational', () => {
      const report = appController.getStatus();
      expect(report.codename).toBe('control');
      expect(report.status).toBe('operational');
      expect(Date.parse(report.reportedAt)).not.toBeNaN();
    });
  });
});
