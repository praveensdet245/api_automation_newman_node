const util = require('util')
const readFileSync = require('fs');
const fs = require("fs").promises;
const { json } = require('express');
const exec = util.promisify(require('child_process').exec)
let env = process.env.ENV;
let host = process.env.HOST;
const moment = require('moment')
const webhookurls = require('./webhooks')
const { Storage } = require('@google-cloud/storage');
const storage = new Storage();
const bucketNameDev = '<bucketName>';
const bucketNameQa = '<bucketName>';
const bucketNameProd = '<bucketName>';
const appRoot = require('app-root-path');
const path = require('path')
const fsExtra = require('fs-extra');
var reportsPath = path.join(appRoot + "/newman");
const newman = require('newman')
const slackWebHookUrl = webhookurls.sampleService;

var Utils = {

    setEnv: async (env) => {
        executionOnEnv = env
    },

    getGlobalEnvFile: async => {
        let globalEnvFile = null;
        if(env == 'prod') {
            globalEnvFile = `workspace_prod.postman_globals.json`
        }else if(env == 'dev') {
            globalEnvFile = `workspace_dev.postman_globals.json`
        }else {
            globalEnvFile = `workspace_qa.postman_globals.json`
        }

        if (host == 'docker') {
            return `/app/tests/global/${globalEnvFile}`;
        } else {
            return `tests/global/${globalEnvFile}`;
        }
    },

    getReportsPath: async => {
        if (host == 'docker') {
            return '/app/newman/';
        } else {
            return 'newman/';
        }
    },

    getEnv: async () => {
        return executionOnEnv.toString();
    },

    getCollectionPath: async function (serviceName) {
        let colletionPath;
        if (host == 'docker') {
            colletionPath = `/app/tests/` + serviceName + `/` + serviceName + `.postman_collection.json`;
        } else {
            colletionPath = `tests/` + serviceName + `/` + serviceName + `.postman_collection.json`;
        }
        console.log("collection file path : " + colletionPath)
        return colletionPath
    },

    getCollectionEnvFilePath: async function (serviceName) {
        let envFilePath;
        if (host == 'docker') {
            envFilePath = `/app/tests/` + serviceName + `/env/` + serviceName + `.postman_environment.json`;
        } else {
            envFilePath = `tests/` + serviceName + `/env/` + serviceName + `.postman_environment.json`;
        }
        console.log("environment file path : " + envFilePath)
        return envFilePath
    },

    getNewmanCmdWithSlackAlert: async (serviceName, collectionFilePath, envFilePath, isHTMLReport) => {
        if (isHTMLReport) {
            if (host == 'docker') {
                return `newman run ${collectionFilePath} -e ${envFilePath} -g ${Utils.getGlobalEnvFile()} -r cli,htmlextra  --reporter-htmlextra-export "/app/newman/` + serviceName.toString() + `_` + moment().format() + `-testReport.html"`
            } else {
                return `newman run ${collectionFilePath} -e ${envFilePath} -g ${Utils.getGlobalEnvFile()} -r cli,htmlextra  --reporter-htmlextra-export "newman/` + serviceName.toString() + `_` + moment().format() + `-testReport.html"`
            }
        } else {
            return `newman run ${collectionFilePath} -e ${envFilePath} -g ${Utils.getGlobalEnvFile()}`
        }
    },

    getNewmanCmdWithDataFile: function (collectionPath, dataFilePath, envFilePath, isHTMLReport) {
        if (isHTMLReport) {
            return `newman run ${collectionPath} -e ${envFilePath} -d ${dataFilePath} -g ${Utils.getGlobalEnvFile()} -r htmlextra,cli --export-environment ${envFilePath}`
        } else {
            return `newman run ${collectionPath} -e ${envFilePath} -d ${dataFilePath} -g ${Utils.getGlobalEnvFile()} --export-environment ${envFilePath}`
        }
    },

    getNewmanCmdWithDataFileForFolder: function (serviceName,collectionPath, dataFilePath, envFilePath, requestFolder, isHTMLReport) {
        if (isHTMLReport) {
            if (host == 'docker') {
               return `newman run ${collectionPath} -e ${envFilePath} -d ${dataFilePath} --folder ${requestFolder} -g ${Utils.getGlobalEnvFile()} -r htmlextra,cli --reporter-htmlextra-export "/app/newman/${serviceName}_${requestFolder}_${moment().format()}.html" --export-environment ${envFilePath}`
            } else {
                return `newman run ${collectionPath} -e ${envFilePath} -d ${dataFilePath} --folder ${requestFolder} -g ${Utils.getGlobalEnvFile()} -r htmlextra,cli --reporter-htmlextra-export "newman/${serviceName}_${requestFolder}_${moment().format()}.html" --export-environment ${envFilePath}`
            }
        } else {
            return `newman run ${collectionPath} -e ${envFilePath} -d ${dataFilePath} --folder ${requestFolder} -g ${Utils.getGlobalEnvFile()} --export-environment ${envFilePath}`
        }
    },

    getRunCmdWithoutDataFile: function (serviceName, collectionPath, envFilePath, requestFolder, isHTMLReport) {
        if (isHTMLReport) {
            if (host == 'docker') {
                return `newman run ${collectionPath} -e ${envFilePath} -g ${Utils.getGlobalEnvFile()} --folder ${requestFolder} -r htmlextra,cli --reporter-htmlextra-export "/app/newman/${serviceName}_${requestFolder}_${moment().format()}.html" --export-environment ${envFilePath}`;
            } else {
                return `newman run ${collectionPath} -e ${envFilePath} -g ${Utils.getGlobalEnvFile()} --folder ${requestFolder} -r htmlextra,cli --reporter-htmlextra-export "newman/${serviceName}_${requestFolder}_${moment().format()}.html" --export-environment ${envFilePath}`;
            }
        } else {
            return `newman run ${collectionPath} -e ${envFilePath} -g ${Utils.getGlobalEnvFile()} --folder ${requestFolder} --export-environment ${envFilePath}`;
        }
    },

    getRunCmdWithoutDataFileAndSingleRequest: function (serviceName, collectionPath, envFilePath, requestFolder, requestName, isHTMLReport, host) {
        if (isHTMLReport) {
            if (host == 'docker') {
                return `newman run ${collectionPath} -e ${envFilePath} -g ${Utils.getGlobalEnvFile()} --folder ${requestFolder} --filter ${requestName} -r htmlextra,cli --reporter-htmlextra-export "/app/newman/${serviceName}_${requestFolder}_${moment().format()}.html"`;
            } else {
                return `newman run ${collectionPath} -e ${envFilePath} -g ${Utils.getGlobalEnvFile()} --folder ${requestFolder} --filter ${requestName} -r htmlextra,cli --reporter-htmlextra-export "newman/${serviceName}_${requestFolder}_${moment().format()}.html"`;
            }
        } else {
            return `newman run ${collectionPath} -e ${envFilePath} -g ${Utils.getGlobalEnvFile()} --folder ${requestFolder} --filter ${requestName}`;
        }
    },

    getRunCmdWithDataFile: function (serviceName, collectionPath, dataFilePath, envFilePath, requestFolder, isHTMLReport) {
        if (isHTMLReport) {
            if (host == 'docker') {
                return `newman run ${collectionPath} -e ${envFilePath} -d ${dataFilePath} -g ${Utils.getGlobalEnvFile()}  --folder ${requestFolder} -r htmlextra,cli --reporter-htmlextra-export "/app/newman/` + serviceName.toString() + `_` + moment().format() + `-testReport.html"`;
            } else {
                return `newman run ${collectionPath} -e ${envFilePath} -d ${dataFilePath} -g ${Utils.getGlobalEnvFile()}  --folder ${requestFolder} -r htmlextra,cli --reporter-htmlextra-export "newman/` + serviceName.toString() + `_` + moment().format() + `-testReport.html"`;
            }

        } else {
            return `newman run ${collectionPath} -e ${envFilePath} -d ${dataFilePath} -g ${Utils.getGlobalEnvFile()}  --folder ${requestFolder}`;
        }
    },


    getNewmanCmd: (serviceName) => {
        if (host == 'docker') {
            return `newman run ${this.getCollectionPath(serviceName).toString()} -e ${this.getCollectionEnvFilePath(serviceName).toString()} -g ${Utils.getGlobalEnvFile()} -r cli,htmlextra  --reporter-htmlextra-export "/app/newman/` + serviceName.toString() + `_` + moment().format() + `-testReport.html"`
        } else {
            return `newman run ${this.getCollectionPath(serviceName).toString()} -e ${this.getCollectionEnvFilePath(serviceName).toString()} -g ${Utils.getGlobalEnvFile()} -r cli,htmlextra  --reporter-htmlextra-export "newman/` + serviceName.toString() + `_` + moment().format() + `-testReport.html"`
        }

    },

    newmanRunAndNotifySlack: async (serviceName) => {
        await Utils.delay(2000)
        var total_assertions = 0;
        var failed_assertions = 0;
        try {
            const collectionPath = await Utils.getCollectionPath(serviceName);
            const environmentPath = await Utils.getCollectionEnvFilePath(serviceName);
            const globals = Utils.getGlobalEnvFile();
            const { summary } = await new Promise((resolve, reject) => {
                newman.run({
                    collection: collectionPath,
                    environment: environmentPath,
                    globals: globals,
                    reporters: ['htmlextra', 'cli'],
                    reporter: {
                        htmlextra: {
                            export: Utils.getReportsPath(),
                        },
                    },
                    exportEnvironment: environmentPath
                }, function (err, summary) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ summary });
                    }
                });
            });
            total_assertions = summary.run.stats.assertions.total;
            failed_assertions = summary.run.stats.assertions.failed;

            console.log("total_assertions : " + total_assertions);
            console.log("failed_assertions : " + failed_assertions);
        } catch (error) {
            console.error("Error running Newman:", error);
        }
        await Utils.notifySlackAssertions(serviceName, total_assertions, failed_assertions)
    },

    newmanRunWithFolderAndNotifySlack: async (serviceName, folder) => {
        await Utils.delay(1000);
        var total_assertions = 0;
        var failed_assertions = 0;
        let folderList = [];
        if(folder.includes(',')) {
            folderList = folder.split(',');
        } else {
            folderList = [folder];
        }
        try {
            const collectionPath = await Utils.getCollectionPath(serviceName);
            const environmentPath = await Utils.getCollectionEnvFilePath(serviceName);
            const globals = Utils.getGlobalEnvFile();
            const { summary } = await new Promise((resolve, reject) => {
                newman.run({
                    collection: collectionPath,
                    environment: environmentPath,
                    globals: globals,
                    folder: folderList,
                    reporters: ['htmlextra', 'cli'],
                    reporter: {
                        htmlextra: {
                            export: Utils.getReportsPath()+`/${serviceName}-${folder}-${new Date().toISOString().replace(/[:.]/g, '-').replace('T', '-').slice(0, -1)}.html`
                        },
                    },
                    exportEnvironment: environmentPath
                }, function (err, summary) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ summary });
                    }
                });
            });
            total_assertions = summary.run.stats.assertions.total;
            failed_assertions = summary.run.stats.assertions.failed;

            console.log("total_assertions : " + total_assertions);
            console.log("failed_assertions : " + failed_assertions);
        } catch (error) {
            console.error("Error running Newman:", error);
        }
        await Utils.notifySlackAssertions(serviceName, total_assertions, failed_assertions,folder)
    },

    newmanRunWithFolderAndDataFileAndNotifySlack: async (serviceName, folder, dataFile) => {
        await Utils.delay(2000);
        var total_assertions = 0;
        var failed_assertions = 0;
        try {

            const collectionPath = await Utils.getCollectionPath(serviceName);
            const environmentPath = await Utils.getCollectionEnvFilePath(serviceName);
            const globals = Utils.getGlobalEnvFile();
            const { summary } = await new Promise((resolve, reject) => {
                newman.run({
                    collection: collectionPath,
                    environment: environmentPath,
                    globals: globals,
                    folder: folder,
                    iterationData: dataFile,
                    reporters: ['htmlextra', 'cli'],
                    reporter: {
                        htmlextra: {
                            export: Utils.getReportsPath()+serviceName+'-'+folder+`-testReport.html`,
                        },
                    },
                    exportEnvironment: environmentPath,
                }, function (err, summary) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ summary });
                    }
                });
            });
            total_assertions = summary.run.stats.assertions.total;
            failed_assertions = summary.run.stats.assertions.failed;

            console.log("total_assertions : " + total_assertions);
            console.log("failed_assertions : " + failed_assertions);
        } catch (error) {
            console.error("Error running Newman:", error);
        }
        await Utils.notifySlackAssertions(serviceName+'-'+folder, total_assertions, failed_assertions)
    },

    executeCommand: async (cmd) => {
        console.log("executable command ---> " + cmd.toString())
        try {
            const { stdout, stderr } = await exec(cmd);
            if (stderr) console.log('Error ----> ', stderr)
            console.log('stdout ---> ', stdout)
        } catch (e) {
            if (e.stderr != '') console.log(e.stderr)
            console.log(e.stdout)
        }
    },

    readEnvFileAndReturnValueBasedOnKey: async (filepath, key1) => {
        var valueBasedOnKey = null;
        const jsonData = JSON.parse(readFileSync.readFileSync(filepath, 'utf8'));
        for (var i = 0; i < jsonData.values.length; i++) {
            if (await jsonData.values[i].key == key1) {
                valueBasedOnKey = await jsonData.values[i].value;
                break;
            }
        }
        console.log(`value from environment file for key -> ${key1} is -> ${JSON.stringify(valueBasedOnKey)}`)
        return JSON.stringify(valueBasedOnKey);
    },

    writeIntoEnvJson: async (serviceName, key1, value1) => {
        var envFilePath1;
        if (host == 'docker') {
            envFilePath1 = '/app/tests/' + serviceName + '/env/' + serviceName + '.postman_environment.json';
        } else {
            envFilePath1 = 'tests/' + serviceName + '/env/' + serviceName + '.postman_environment.json';
        }
        console.log("env file path : " + envFilePath1)
        const newVar = {
            "key": key1,
            "value": value1,
            "type": "default",
            "enabled": true
        }
        if (readFileSync.existsSync(envFilePath1)) {
            var existingContent = readFileSync.readFileSync(envFilePath1, 'utf8')
            var dataFromFile = JSON.parse(existingContent)
            const index = dataFromFile.values.findIndex(obj => obj['key'] == key1);
            if (index !== -1) {
                dataFromFile.values[index]['value'] = value1;
            } else {
                dataFromFile.values.push(newVar);
            }
            dataFromFile = JSON.stringify(dataFromFile).toString()
            readFileSync.writeFileSync(envFilePath1, dataFromFile);
            console.info("added {" + key1 + " : " + value1 + "} to " + serviceName + " environment file successfully...")
        }
    },

    writeIntoFile: async (filePath, data) => {
        readFileSync.writeFile(filePath, data + "", function (err) {
            if (err) {
                return console.log(err);
            }
        });
        console.log("written successful...")
    },

    readFromFile: async (filePath) => {
        var dataFromFile = null;
        if (readFileSync.existsSync(filePath)) {
            dataFromFile = await fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.error(err);
                    return;
                }
                dataFromFile = data;
            });
        } else {
            console.log("[ERROR] file doesn't exist =>" + filePath)
        }
        return dataFromFile;
    },


    uploadReportFilesToGCPBucket: async (runId) => {
        console.log("path :::::: " + Utils.getReportsPath())
        let files = await fs.readdir(Utils.getReportsPath());

        var bucketName = (env == 'dev')? bucketNameDev
                         : (env == 'qa')? bucketNameQa
                         : bucketNameProd;
        console.log("bucket name ::: "+bucketName);                 
        for (const file of files) {
            if (file.endsWith('.html')) {
                console.log(`Uploading ${file} to ${bucketName}.`);
                await storage.bucket(bucketName).upload(`${reportsPath}/${file}`, {
                    gzip: true,
                    destination: `${runId}/${file}`,
                    metadata: {
                        cacheControl: 'public, max-age=31536000',
                    },
                });
                console.log(`${file} uploaded to ${bucketName}.`);
            }
        }
    },

    notifySlack: async (runId) => {
        var bucketName = (env == 'dev')? bucketNameDev
                         : (env == 'qa')? bucketNameQa
                         : bucketNameProd;
        const payload = {
            channel: "#channel-name",
            username: "api-reports",
            text: `https://console.cloud.google.com/storage/browser/${bucketName}/${runId}`,
            icon_emoji: ":here:"
        }

        await fetch(slackWebHookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
    },

    notifySlackAssertions: async (serviceName, totalAssertions, failedAssertions, folder) => {
        var payload = {
            channel: "#qa-alerts",
            username: `${env}-${serviceName}-reports`,
            text: `
            Total Assertions: ${totalAssertions}
            Failed Assertions: ${failedAssertions}`,
            icon_emoji: ":here:"
        }

        if(folder) {
            payload = {
                channel: "#channel-name",
                username: `${env}-${serviceName}-${folder}-reports`,
                text: `
                Total Assertions: ${totalAssertions}
                Failed Assertions: ${failedAssertions}`,
                icon_emoji: ":here:"
            }
        }

        await fetch(slackWebHookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
    },

    emptyReportDir: async () => {
        fsExtra.emptyDirSync(reportsPath)
    },

    delay: async (millis) => {
        return new Promise(resolve => {
            setTimeout(resolve, millis);
        });
    },

    setEnvIntoEnvironmentFile: async (serviceName) => {
        await Utils.writeIntoEnvJson(serviceName,'env',env);
    }
};
module.exports = Utils;