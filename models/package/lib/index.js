'use strict';
const pkgDir = require('pkg-dir').sync

const {isObject} = require('@jason-cli/utils')
class Package {
    constructor(options) {
        if(!options) {
            throw new Error('Package类的options参数不能为空')
        }
        if(!isObject(options)) {
            throw new Error('Package类的options参数必须是object')
        }
        // package 路径
        this.targetPath = options.targetPath
        // package name
        this.packageName = options.name
        // package version
        this.packageVersion = options.version
    }
    //检查package是否存在
    exists() {
    }

    // 安装package
    install() { }

    // 更新package
    update() { }

    // 获取入口文件的路径
    getRootFilePath() {
        //1. 获取package.json 所在目录
        console.log(this.targetPath);
        const dir = pkgDir(this.targetPath)
        console.log(dir);
        //2. 读取package/json
        //3. 寻找入口文件 main/bin
        //4. 路径兼容mac/win
    }
}
module.exports = Package;
