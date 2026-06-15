import { url, submitForm } from '../../src/util';

describe('util', () => {
  describe('url', () => {
    it('returns url with full path', () => {
      expect(url('xxx')).toBe('http://localhost:8080/xxx');
    });
  });

  describe('submitForm', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      fetchMock = vi.fn();
      (globalThis as any).fetch = fetchMock;
    });

    it('submits all data', async () => {
      fetchMock.mockResolvedValue({
        status: 200,
        json: () => Promise.resolve({ x: 'y' }),
      });

      await submitForm('POST', '/some-endpoint', { name: 'Test' }, (status, response) => {
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8080//some-endpoint');
        expect(fetchMock.mock.calls[0][1].method).toBe('POST');
        expect(fetchMock.mock.calls[0][1].body).toEqual(
          JSON.stringify({ name: 'Test' })
        );

        expect(status).toBe(200);
        expect(response).toEqual({ x: 'y' });
      });
    });

    it('works with No Content (204) responses', async () => {
      fetchMock.mockResolvedValue({ status: 204, json: () => Promise.resolve({}) });

      await submitForm('PUT', '/somewhere', { name: 'Test' }, (status, response) => {
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(status).toBe(204);
        expect(response).toEqual({});
      });
    });
  });
});
