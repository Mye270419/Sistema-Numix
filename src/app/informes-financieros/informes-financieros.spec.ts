import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InformesFinancieros } from './informes-financieros';

describe('InformesFinancieros', () => {
  let component: InformesFinancieros;
  let fixture: ComponentFixture<InformesFinancieros>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InformesFinancieros]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InformesFinancieros);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
