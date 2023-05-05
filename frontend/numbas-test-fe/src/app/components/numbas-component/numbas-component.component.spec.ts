import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NumbasComponentComponent } from './numbas-component.component';

describe('NumbasComponentComponent', () => {
  let component: NumbasComponentComponent;
  let fixture: ComponentFixture<NumbasComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NumbasComponentComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NumbasComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
