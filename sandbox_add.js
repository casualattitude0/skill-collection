function add(a, b) {
  return a - b; // BUG: should be a + b
}
module.exports = { add };
