'use strict';
const path = require('path')

function formatPath(p) {
    if(p && typeof p ==='string') {
        const sep = path.sep  // 获取当前操作系统的路径分隔符
        if(sep=== '/') {
            return p
        }else {
            return p.replace(/\\/g, '/')
        }
    }
    return p
}

module.exports = formatPath;