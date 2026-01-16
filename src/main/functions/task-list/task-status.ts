export const taskStatus: (fileName: string, documents: string[]) => string = (
  fileName: string,
  documents: string[]
) => {
  if (documents.includes(fileName)) {
    return 'Done';
  } else if (fileName === 'statement_of_costs_incurred_h.pdf') {
    return 'Available';
  } else if (fileName === 'position_statement_for_the_hearing.pdf') {
    return 'Optional';
  } else {
    return 'Not started yet';
  }
};
