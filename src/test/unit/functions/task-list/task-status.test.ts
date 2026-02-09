import { taskStatus } from '../../../../main/functions/task-list/task-status';

describe('taskStatus tests', () => {
  const documents = ['file1', 'file2', 'file3'];
  it('should return Done status', () => {
    const status = taskStatus('file1', documents);
    expect(status).toEqual('Done');
  });
  it('should return Not started yet status', () => {
    const status = taskStatus('file', documents);
    expect(status).toEqual('Not started yet');
  });
  it('should return Available status', () => {
    const status = taskStatus('statement_of_costs_incurred_h.pdf', documents);
    expect(status).toEqual('Available');
  });
  it('should return Optional status', () => {
    const status = taskStatus('position_statement_for_the_hearing.pdf', documents);
    expect(status).toEqual('Optional');
  });
});
