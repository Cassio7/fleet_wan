import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KebabMenuComponent } from './kebab-menu.component';

describe('KebabMenuComponent', () => {
  let component: KebabMenuComponent;
  let fixture: ComponentFixture<KebabMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KebabMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KebabMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
