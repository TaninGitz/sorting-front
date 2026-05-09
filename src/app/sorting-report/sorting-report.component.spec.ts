import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SortingReportComponent } from './sorting-report.component';

describe('SortingReportComponent', () => {
  let component: SortingReportComponent;
  let fixture: ComponentFixture<SortingReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SortingReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SortingReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
