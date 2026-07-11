import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import type { MissionAnalyticsDto, StatusReportDto } from '@double-o/shared';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the status report served by Control', async () => {
    const fixture = TestBed.createComponent(App);
    TestBed.tick();

    const report: StatusReportDto = {
      codename: 'control',
      status: 'operational',
      message: 'Control operativo. In attesa della prossima missione.',
      reportedAt: new Date().toISOString(),
    };
    const http = TestBed.inject(HttpTestingController);
    const emptyAnalytics: MissionAnalyticsDto = {
      totalMissions: 0,
      completed: 0,
      failed: 0,
      running: 0,
      flaggedInvoices: 0,
      byType: [],
      gadgets: [],
    };
    http.expectOne('/api/status').flush(report);
    http.expectOne('/api/missions').flush([]);
    http.expectOne('/api/missions/analytics').flush(emptyAnalytics);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain(report.message);
    expect(compiled.textContent).toContain('control');
  });
});
