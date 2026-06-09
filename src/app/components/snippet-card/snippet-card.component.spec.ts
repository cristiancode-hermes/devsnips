import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SnippetCardComponent } from './snippet-card.component';
import { Snippet } from '../../models/snippet';
import { provideRouter } from '@angular/router';

const mockSnippet: Snippet = {
  id: 'snp_1',
  user_id: 'user_1',
  title: 'My Snippet',
  description: 'A cool code snippet',
  code: 'const x = 42;',
  language: 'javascript',
  tags: ['demo', 'test'],
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

describe('SnippetCardComponent', () => {
  let component: SnippetCardComponent;
  let fixture: ComponentFixture<SnippetCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnippetCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SnippetCardComponent);
    component = fixture.componentInstance;
    component.snippet = mockSnippet;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('renders the snippet title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('My Snippet');
  });

  it('renders the language badge', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('javascript');
  });

  it('renders the description', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('A cool code snippet');
  });

  it('renders a preview of the code', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const pre = compiled.querySelector('pre');
    expect(pre).toBeTruthy();
    expect(pre!.textContent).toContain('const x = 42;');
  });

  it('renders all tags', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('demo');
    expect(compiled.textContent).toContain('test');
  });

  it('has a link to the snippet detail page', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Ver más');
  });

  it('truncates code to 200 chars', () => {
    const longCode = 'a'.repeat(500);
    component.snippet = { ...mockSnippet, code: longCode };
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const pre = compiled.querySelector('pre');
    expect(pre!.textContent!.length).toBeLessThanOrEqual(200);
  });
});

describe('SnippetCardComponent without description', () => {
  let component: SnippetCardComponent;
  let fixture: ComponentFixture<SnippetCardComponent>;
  const snippetNoDesc: Snippet = {
    ...mockSnippet,
    description: undefined,
    tags: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnippetCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SnippetCardComponent);
    component = fixture.componentInstance;
    component.snippet = snippetNoDesc;
    fixture.detectChanges();
  });

  it('renders without description', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('My Snippet');
  });
});
