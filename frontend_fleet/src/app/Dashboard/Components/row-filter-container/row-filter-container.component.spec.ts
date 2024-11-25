import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RowFilterContainerComponent } from './row-filter-container.component';

describe('RowFilterContainerComponent', () => {
  let component: RowFilterContainerComponent;
  let fixture: ComponentFixture<RowFilterContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RowFilterContainerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RowFilterContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
