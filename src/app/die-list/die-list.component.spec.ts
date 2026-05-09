import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DieListComponent } from './die-list.component';

describe('DieListComponent', () => {
  let component: DieListComponent;
  let fixture: ComponentFixture<DieListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DieListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DieListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
