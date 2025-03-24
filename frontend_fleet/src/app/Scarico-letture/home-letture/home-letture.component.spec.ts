import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeLettureComponent } from './home-letture.component';

describe('HomeLettureComponent', () => {
  let component: HomeLettureComponent;
  let fixture: ComponentFixture<HomeLettureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeLettureComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeLettureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
