import fs from 'fs';

import { NextFunction, Request, Response } from 'express';

import taskListUploadRoute from '../../../main/routes/task-list-upload';

jest.mock('fs');

describe('routes/task-list-upload', () => {
  let getHandler: (req: Request, res: Response, next: NextFunction) => void;

  beforeEach(() => {
    const app: any = {
      get: jest.fn((_path: string, handler: any) => {
        getHandler = handler;
      }),
    };
    taskListUploadRoute(app);
  });

  it('should render task-list-upload-dashboard with parsed JSON data', () => {
    const mockData = { tasks: [{ name: 'task1' }] };
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockData));

    const req = {} as Request;
    const res = { render: jest.fn() } as unknown as Response;
    const next = jest.fn();

    getHandler(req, res, next);

    expect(res.render).toHaveBeenCalledWith('task-list-upload-dashboard', mockData);
  });

  it('should call next and render error when file read fails', () => {
    const error = new Error('File not found');
    (fs.readFileSync as jest.Mock).mockImplementation(() => {
      throw error;
    });

    const req = {} as Request;
    const res = { render: jest.fn() } as unknown as Response;
    const next = jest.fn();

    getHandler(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.render).toHaveBeenCalledWith('error', {});
  });
});
