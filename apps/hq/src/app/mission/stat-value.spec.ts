import { TestBed } from '@angular/core/testing';
import { StatValue } from './stat-value';

// jsdom has no matchMedia, so motionOk() is false and values snap instantly.
function render(value: number, format?: (n: number) => string): HTMLElement {
  const fixture = TestBed.createComponent(StatValue);
  fixture.componentRef.setInput('value', value);
  if (format) {
    fixture.componentRef.setInput('format', format);
  }
  fixture.detectChanges();
  TestBed.tick();
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('StatValue', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [StatValue] }).compileComponents();
  });

  it('renders the final formatted value immediately without motion support', () => {
    const el = render(42, (n) => `${n}%`);
    expect(el.textContent).toContain('42%');
  });

  it('re-renders when the value changes', () => {
    const fixture = TestBed.createComponent(StatValue);
    fixture.componentRef.setInput('value', 3);
    fixture.detectChanges();
    TestBed.tick();
    fixture.detectChanges();

    fixture.componentRef.setInput('value', 5);
    fixture.detectChanges();
    TestBed.tick();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('5');
    expect(text).not.toContain('3');
  });
});
