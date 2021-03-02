'use strict';
const fs = require('fs')
const path = require('path')
const inquirer = require('inquirer')
const fsExtra = require('fs-extra')
const semver = require('semver')
const userHome = require('user-home')

const Command = require('@jason-cli/command')
const Package = require('@jason-cli/package')
const log = require('@jason-cli/log')
const { spinnerStart, sleep } = require('@jason-cli/utils')

const getProjectTemplate = require('./getProjectTemplate')

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
            if (projectInfo) {
                //2. 下载模版

                this.projectInfo = projectInfo
                log.verbose('projectInfo:', projectInfo)
                await this.downloadTemplate()
                //3. 安装模版
            }
        } catch (error) {
            log.error(error.message)
        }
    }

    async prepare() {

        // 0. 判断项目模板是否存在
        const template = await getProjectTemplate()
        console.log(template);
        if (!template || template.length <= 0) {
            throw new Error('项目模板不存在!')
        }
        this.templates = template
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
                },
                {
                    type: 'list',
                    name: 'projectTemplate',
                    message: '请选择项目模板',
                    choices: this.createTemplateChoices()
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

    async downloadTemplate() {
        const { projectTemplate } = this.projectInfo
        const templateInfo = this.templates.find(item => item.npmName === projectTemplate)
        const targetPath = path.resolve(userHome, '.jason-cli', 'template')
        const storeDir = path.resolve(targetPath, 'node_modules')
        const { npmName, version } = templateInfo
        const templateNpm = new Package({
            targetPath,
            storeDir,
            packageName: npmName,
            packageVersion: version
        })
        if (!await templateNpm.exists()) {

            // 安装模板
            const spinner = spinnerStart('正在下载模板')
            await sleep(1000)
            try {
                await templateNpm.install()
            } catch (error) {

            } finally {

                spinner.stop(true)
            }
        } else {

            // 更新模板
            const spinner = spinnerStart('正在更新模板')
            await sleep(1000)
            try {
                await templateNpm.update()
            } catch (error) {

            } finally {

                spinner.stop(true)
            }
        }
    }

    ifDirEmpty(localPath) {
        let fileList = fs.readdirSync(localPath)
        fileList = fileList.filter(file => (
            !file.startsWith('.') && ['node_modules'].indexOf(file) < 0
        ))
        return !fileList || fileList.length <= 0
    }

    createTemplateChoices() {
        return this.templates.map(item => {
            return {
                name: item.name,
                value: item.npmName
            }
        })
    }
}

function init(argv) {
    return new InitCommand(argv)
}

module.exports = init

module.exports.InitCommand = InitCommand;