import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoEditComponent } from './info-edit.component';

describe('InfoEditComponent', () => {
  let component: InfoEditComponent;
  let fixture: ComponentFixture<InfoEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfoEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
