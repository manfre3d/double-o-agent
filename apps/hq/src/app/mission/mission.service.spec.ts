import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MissionService } from './mission.service';

function fileList(files: File[]): FileList {
  const list: Record<number, File> = {};
  files.forEach((file, i) => (list[i] = file));
  return {
    ...list,
    length: files.length,
    item: (i: number) => files[i] ?? null,
  } as unknown as FileList;
}

describe('MissionService', () => {
  let service: MissionService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MissionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uploads invoices as multipart and bumps batchCount on success', () => {
    const before = service.batchCount();
    service.uploadInvoices(
      fileList([new File(['%PDF-'], 'a.pdf', { type: 'application/pdf' })]),
    );
    expect(service.uploading()).toBe(true);

    const req = http.expectOne('/api/invoices');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush({ added: 1, skipped: [] });

    expect(service.uploading()).toBe(false);
    expect(service.uploadResult()).toEqual({ added: 1, skipped: [] });
    expect(service.batchCount()).toBe(before + 1);
  });

  it('flags an upload failure and clears the uploading state', () => {
    service.uploadInvoices(fileList([new File(['%PDF-'], 'a.pdf')]));
    const req = http.expectOne('/api/invoices');
    req.flush('nope', { status: 400, statusText: 'Bad Request' });

    expect(service.uploading()).toBe(false);
    expect(service.uploadError()).toBe('errInvoicesUpload');
  });

  it('clears the batch via DELETE and bumps batchCount', () => {
    const before = service.batchCount();
    service.clearBatch();

    const req = http.expectOne('/api/invoices');
    expect(req.request.method).toBe('DELETE');
    req.flush({ cleared: 2 });

    expect(service.batchCount()).toBe(before + 1);
  });
});
