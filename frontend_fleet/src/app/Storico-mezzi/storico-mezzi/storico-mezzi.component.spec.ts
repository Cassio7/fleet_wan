import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoricoMezziComponent } from './storico-mezzi.component';

describe('StoricoMezziComponent', () => {
  let component: StoricoMezziComponent;
  let fixture: ComponentFixture<StoricoMezziComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoricoMezziComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoricoMezziComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
