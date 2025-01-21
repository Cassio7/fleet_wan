import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DettaglioMezzoComponent } from './dettaglio-mezzo.component';

describe('DettaglioMezzoComponent', () => {
  let component: DettaglioMezzoComponent;
  let fixture: ComponentFixture<DettaglioMezzoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DettaglioMezzoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DettaglioMezzoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
