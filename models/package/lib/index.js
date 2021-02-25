'use strict';
const pkgDir = require('pkg-dir').sync
const path = require('path')
const npminstall = require('npminstall')
const pathExists = require('path-exists').sync
const fsExtra = require('fs-extra')

const { isObject } = require('@jason-cli/utils')
const formatPath = require('@jason-cli/format-path')
const { getDefaultRegistry, getNpmLatestVersion } = require('@jason-cli/get-npm-info')
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
        this.cacheFilePathPrefix = this.packageName.replace('/', '_');
    }

    // 当前版本对应的缓存路径
    get cacheFilePath() {
        return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${this.packageVersion}@${this.packageName}`)
    }

    // 生成最新版本的缓存路径
    getSpecificCacheFilePath(Version) {
        return path.resolve(this.storeDir, `_${this.cacheFilePathPrefix}@${Version}@${this.packageName}`)
    }

    // 获取package对应的最新版本
    async prepare() {
        if (this.storeDir && !pathExists(this.storeDir)) {
            fsExtra.mkdirpSync(this.storeDir)
        }
        if (this.packageVersion === 'latest') {
            this.packageVersion = await getNpmLatestVersion(this.packageName)
        }
    }

    //检查package是否存在
    async exists() {
        if (this.storeDir) {
            await this.prepare()
            return pathExists(this.cacheFilePath)
        } else {
            return pathExists(this.targetPath)
        }
    }

    // 安装package
    async install() {
        await this.prepare()
        return npminstall({
            root: this.targetPath,
            storeDir: this.storeDir,
            registry: getDefaultRegistry(),
            pkgs: [{
                name: this.packageName,
                version: this.packageVersion
            }]
        })
    }

    // 更新package
    async update() {
        await this.prepare()
        // 1. 获取最新的package版本号
        const latestVersion = await getNpmLatestVersion(this.packageName)
        //2. 查看本地是否有最新版本号对应的文件
        const latestVersionCacheFilePath = this.getSpecificCacheFilePath(latestVersion)
        //3. 如果不存在 则下载最新版本
        if (!pathExists(latestVersionCacheFilePath)) {
            npminstall({
                root: this.targetPath,
                storeDir: this.storeDir,
                registry: getDefaultRegistry(),
                pkgs: [{
                    name: this.packageName,
                    version: this.latestVersion
                }]
            })
            this.packageVersion = latestVersion
        }
    }

    // 获取入口文件的路径
    getRootFilePath() {
        function _getRootFile(targetPath) {
            //1. 获取package.json 所在目录
            const dir = pkgDir(targetPath)
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

        if (this.storeDir) {  // 使用缓存的方式
            return _getRootFile(this.cacheFilePath)
        } else {  // 不使用缓存的方式
            return _getRootFile(this.targetPath)
        }

    }
}
module.exports = Package;
