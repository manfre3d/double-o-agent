import { TestBed } from '@angular/core/testing';
import { SoundService } from './sound.service';

describe('SoundService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('is muted by default', () => {
    const service = TestBed.inject(SoundService);
    expect(service.enabled()).toBe(false);
  });

  it('persists the preference on toggle', () => {
    const service = TestBed.inject(SoundService);
    service.toggle();
    expect(service.enabled()).toBe(true);
    expect(localStorage.getItem('hq.audio')).toBe('on');
    service.toggle();
    expect(service.enabled()).toBe(false);
    expect(localStorage.getItem('hq.audio')).toBe('off');
  });

  it('reads a persisted preference on creation', () => {
    localStorage.setItem('hq.audio', 'on');
    const service = TestBed.inject(SoundService);
    expect(service.enabled()).toBe(true);
  });

  it('cues are safe no-ops without WebAudio support', () => {
    // jsdom has no AudioContext — every cue must silently bail out.
    const service = TestBed.inject(SoundService);
    service.toggle();
    expect(() => {
      service.typeTick();
      service.stampThunk();
      service.relayClick();
    }).not.toThrow();
  });
});
