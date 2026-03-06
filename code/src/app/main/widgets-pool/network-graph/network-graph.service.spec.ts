import { TestBed } from '@angular/core/testing';

import { NetworkGraphService } from './network-graph.service';

describe('NetworkGraphService', () => {
  let service: NetworkGraphService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NetworkGraphService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
