'use strict';
const path = require('path')
const Package = require('@jason-cli/package')
const log = require('@jason-cli/log')

const SETTINGS = {
    init: 'pkg-dir'
}
const CACHE_DIR = 'dependencies'

async function exec() {
    let targetPath = process.env.CLI_TARGET_PATH;
    let pkg = ''
    let storeDir = ''
    const homePath = process.env.CLI_HOME_PATH;
    log.verbose("targetPath:", targetPath)
    log.verbose("homePath:", homePath)
    const cmdObj = arguments[arguments.length - 1]
    const cmdName = cmdObj.name()
    const packageName = SETTINGS[cmdName]
    const packageVersion = 'latest'
    if (!targetPath) {
        targetPath = path.resolve(homePath, CACHE_DIR)  //生成缓存路径
        storeDir = path.resolve(targetPath, 'node_modules')
        log.verbose("targetPath:", targetPath)
        log.verbose("storeDir:", storeDir)
        pkg = new Package({
            storeDir,
            targetPath,
            packageName: packageName,
            packageVersion: packageVersion
        })
        if (await pkg.exists()) {
            // 更新package
        } else {
            // 安装package
           await pkg.install().then(res=> {},err=> {
               console.log(err);
            console.log(2);
           })
        }
    } else {
        pkg = new Package({
            storeDir,
            targetPath,
            packageName: packageName,
            packageVersion: packageVersion
        })
    }
    const rootFile = pkg.getRootFilePath()
    if(rootFile) {
        require(rootFile).apply(null, arguments);
    }
}

module.exports = exec;