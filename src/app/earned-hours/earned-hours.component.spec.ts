import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EarnedHoursComponent } from './earned-hours.component';

describe('EarnedHoursComponent', () => {
  let component: EarnedHoursComponent;
  let fixture: ComponentFixture<EarnedHoursComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EarnedHoursComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EarnedHoursComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
