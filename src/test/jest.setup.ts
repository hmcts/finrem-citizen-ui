expect.extend({
  includes(received: unknown, expected: unknown) {
    const receivedString = String(received);
    const expectedString = String(expected);
    const pass = receivedString.includes(expectedString);

    return {
      pass,
      message: () =>
        pass
          ? `expected value not to include ${expectedString}`
          : `expected value to include ${expectedString}, but got ${receivedString}`,
    };
  },
});
