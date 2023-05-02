import { TestBed } from '@angular/core/testing';

import { NumbasService } from './numbas.service';

describe('NumbasService', () => {
  let service: NumbasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NumbasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
