import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UtentiTableComponent } from './utenti-table.component';

describe('UtentiTableComponent', () => {
  let component: UtentiTableComponent;
  let fixture: ComponentFixture<UtentiTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UtentiTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UtentiTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
