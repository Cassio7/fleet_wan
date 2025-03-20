import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UtentiCreateDialogComponent } from './utenti-create-dialog.component';

describe('UtentiCreateDialogComponent', () => {
  let component: UtentiCreateDialogComponent;
  let fixture: ComponentFixture<UtentiCreateDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UtentiCreateDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UtentiCreateDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
