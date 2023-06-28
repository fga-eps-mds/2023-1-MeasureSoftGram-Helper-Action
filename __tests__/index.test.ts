function sum(a, b) {
    return a + b;
}

test('sum function should add two numbers correctly', () => {
    expect(sum(1, 1)).toBe(2);
});