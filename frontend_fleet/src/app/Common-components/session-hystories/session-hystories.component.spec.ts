import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionHystoriesComponent } from './session-hystories.component';

describe('SessionHystoriesComponent', () => {
  let component: SessionHystoriesComponent;
  let fixture: ComponentFixture<SessionHystoriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SessionHystoriesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SessionHystoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
