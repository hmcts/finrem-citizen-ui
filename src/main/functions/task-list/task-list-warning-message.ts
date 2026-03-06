const jsonData = require('../../views/config/task-list/standard-form-c-items.json');

interface TaskItem {
  required?: boolean;
  fileName: string;
}

export const taskListWarningMessage: (firstHearingDate: string, documents: string[]) => boolean = (
  firstHearingDate: string,
  documents: string[]
) => {
  const hearingDate = new Date(firstHearingDate);
  const currentDate = new Date();

  const diffInMs = hearingDate.getTime() - currentDate.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  // FIX: Explicitly type the array so it isn't 'never[]'
  const checkGroups: TaskItem[] = [];

  if (diffInDays >= 35) {
    return false;
  }

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

  return !checkGroups.every((task: TaskItem) => {
    // TypeScript now knows 'required' and 'fileName' exist
    if (typeof task.required === 'undefined' || task.required === true) {
      return documents.includes(task.fileName);
    } else {
      return true;
    }
  });
};
