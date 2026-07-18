import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LLM_LIVE_AVAILABLE } from './agent/llm.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService, { provide: LLM_LIVE_AVAILABLE, useValue: true }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('status', () => {
    it('should report Control as operational', () => {
      const report = appController.getStatus();
      expect(report.codename).toBe('control');
      expect(report.status).toBe('operational');
      expect(Date.parse(report.reportedAt)).not.toBeNaN();
      expect(report.llmAvailable).toBe(true);
    });
  });
});
