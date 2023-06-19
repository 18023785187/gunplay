const os = require('os')
/**
 * 获取ip地址
 * @returns url
 */
function getNetworkIp() {
  let needHost = '' // 打开的host
  try {
    // 获得网络接口列表
    let network = os.networkInterfaces()
    // if (network['以太网']) {
    //   let alias = network['以太网']
    //   for (let i = 0; i < alias.length; i++) {
    //     if (alias[i]['family'] === 'IPv4' && alias[i]['address'] !== '127.0.0.1' && !alias[i]['internal']) {
    //       needHost = alias[i]['address']
    //     }
    //   }
    // } else 
    if (network['WLAN']) {
      let alias = network['WLAN']
      for (let i = 0; i < alias.length; i++) {
        if (alias[i]['family'] === 'IPv4' && alias[i]['address'] !== '127.0.0.1' && !alias[i]['internal']) {
          needHost = alias[i]['address']
        }
      }
    }
  } catch (e) {
    needHost = 'localhost'
  }
  return needHost
}

module.exports = { getNetworkIp }