import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessioneGraphComponent } from './sessione-graph.component';

describe('SessioneGraphComponent', () => {
  let component: SessioneGraphComponent;
  let fixture: ComponentFixture<SessioneGraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessioneGraphComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessioneGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
