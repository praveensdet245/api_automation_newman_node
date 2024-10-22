const { series } = require('gulp')
const utils = require('./utils.js')

const serviceName = "sample-service";

async function testCollection() {
    await utils.newmanRunAndNotifySlack(serviceName)
}

exports.runSampleService = series(testCollection);
// in series of actions we can add miultiple tasks



