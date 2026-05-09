import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputSortingComponent } from './input-sorting.component';

describe('InputSortingComponent', () => {
  let component: InputSortingComponent;
  let fixture: ComponentFixture<InputSortingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputSortingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InputSortingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
