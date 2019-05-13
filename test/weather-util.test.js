const sum = require('../util/weather-util');

test('Calculate WBGT', () => {
    var expectedWBGTObj = {
        wbgtC: 23.406322545360823,
        wbgtF: 74
    }

    var wbgtObj = {
        temperatureAvg: 26,
        humidty: 73,
        AWOS: {
            wind_speed_mps: 3
        }

    }
  expect(calculateWBGT(wbgtObj)).toBe(expectedWBGTObj);
});