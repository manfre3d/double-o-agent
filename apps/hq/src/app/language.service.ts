import { Injectable, signal } from '@angular/core';
import { type Lang, type TranslationKey, translations } from './i18n/translations';

const STORAGE_KEY = 'hq.lang';

/**
 * UI display language, independent from the lore/language rule in CLAUDE.md:
 * mission content streamed from Control stays Italian regardless of this
 * toggle — only the static dashboard chrome and lore-flavored labels here
 * switch between English and Italian.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly current = signal<Lang>(readStoredPreference());

  constructor() {
    applyDocumentLang(this.current());
  }

  toggle(): void {
    this.current.update((lang) => (lang === 'it' ? 'en' : 'it'));
    try {
      localStorage.setItem(STORAGE_KEY, this.current());
    } catch {
      // The preference simply won't persist.
    }
    applyDocumentLang(this.current());
  }

  t(key: TranslationKey, params?: Record<string, string | number>): string {
    const template = translations[this.current()][key];
    if (!params) {
      return template;
    }
    return Object.entries(params).reduce(
      (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
      template,
    );
  }
}

function applyDocumentLang(lang: Lang): void {
  document.documentElement.lang = lang;
}

function readStoredPreference(): Lang {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'it';
  } catch {
    return 'it';
  }
}
