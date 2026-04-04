import { HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

const mockResponse = () => {
  const res: Record<string, jest.Mock> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockRequest = (url = '/test', method = 'GET') => ({ url, method });

const mockHost = (req: object, res: object) =>
  ({
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => res,
    }),
  }) as any;

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
  });

  it('returns the correct status code', () => {
    const res = mockResponse();
    filter.catch(
      new HttpException('Not Found', HttpStatus.NOT_FOUND),
      mockHost(mockRequest(), res),
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('includes path and timestamp in the response body', () => {
    const res = mockResponse();
    filter.catch(
      new HttpException('Bad Request', HttpStatus.BAD_REQUEST),
      mockHost(mockRequest('/venues', 'POST'), res),
    );
    const body = res.json.mock.calls[0][0];
    expect(body.path).toBe('/venues');
    expect(body.timestamp).toBeDefined();
  });

  it('unwraps message from object exception response', () => {
    const res = mockResponse();
    filter.catch(
      new HttpException({ message: ['field is required'] }, HttpStatus.BAD_REQUEST),
      mockHost(mockRequest(), res),
    );
    const body = res.json.mock.calls[0][0];
    expect(body.message).toEqual(['field is required']);
  });

  it('handles plain string exception response', () => {
    const res = mockResponse();
    filter.catch(
      new HttpException('Forbidden', HttpStatus.FORBIDDEN),
      mockHost(mockRequest(), res),
    );
    const body = res.json.mock.calls[0][0];
    expect(body.message).toBe('Forbidden');
    expect(body.statusCode).toBe(403);
  });
});
