/**
 * @jest-environment jsdom
 */

describe('disable-upon-submit', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetModules();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    jest.useRealTimers();
    document.body.innerHTML = '';
  });

  it('prevents a second click during debounce window', async () => {
    document.body.innerHTML = '<button class="disable-upon-submit" type="submit">Submit</button>';
    await import('../../../main/js/disable-upon-submit');

    const button = document.querySelector('button') as HTMLButtonElement;

    const firstClick = new MouseEvent('click', { bubbles: true, cancelable: true });
    const secondClick = new MouseEvent('click', { bubbles: true, cancelable: true });

    const firstDispatchResult = button.dispatchEvent(firstClick);
    const secondDispatchResult = button.dispatchEvent(secondClick);

    expect(firstClick.defaultPrevented).toBe(false);
    expect(firstDispatchResult).toBe(true);
    expect(secondClick.defaultPrevented).toBe(true);
    expect(secondDispatchResult).toBe(false);
  });

  it('allows submit again after debounce timeout expires', async () => {
    document.body.innerHTML = '<button class="disable-upon-submit" type="submit">Submit</button>';
    await import('../../../main/js/disable-upon-submit');

    const button = document.querySelector('button') as HTMLButtonElement;

    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    jest.advanceTimersByTime(10_001);

    const thirdClick = new MouseEvent('click', { bubbles: true, cancelable: true });
    const thirdDispatchResult = button.dispatchEvent(thirdClick);

    expect(thirdClick.defaultPrevented).toBe(false);
    expect(thirdDispatchResult).toBe(true);
  });
});
