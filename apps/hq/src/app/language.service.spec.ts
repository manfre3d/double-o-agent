import { TestBed } from '@angular/core/testing';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to Italian', () => {
    const service = TestBed.inject(LanguageService);
    expect(service.current()).toBe('it');
  });

  it('persists the preference on toggle', () => {
    const service = TestBed.inject(LanguageService);
    service.toggle();
    expect(service.current()).toBe('en');
    expect(localStorage.getItem('hq.lang')).toBe('en');
    service.toggle();
    expect(service.current()).toBe('it');
    expect(localStorage.getItem('hq.lang')).toBe('it');
  });

  it('reads a persisted preference on creation', () => {
    localStorage.setItem('hq.lang', 'en');
    const service = TestBed.inject(LanguageService);
    expect(service.current()).toBe('en');
  });

  it('translates and interpolates by current language', () => {
    const service = TestBed.inject(LanguageService);
    expect(service.t('startMission')).toBe('Avvia missione');
    expect(service.t('missionNo', { n: '007' })).toBe('Missione n. 007');
    service.toggle();
    expect(service.t('startMission')).toBe('Start mission');
    expect(service.t('missionNo', { n: '007' })).toBe('Mission no. 007');
  });
});
