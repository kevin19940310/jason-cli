'use strict';
const path = require('path')
const childProcess = require('child_process')
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
            await pkg.update()
        } else {
            // 安装package
            await pkg.install().then(res => { }, err => {
                console.log(err);
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
    log.verbose('rootFile:', rootFile)
    if (rootFile) {
        try {
            // 在当前进程中调用
            // require(rootFile).call(null, Array.from(arguments));
            // 在node子进程中调用
            const argv = Array.from(arguments);
            const cmd = argv[argv.length - 1]
            const o = Object.create(null)
            Object.keys(cmd).forEach(key => {
                if (cmd.hasOwnProperty(key) && !key.startsWith('_') && key !== 'parent') {
                    o[key] = cmd[key]
                }
            })
            argv[argv.length-1] = o
            const code = `require('${rootFile}').call(null, ${JSON.stringify(argv)})`
            const child = spawn('node', ['-e', code], {
                cwd: process.cwd(),
                stdio: 'inherit'
            })
            child.on('error', (e) => {
                log.error(e.message)
                process.exit(1)
            })
            child.on('exit', (e) => {
                log.verbose('命令执行成功:', e);
                process.exit(e)
            })
        } catch (e) {
            log.error(e.message)
        }
    }
}

function spawn(command,args,options) {
    const win32 = process.platform === 'win32'
    const cmd =win32? 'cmd':command
    const cmdArgs = win32 ? ['/c'].concat(command,args):args
    return childProcess.spawn(cmd, cmdArgs, options|| {})
}

module.exports = exec;