import {
  afterEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  AiProviderHttpTransportError,
} from '../errors/ai-provider-http-transport.error';
import {
  FetchAiProviderHttpTransportService,
} from './fetch-ai-provider-http-transport.service';

describe(
  'Fetch AI provider HTTP transport',
  () => {
    const originalFetch =
      global.fetch;

    afterEach(
      () => {
        global.fetch =
          originalFetch;

        jest.restoreAllMocks();
      },
    );

    const createResponse =
      (options: {
        status?: number;
        body?: string;
        contentType?: string;
      } = {}): Response =>
        new Response(
          options.body ??
            JSON.stringify({
              ok:
                true,
            }),
          {
            status:
              options.status ??
              200,
            headers: {
              'content-type':
                options.contentType ??
                'application/json',
              'x-request-id':
                'request-1',
            },
          },
        );

    it(
      'executes a JSON POST request',
      async () => {
        const fetchMock =
          jest.fn(
            async (
              _input:
                string |
                URL |
                Request,
              _init?:
                RequestInit,
            ): Promise<Response> =>
              createResponse({
                body:
                  JSON.stringify({
                    result:
                      'success',
                  }),
              }),
          );

        global.fetch =
          fetchMock as typeof fetch;

        const service =
          new FetchAiProviderHttpTransportService();

        const response =
          await service.execute<{
            result: string;
          }>({
            providerName:
              ' OpenAI ',
            url:
              'https://example.test/v1/chat',
            method:
              'POST',
            headers: {
              Authorization:
                'Bearer private-value',
            },
            body: {
              messages: [],
            },
            timeoutMs:
              1_000,
          });

        expect(
          response,
        ).toEqual(
          expect.objectContaining({
            providerName:
              'openai',
            status:
              200,
            ok:
              true,
            data: {
              result:
                'success',
            },
          }),
        );

        expect(
          fetchMock,
        ).toHaveBeenCalledTimes(
          1,
        );

        const [
          calledUrl,
          calledOptions,
        ] =
          fetchMock.mock
            .calls[0];

        expect(
          calledUrl,
        ).toBe(
          'https://example.test/v1/chat',
        );

        expect(
          calledOptions,
        ).toEqual(
          expect.objectContaining({
            method:
              'POST',
            body:
              JSON.stringify({
                messages: [],
              }),
          }),
        );
      },
    );

    it(
      'adds JSON content type when a body is present',
      async () => {
        const fetchMock =
          jest.fn(
            async (
              _url: string,
              options?: RequestInit,
            ) => {
              expect(
                options
                  ?.headers,
              ).toEqual(
                expect.objectContaining({
                  'content-type':
                    'application/json',
                }),
              );

              return createResponse();
            },
          );

        global.fetch =
          fetchMock as typeof fetch;

        const service =
          new FetchAiProviderHttpTransportService();

        await service.execute({
          providerName:
            'provider',
          url:
            'https://example.test',
          method:
            'POST',
          body: {
            value:
              1,
          },
          timeoutMs:
            1_000,
        });
      },
    );

    it(
      'returns plain text for non-JSON content',
      async () => {
        global.fetch =
          jest.fn(
            async () =>
              createResponse({
                body:
                  'plain response',
                contentType:
                  'text/plain',
              }),
          ) as typeof fetch;

        const service =
          new FetchAiProviderHttpTransportService();

        const response =
          await service.execute<string>({
            providerName:
              'provider',
            url:
              'https://example.test',
            method:
              'GET',
            timeoutMs:
              1_000,
          });

        expect(
          response.data,
        ).toBe(
          'plain response',
        );
      },
    );

    it(
      'returns undefined for an empty response body',
      async () => {
        global.fetch =
          jest.fn(
            async () =>
              new Response(
                null,
                {
                  status:
                    204,
                },
              ),
          ) as typeof fetch;

        const service =
          new FetchAiProviderHttpTransportService();

        const response =
          await service.execute({
            providerName:
              'provider',
            url:
              'https://example.test',
            method:
              'DELETE',
            timeoutMs:
              1_000,
          });

        expect(
          response.data,
        ).toBeUndefined();
      },
    );

    it(
      'rejects an invalid URL before calling fetch',
      async () => {
        const fetchMock =
          jest.fn();

        global.fetch =
          fetchMock as typeof fetch;

        const service =
          new FetchAiProviderHttpTransportService();

        await expect(
          service.execute({
            providerName:
              'provider',
            url:
              'file:///tmp/provider',
            method:
              'GET',
            timeoutMs:
              1_000,
          }),
        ).rejects.toMatchObject({
          code:
            'INVALID_REQUEST',
          retriable:
            false,
        });

        expect(
          fetchMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects an invalid timeout before calling fetch',
      async () => {
        const fetchMock =
          jest.fn();

        global.fetch =
          fetchMock as typeof fetch;

        const service =
          new FetchAiProviderHttpTransportService();

        await expect(
          service.execute({
            providerName:
              'provider',
            url:
              'https://example.test',
            method:
              'GET',
            timeoutMs:
              0,
          }),
        ).rejects.toMatchObject({
          code:
            'INVALID_REQUEST',
        });

        expect(
          fetchMock,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'classifies retryable HTTP failures',
      async () => {
        global.fetch =
          jest.fn(
            async () =>
              createResponse({
                status:
                  429,
                body:
                  'rate limited',
                contentType:
                  'text/plain',
              }),
          ) as typeof fetch;

        const service =
          new FetchAiProviderHttpTransportService();

        await expect(
          service.execute({
            providerName:
              'provider',
            url:
              'https://example.test',
            method:
              'POST',
            timeoutMs:
              1_000,
          }),
        ).rejects.toMatchObject({
          code:
            'HTTP_STATUS_ERROR',
          status:
            429,
          retriable:
            true,
        });
      },
    );

    it(
      'classifies non-retryable HTTP failures',
      async () => {
        global.fetch =
          jest.fn(
            async () =>
              createResponse({
                status:
                  400,
                body:
                  'bad request',
                contentType:
                  'text/plain',
              }),
          ) as typeof fetch;

        const service =
          new FetchAiProviderHttpTransportService();

        await expect(
          service.execute({
            providerName:
              'provider',
            url:
              'https://example.test',
            method:
              'POST',
            timeoutMs:
              1_000,
          }),
        ).rejects.toMatchObject({
          code:
            'HTTP_STATUS_ERROR',
          status:
            400,
          retriable:
            false,
        });
      },
    );

    it(
      'normalizes network failures without exposing their raw message',
      async () => {
        global.fetch =
          jest.fn(
            async () => {
              throw new Error(
                'private network diagnostic',
              );
            },
          ) as typeof fetch;

        const service =
          new FetchAiProviderHttpTransportService();

        try {
          await service.execute({
            providerName:
              'provider',
            url:
              'https://example.test',
            method:
              'GET',
            timeoutMs:
              1_000,
          });

          throw new Error(
            'Expected transport failure',
          );
        } catch (error) {
          expect(
            error,
          ).toBeInstanceOf(
            AiProviderHttpTransportError,
          );

          expect(
            error,
          ).toMatchObject({
            code:
              'NETWORK_ERROR',
            retriable:
              true,
          });

          expect(
            String(
              error,
            ),
          ).not.toContain(
            'private network diagnostic',
          );
        }
      },
    );

    it(
      'fails with a timeout when fetch does not complete',
      async () => {
        global.fetch =
          jest.fn(
            (
              _url: string,
              options?: RequestInit,
            ) =>
              new Promise<Response>(
                (
                  _resolve,
                  reject,
                ) => {
                  options
                    ?.signal
                    ?.addEventListener(
                      'abort',
                      () => {
                        const error =
                          new Error(
                            'aborted',
                          );

                        error.name =
                          'AbortError';

                        reject(
                          error,
                        );
                      },
                    );
                },
              ),
          ) as typeof fetch;

        const service =
          new FetchAiProviderHttpTransportService();

        await expect(
          service.execute({
            providerName:
              'provider',
            url:
              'https://example.test',
            method:
              'GET',
            timeoutMs:
              1,
          }),
        ).rejects.toMatchObject({
          code:
            'TIMEOUT',
          retriable:
            true,
          timeoutMs:
            1,
        });
      },
    );

    it(
      'rejects malformed JSON responses',
      async () => {
        global.fetch =
          jest.fn(
            async () =>
              createResponse({
                body:
                  '{invalid-json',
                contentType:
                  'application/json',
              }),
          ) as typeof fetch;

        const service =
          new FetchAiProviderHttpTransportService();

        await expect(
          service.execute({
            providerName:
              'provider',
            url:
              'https://example.test',
            method:
              'GET',
            timeoutMs:
              1_000,
          }),
        ).rejects.toMatchObject({
          code:
            'INVALID_JSON_RESPONSE',
          retriable:
            false,
        });
      },
    );

    it(
      'does not include response bodies in HTTP errors',
      async () => {
        global.fetch =
          jest.fn(
            async () =>
              createResponse({
                status:
                  500,
                body:
                  'private-provider-response',
                contentType:
                  'text/plain',
              }),
          ) as typeof fetch;

        const service =
          new FetchAiProviderHttpTransportService();

        try {
          await service.execute({
            providerName:
              'provider',
            url:
              'https://example.test',
            method:
              'GET',
            timeoutMs:
              1_000,
          });

          throw new Error(
            'Expected HTTP failure',
          );
        } catch (error) {
          expect(
            String(
              error,
            ),
          ).not.toContain(
            'private-provider-response',
          );
        }
      },
    );
  },
);
