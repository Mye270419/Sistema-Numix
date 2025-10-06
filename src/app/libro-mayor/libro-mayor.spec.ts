import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LibroMayor } from './libro-mayor';

describe('LibroMayor', () => {
  let component: LibroMayor;
  let fixture: ComponentFixture<LibroMayor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LibroMayor]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LibroMayor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
