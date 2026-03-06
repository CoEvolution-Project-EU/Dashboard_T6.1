import { TestBed } from '@angular/core/testing';

import { CasesOverviewService } from './cases-overview.service';

describe('CasesOverviewService', () => {
  let service: CasesOverviewService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CasesOverviewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
