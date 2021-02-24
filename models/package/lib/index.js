'use strict';
const pkgDir = require('pkg-dir').sync
const path = require('path')
const npminstall = require('npminstall')
const pathExists = require('path-exists').sync

const { isObject } = require('@jason-cli/utils')
const formatPath = require('@jason-cli/format-path')
const {getDefaultRegistry,getNpmLatestVersion} = require('@jason-cli/get-npm-info')
class Package {
    constructor(options) {
        if (!options) {
            throw new Error('Package类的options参数不能为空')
        }
        if (!isObject(options)) {
            throw new Error('Package类的options参数必须是object')
        }
        // package 路径
        this.targetPath = options.targetPath
        // package 缓存路径
        this.storeDir = options.storeDir
        // package name
        this.packageName = options.packageName
        // package version
        this.packageVersion = options.packageVersion
        // package 缓存目录前缀
        this.cacheFilePathPrefix = this.packageName.replace('/','_');
    }

    get cacheFilePath () {
        return path.resolve(this.storeDir,`_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`)
    }

    // 获取package对应的最新版本
   async prepare() {
        if (this.packageVersion === 'latest') {
            this.packageVersion = await getNpmLatestVersion(this.packageName)
        }
    }

    //检查package是否存在
    async exists() {
        if(this.storeDir) {
           await this.prepare()
           return pathExists(this.cacheFilePath)
        }else {
           return pathExists(this.targetPath)
        }
    }

    // 安装package
    async install() {
        await this.prepare()
        return npminstall({
            root:this.targetPath,
            storeDir:this.storeDir,
            registry:getDefaultRegistry(),
            pkgs:[{
                name:this.packageName,
                version:this.packageVersion
            }]
        })
     }

    // 更新package
    update() { }

    // 获取入口文件的路径
    getRootFilePath() {
        //1. 获取package.json 所在目录
        const dir = pkgDir(this.targetPath)
        //2. 读取package/json
        if (dir) {
            const pkgFile = require(path.resolve(dir, 'package.json'))
            //3. 寻找入口文件 main/bin
            if (pkgFile && pkgFile.main) {
                //4. 路径兼容mac/win
                return formatPath(path.resolve(dir, pkgFile.main))
            }
        }
        return null
    }
}
module.exports = Package;
