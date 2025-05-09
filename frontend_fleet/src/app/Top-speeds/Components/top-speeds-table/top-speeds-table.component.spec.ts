import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopSpeedsTableComponent } from './top-speeds-table.component';

describe('TopSpeedsTableComponent', () => {
  let component: TopSpeedsTableComponent;
  let fixture: ComponentFixture<TopSpeedsTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopSpeedsTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopSpeedsTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
