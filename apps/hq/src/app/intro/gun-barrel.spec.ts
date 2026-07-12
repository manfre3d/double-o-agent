import { TestBed } from '@angular/core/testing';
import { GunBarrel } from './gun-barrel';

describe('GunBarrel', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [GunBarrel] }).compileComponents();
  });

  it('falls back to the CSS intro and finishes without motion or WebGL support', async () => {
    // jsdom: no matchMedia → motionOk() is false, so the intro renders the
    // CSS fallback (never the WebGL canvas) and skips itself immediately.
    const fixture = TestBed.createComponent(GunBarrel);
    let finished = false;
    fixture.componentInstance.finished.subscribe(() => {
      finished = true;
    });
    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('canvas')).toBeNull();
    expect(el.querySelector('.barrel-dot')).not.toBeNull();
    expect(finished).toBe(true);
  });
});
