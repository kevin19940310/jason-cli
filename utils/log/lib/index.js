'use strict';

const log = require('npmlog')
log.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info';  //判断debug模式
log.heading = 'Jason'  // 修改前缀
// log.headingStyle= {fg:red}   修改前缀样式
log.addLevel('success',2000,{fg:'green'})  //添加自定义命令

module.exports = log;