const { series } = require('gulp')
const utils = require('./utils.js')
let env = process.env.ENV;

async function uploadReport() {
    let runId = new Date().toISOString().split('.')[0].replace(/:/g, "-").replace(/T/g, "-");
    await utils.uploadReportFilesToGCPBucket(runId);
    await utils.notifySlack(runId);
}

async function emptyReportDirectory() {
    await utils.emptyReportDir();
}

exports.uploadReport = series(uploadReport);
exports.emptyReportDir = series(emptyReportDirectory);