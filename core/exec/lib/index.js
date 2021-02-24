'use strict';
const Package = require('@jason-cli/package')
const log = require('@jason-cli/log')

const SETTINGS= {
    init:'@jason-cli/init'
}

function exec() {
    let targetPath = process.env.CLI_TARGET_PATH;
    const homePath = process.env.CLI_HOME_PATH;
    log.verbose(targetPath,homePath)
    if(!targetPath) {
        targetPath = ''
    }
    const cmdObj = arguments[arguments.length-1]
    const cmdName = cmdObj.name()
    const packageName = SETTINGS[cmdName]
    const packageVersion = 'latest'
    // console.log(cmdName);
    const pkg = new Package({
        targetPath,
        packageName:packageName,
        packageVersion:packageVersion
    })
    pkg.getRootFilePath()
}

module.exports = exec;