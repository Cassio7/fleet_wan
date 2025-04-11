import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeWorksiteComponent } from './change-worksite.component';

describe('ChangeWorksiteComponent', () => {
  let component: ChangeWorksiteComponent;
  let fixture: ComponentFixture<ChangeWorksiteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChangeWorksiteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChangeWorksiteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
