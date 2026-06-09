import { ComponentFixture, TestBed } from '@angular/core/testing';
import { App } from './app';
import { AuthService } from './services/auth.service';
import { provideRouter } from '@angular/router';

describe('App', () => {
  let component: App;
  let fixture: ComponentFixture<App>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [AuthService, provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('renders the navbar', () => {
    expect(fixture.nativeElement.querySelector('app-navbar')).toBeTruthy();
  });

  it('renders the router outlet', () => {
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
  });

  it('has auth service injected', () => {
    expect(component.auth).toBeTruthy();
    expect(component.auth).toBeInstanceOf(AuthService);
  });
});
