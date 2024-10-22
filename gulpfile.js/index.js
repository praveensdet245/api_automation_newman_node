const { series } = require('gulp')
const sampleService = require('./sample-service')
const uploadReport = require('./uploadReport')

exports.uploadReport = uploadReport.uploadReport
exports.emptyReports = uploadReport.emptyReportDir;
exports.runSampleService = sampleService.runSampleService;


function getTaskByName(taskName) {
    if (exports[taskName]) {
        return exports[taskName];
    } else {
        throw new Error(`Task "${taskName}" not found.`);
    }
}

function executeSpecificTask(done) {
    const taskName = process.env.TASK_NAME;
    const selectedTask = getTaskByName(taskName);
    return selectedTask(done);
}

exports.runSpecificTask = series(exports.emptyReports,executeSpecificTask,exports.uploadReport);

exports.default = series(
    exports.emptyReports,
    exports.runSampleService,
    exports.uploadReport
)
