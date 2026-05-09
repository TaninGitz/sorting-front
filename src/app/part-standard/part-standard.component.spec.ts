import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartStandardComponent } from './part-standard.component';

describe('PartStandardComponent', () => {
  let component: PartStandardComponent;
  let fixture: ComponentFixture<PartStandardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PartStandardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartStandardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
