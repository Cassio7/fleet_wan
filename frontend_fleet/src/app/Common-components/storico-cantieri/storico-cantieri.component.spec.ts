import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StoricoCantieriComponent } from './storico-cantieri.component';

describe('StoricoCantieriComponent', () => {
  let component: StoricoCantieriComponent;
  let fixture: ComponentFixture<StoricoCantieriComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StoricoCantieriComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StoricoCantieriComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
