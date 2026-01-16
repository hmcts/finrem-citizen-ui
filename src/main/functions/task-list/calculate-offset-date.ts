const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const offsetDate: (date: string, offset: number) => string = (date: string, offset: number) => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() - offset);
  return newDate.getDate() + ' ' + months[newDate.getMonth()] + ' ' + newDate.getFullYear();
};
