import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfilePswResetComponent } from './profile-psw-reset.component';

describe('ProfilePswResetComponent', () => {
  let component: ProfilePswResetComponent;
  let fixture: ComponentFixture<ProfilePswResetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfilePswResetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfilePswResetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
