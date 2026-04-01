declare namespace jest {
  interface Matchers<R> {
    includes(expected: string): R;
  }
}
