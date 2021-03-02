
const request = require('@jason-cli/request')

module.exports = function () {
  return request({
    url:'/project/template'
  })
}