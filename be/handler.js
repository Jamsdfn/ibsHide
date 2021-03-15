const md5 = require('md5')

function currentInArr (arrLength, timeSault, user) {
    let sault = new Date(timeSault).getMilliseconds()
    let num = Number(md5(user + sault).split('').filter(item => !isNaN(item)).slice(3, 6).join(''))
    if (num === 0) num = user.charCodeAt(7)
    return num % (arrLength - 1)
}

module.exports = { currentInArr }
