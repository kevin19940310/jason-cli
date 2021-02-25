'use strict';
const path = require('path')

const semver = require('semver')
const colors = require('colors/safe')
const userHome = require('user-home')
const pathExists = require('path-exists').sync
const dotEnv = require('dotenv')  // 将环境变量中的变量从.env 文件添加到process.env中
const commender = require('commander')

const commendInit = require('@jason-cli/init')
const { getNpmSemverVersion } = require('@jason-cli/get-npm-info')
const exec = require('@jason-cli/exec')

const pck = require('../package.json')
const log = require('@jason-cli/log')
const config = require('./config');

const program = new commender.Command()

async function core() {
    try {
        await prepare() //脚手架启动前各项检查
        registerCommand()  //  注册脚手架命令
    } catch (e) {
        log.error(e.message)
    }
}

// 命令注册
function registerCommand() {
    program
        .name(Object.keys(pck.bin)[0])
        .usage('<command> [options]')
        .version(pck.version)
        .option('-d --debug', '是否开启调试模式', false)
        .option('-tp --targetPath <targetPath>', '是否指定本地调试文件路径', '')

    program
        .command('init [projectName]')
        .option('-f --force', '是否强制初始化项目')
        .action(exec)

    // 指定全局的targetPath环境变量
    program.on("option:targetPath", function () {
        if (program.opts().targetPath) {
            process.env.CLI_TARGET_PATH = program.opts().targetPath
        }
    })

    // 开启debug模式
    program.on('option:debug', function () {
        if (program.opts().debug) {
            process.env.LOG_LEVEL = 'verbose'
        } else {
            process.env.LOG_LEVEL = 'info'
        }
        log.level = process.env.LOG_LEVEL
    })

    // 监听全局为定义的命令
    program.on("command:*", function (obj) {
        const availableCommands = program.commands.map(cmd => cmd.name());
        console.log(colors.red(`未知的命令: ${obj[0]}`));
        if (availableCommands > 0) {
            console.log(colors.green(`可用命令为: ${availableCommands.join(',')}`))
        }
    })

    // 解析命令行参数
    program.parse(process.argv)

    if (program.args && program.args.length < 1) {
        program.outputHelp()
    }
}

// 脚手架启动前各项检查
async function prepare() {
    checkPckVersion()  // 检查当前cli版本
    checkRoot()  //检查root账户,并降级
    checkUserHome() // 检查用户主目录
    checkEnv()  // 默认环境变量设置
    await checkGlobalUpdate()  // 检查更新当前是否最新版本
}

async function checkGlobalUpdate() {
    const currentVersion = pck.version
    const npmName = pck.name
    const lastVersions = await getNpmSemverVersion(currentVersion, npmName,)
    if (lastVersions && semver.gt(lastVersions, currentVersion)) {
        log.warn(colors.yellow(`
        请手动更新 ${npmName}, 当前版本：${currentVersion}, 最新版本：${lastVersions}
        更新命令： npm install -g ${npmName}
        `))
    }
}

function checkEnv() {
    const dotenvPath = path.resolve(userHome, '.env')
    if (pathExists(dotenvPath)) {
        dotEnv.config({
            path: dotenvPath
        })
    }
    createDefaultConfig()
}

// 生成默认环境变量
function createDefaultConfig() {
    const cliConfig = {
        home: userHome
    }
    if (process.env.CLI_HOME) {
        cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME)
    } else {
        cliConfig['cliHome'] = path.join(userHome, config.DEFAULT_CLI_HOME)
    }
    process.env.CLI_HOME_PATH = cliConfig.cliHome
}

function checkUserHome() {
    if (!userHome || !pathExists(userHome)) {
        throw new Error(colors.red('当前用户主目录不存在'))
    }
}

function checkRoot() {
    const rootCheck = require('root-check')
    rootCheck()
}

function checkPckVersion() {
    log.notice('当前cli版本', pck.version)
}

module.exports = core;