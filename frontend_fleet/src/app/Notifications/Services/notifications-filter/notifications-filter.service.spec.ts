import { TestBed } from '@angular/core/testing';

import { NotificationsFilterService } from './notifications-filter.service';

describe('NotificationsFilterService', () => {
  let service: NotificationsFilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationsFilterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
