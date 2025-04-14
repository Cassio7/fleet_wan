import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SocietaCreateDialogComponent } from './societa-create-dialog.component';

describe('SocietaCreateDialogComponent', () => {
  let component: SocietaCreateDialogComponent;
  let fixture: ComponentFixture<SocietaCreateDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SocietaCreateDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SocietaCreateDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
