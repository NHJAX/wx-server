const sum = require('../express-apps/weather-app');

test('Convert Wait Time String to Number', () => {
  expect(convertToWaittime("30 mins")).toBe(30);
});