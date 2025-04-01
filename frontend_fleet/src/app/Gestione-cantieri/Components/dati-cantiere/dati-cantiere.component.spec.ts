import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatiCantiereComponent } from './dati-cantiere.component';

describe('DatiCantiereComponent', () => {
  let component: DatiCantiereComponent;
  let fixture: ComponentFixture<DatiCantiereComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DatiCantiereComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DatiCantiereComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
