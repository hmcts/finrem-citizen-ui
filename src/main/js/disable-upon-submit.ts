const DISABLE_UPON_SUBMIT = 'disable-upon-submit';
const DEBOUNCE_TIMEOUT_IN_SECONDS = 10;

let debounceFormSubmitTimer: undefined | ReturnType<typeof setTimeout>;

const submitButtons = document.getElementsByClassName(DISABLE_UPON_SUBMIT);

Array.from(submitButtons).forEach(button => {
  button?.addEventListener('click', event => {
    if (debounceFormSubmitTimer) {
      event.preventDefault();
      return false;
    }

    debounceFormSubmitTimer = setTimeout(() => {
      debounceFormSubmitTimer = undefined;
    }, DEBOUNCE_TIMEOUT_IN_SECONDS * 1000);

    return true;
  });
});

export {};
