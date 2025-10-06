import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CuentasCobrar } from './cuentas-cobrar';

describe('CuentasCobrar', () => {
  let component: CuentasCobrar;
  let fixture: ComponentFixture<CuentasCobrar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CuentasCobrar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CuentasCobrar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
