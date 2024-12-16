import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoteSnackbarComponent } from './note-snackbar.component';

describe('NoteSnackbarComponent', () => {
  let component: NoteSnackbarComponent;
  let fixture: ComponentFixture<NoteSnackbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoteSnackbarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NoteSnackbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
