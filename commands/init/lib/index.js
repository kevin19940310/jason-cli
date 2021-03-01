'use strict';
const fs = require('fs')
const inquirer = require('inquirer')
const fsExtra = require('fs-extra')
const semver = require('semver')

const Command = require('@jason-cli/command')
const log = require('@jason-cli/log')

const TYPE_PROJECT = 'project'
const TYPE_COMPONENT = 'component'
class InitCommand extends Command {
    init() {
        this.projectName = this._argv[0] || ''
        this.force = !!this._argv[1].force
        log.verbose('projectName:', this.projectName);
        log.verbose('force:', this.force)
    }

    async exec() {
        try {
            // 1. 准备阶段
            const projectInfo = await this.prepare()
            if(projectInfo) {
                //2. 下载模版
                log.verbose('projectInfo:',projectInfo)
                this.downloadTemplate(projectInfo)
                //3. 安装模版
            }
        } catch (error) {
            log.error(error.message)
        }
    }

    async prepare() {
        const localPath = process.cwd()
        //1. 判断当前目录是否为空
        if (!this.ifDirEmpty(localPath)) {
            let ifContinue = false
            if (!this.force) {
                ifContinue = (await inquirer.prompt([
                    {
                        type: 'confirm',
                        message: '当前文件夹不为空，是否继续创建项目?',
                        name: 'ifContinue',
                        default: false,

                    }
                ])).ifContinue
                if (!ifContinue) return
            }

            //2. 是否强制更新
            if (ifContinue || this.force) {
                const { confirmDelete } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        message: '是否确认清空当前目录?',
                        name: 'confirmDelete',
                        default: false,

                    }
                ])
                if (confirmDelete) {
                    // 清空当前目录
                    fsExtra.emptyDirSync(localPath)
                }
            }
        }
        return await this.getProjectInfo()
    }

    async getProjectInfo() {
        let projectInfo = {}
        //3. 创建项目或者组件
        const { type } = await inquirer.prompt([{
            type: 'list',
            name: 'type',
            message: '请选择初始化类型:',
            default: TYPE_PROJECT,
            choices: [
                { value: TYPE_PROJECT, name: '项目' },
                { value: TYPE_COMPONENT, name: '组件' }
            ]
        }])


        if (type === TYPE_PROJECT) {
            //4. 获取项目的基本信息
            const answer = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'projectName',
                    message: '请输入项目名称',
                    default: '',
                    validate: function (v) {
                        const done = this.async();
                        setTimeout(() => {
                            if (!/^[a-zA-Z]+([-][a-zA-Z][a-zA-Z0-9]*|[_][a-zA-Z][a-zA-Z0-9]*|[a-zA-Z0-9]*)$/.test(v)) {
                                done('请输入合法的项目名称！')
                            }
                            done(null, true)
                        }, 0)
                        // 1.首字符必须为英文字符
                        // 2.尾字符必须为英文或者数字
                        // 3. 字符只允许'- _'
                        return
                    },
                    filter: function (v) {
                        return v
                    }
                },
                {
                    type: 'input',
                    name: 'projectVersion',
                    message: '请输入项目版本号',
                    default: '1.0.0',
                    validate: function (v) {
                        const done = this.async();
                        if (!!semver.valid(v)) {
                            done(null, true)
                        } else {
                            done('请输入合法的版本号！')
                        }
                    },
                    filter: function (v) {
                        if (!!semver.valid(v)) {
                            return semver.valid(v)
                        } else {
                            return v
                        }
                    }
                }
            ])
            // console.log(answer);
            projectInfo = {
                type,
                ...answer
            }
        } else if (type === TYPE_COMPONENT) {

        }
        return projectInfo
    }

    downloadTemplate(projectInfo) {

    }

    ifDirEmpty(localPath) {
        let fileList = fs.readdirSync(localPath)
        fileList = fileList.filter(file => (
            !file.startsWith('.') && ['node_modules'].indexOf(file) < 0
        ))
        return !fileList || fileList.length <= 0
    }
}

function init(argv) {
    return new InitCommand(argv)
}

module.exports = init

module.exports.InitCommand = InitCommand;