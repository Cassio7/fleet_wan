import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationsFiltersComponent } from './notifications-filters.component';

describe('NotificationsFiltersComponent', () => {
  let component: NotificationsFiltersComponent;
  let fixture: ComponentFixture<NotificationsFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationsFiltersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationsFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
