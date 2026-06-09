import { SnippetService } from './snippet.service';
import { Snippet } from '../models/snippet';

function createMockResponse(data: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
    bytes: () => Promise.resolve(new Uint8Array()),
    headers: new Headers(),
    redirected: false,
    statusText: ok ? 'OK' : 'Error',
    type: 'basic' as ResponseType,
    url: '',
    clone: () => createMockResponse(data, ok, status),
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
  };
}

const mockSnippets: Snippet[] = [
  {
    id: '1',
    user_id: 'user_abc',
    title: 'Test Snippet',
    description: 'A test snippet',
    code: 'console.log("hello")',
    language: 'javascript',
    tags: ['test', 'util'],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: '2',
    user_id: 'user_abc',
    title: 'Python Sort',
    description: null as unknown as undefined,
    code: 'sorted(list)',
    language: 'python',
    tags: [],
    created_at: '2026-01-02T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
  },
];

describe('SnippetService', () => {
  let service: SnippetService;
  let originalFetch: typeof globalThis.fetch;

  beforeAll(() => {
    originalFetch = globalThis.fetch;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  beforeEach(() => {
    localStorage.clear();
    service = new SnippetService();
    // Default: fetch is mocked with success response
    globalThis.fetch = vi.fn().mockResolvedValue(createMockResponse(mockSnippets));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAll', () => {
    it('calls GET /api/snippets', async () => {
      await service.getAll();
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/snippets',
        expect.any(Object),
      );
    });

    it('returns a list of snippets', async () => {
      const result = await service.getAll();
      expect(result).toEqual(mockSnippets);
      expect(result.length).toBe(2);
    });

    it('throws on network error', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));
      await expect(service.getAll()).rejects.toThrow('Network failure');
    });

    it('throws on non-ok response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        createMockResponse({ error: 'Server error' }, false, 500),
      );
      await expect(service.getAll()).rejects.toThrow('Failed to fetch snippets');
    });

    it('includes Authorization header when token exists', async () => {
      localStorage.setItem('devsnips_token', 'my_jwt_token');
      await service.getAll();
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/snippets',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my_jwt_token',
          }),
        }),
      );
    });
  });

  describe('getById', () => {
    it('calls GET /api/snippets/:id', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(createMockResponse(mockSnippets[0]));
      await service.getById('1');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/snippets/1',
        expect.any(Object),
      );
    });

    it('returns a single snippet', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(createMockResponse(mockSnippets[0]));
      const result = await service.getById('1');
      expect(result).toEqual(mockSnippets[0]);
      expect(result.title).toBe('Test Snippet');
    });

    it('throws when snippet is not found', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        createMockResponse({ error: 'Not found' }, false, 404),
      );
      await expect(service.getById('999')).rejects.toThrow('Snippet not found');
    });
  });

  describe('create', () => {
    const dto = {
      title: 'New Snippet',
      code: 'print("new")',
      language: 'python',
      tags: ['new'],
    };

    it('calls POST /api/snippets with body', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(createMockResponse({ ...dto, id: '3' }));
      await service.create(dto);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/snippets',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(dto),
        }),
      );
    });

    it('returns the created snippet with id', async () => {
      const created = { ...dto, id: '3', user_id: 'user_abc', created_at: '', updated_at: '' };
      globalThis.fetch = vi.fn().mockResolvedValue(createMockResponse(created));
      const result = await service.create(dto);
      expect(result.id).toBe('3');
    });

    it('throws on create failure', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        createMockResponse({ error: 'Bad request' }, false, 400),
      );
      await expect(service.create(dto)).rejects.toThrow('Failed to create snippet');
    });
  });

  describe('update', () => {
    const updates = { title: 'Updated Title' };

    it('calls PUT /api/snippets/:id with body', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        createMockResponse({ ...mockSnippets[0], ...updates }),
      );
      await service.update('1', updates);
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/snippets/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updates),
        }),
      );
    });

    it('throws on update failure', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        createMockResponse({ error: 'Forbidden' }, false, 403),
      );
      await expect(service.update('1', updates)).rejects.toThrow('Failed to update snippet');
    });
  });

  describe('delete', () => {
    it('calls DELETE /api/snippets/:id', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(createMockResponse(null));
      await service.delete('1');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/snippets/1',
        expect.objectContaining({
          method: 'DELETE',
        }),
      );
    });

    it('does not throw on successful delete', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(createMockResponse(null));
      await expect(service.delete('1')).resolves.toBeUndefined();
    });
  });

  describe('headers method', () => {
    it('includes Content-Type in POST/PUT', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(createMockResponse({ id: '3' }));
      await service.create({ title: 'x', code: 'y', language: 'z', tags: [] });

      const callArgs = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
      expect(callArgs.headers['Content-Type']).toBe('application/json');
    });
  });
});
