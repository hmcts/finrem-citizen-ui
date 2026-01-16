const jsonData = require('../../views/config/task-list/standard-form-c-items.json');

export const taskListWarningMessage: (firstHearingDate: string, documents: string[]) => boolean = (
  firstHearingDate: string,
  documents: string[]
) => {
  const hearingDate = new Date(firstHearingDate);
  const currentDate = new Date();
  // Calculate difference in milliseconds
  const diffInMs = hearingDate.getTime() - currentDate.getTime();
  // Convert to days
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  // Define the order of checks
  const checkGroups = [];

  if (diffInDays >= 35) {
    return false;
  }
  // Add groups cumulatively based on how close the date is
  if (diffInDays < 35) {
    checkGroups.push(...jsonData.offset35);
  }
  if (diffInDays < 14) {
    checkGroups.push(...jsonData.offset14);
  }
  if (diffInDays < 7) {
    checkGroups.push(...jsonData.offset7);
  }
  if (diffInDays < 2) {
    checkGroups.push(...jsonData.offset2);
  }

  // Check if ALL tasks in the combined list are completed
  return !checkGroups.every(task => {
    if (typeof task.required === 'undefined' || task.required === true) {
      return documents.includes(task.fileName);
    } else {
      return true;
    }
  });
};
