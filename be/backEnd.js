const Koa = require('koa');
const Router = require("@koa/router");
const {default: PQueue} = require('p-queue');
const cors = require('koa2-cors');
const axios = require('axios')
const bodyparser = require('koa-bodyparser');
const https = require('https')
const fs = require('fs')
const sslify = require('koa-sslify').default

const {dboAdd, dboDelete, dboUpdate, dboSearch} = require('./dbOp')
const {currentInArr, fuserName} = require('./handler')

const options = {
    key: fs.readFileSync('../key.pem'),
    cert: fs.readFileSync('../cert.pem'),
}


const app = new Koa();
const router = new Router();
// 阿里lbs服务对于免费开发者用户并发上限是200，因此pqueue队列并发数定义为200
const queue = new PQueue({concurrency: 200});
app.use(sslify())


const key = 'fbe03fc0e064ce1011a6e3a47c1494e3'

app.use(cors());
app.use(bodyparser())

// 方便抓包工具获取，以便答辩时展示
// axios.defaults.proxy = {
//     host: '127.0.0.1',
//     port: 9090
//   }

// 设置路由
// 获取搜索结果路径
router.post('/searchPlacePath', async ctx => {
    let user = ctx.request.body.user
    let origin = Buffer.from(ctx.request.body.origin, 'base64').toString()
    let currentArr = origin.split(';').map(item => [Number(item.split(',')[0]), Number(item.split(',')[1])])
    let destination = Buffer.from(ctx.request.body.destination, 'base64').toString()
    let desArr = destination.split(';').map(item => [Number(item.split(',')[0]), Number(item.split(',')[1])])
    let keyMap = await dboSearch({fuser: user}, 'keyMap')
    let timeSault = keyMap[0]['key']
    let currentIdx = currentInArr(currentArr.length, timeSault, user)
    let res
    // 防止攻击者拦截中转服务器的请求，所以虚假的定位也要发送请求给阿里
    await Promise.all(currentArr.map(async (item, index) => {
        if (index === currentIdx) {
            let { data } = await queue.add(async () => {
                return await axios.get(`https://restapi.amap.com/v3/direction/driving?key=${key}&origin=${item}&destination=${desArr[index]}&strategy=0`)
            })
            res = data
        } else {
            await queue.add(async () => {
                return await axios.get(`https://restapi.amap.com/v3/direction/driving?key=${key}&origin=${item}&destination=${desArr[index]}&strategy=0`)
            })
        }
    }))
    ctx.body = JSON.stringify(res)
})

// 获取搜索结果
router.post('/searchPlace', async ctx => {
    let user = ctx.request.body.user
    let location = Buffer.from(ctx.request.body.location, 'base64').toString()
    let currentArr = location.split(';').map(item => [Number(item.split(',')[0]), Number(item.split(',')[1])])
    let keyMap = await dboSearch({fuser: user}, 'keyMap')
    let timeSault = keyMap[0]['key']
    let currentIdx = currentInArr(currentArr.length, timeSault, user)
    let res
    // 防止攻击者拦截中转服务器的请求，所以虚假的定位也要发送请求给阿里
    await Promise.all(currentArr.map(async (item, index) => {
        if (index === currentIdx) {
            let { data } = await queue.add(async () => {
                return await axios.get(`https://restapi.amap.com/v3/place/around?key=${key}&location=${item}&radius=${ctx.request.body.radius}&keywords=${encodeURIComponent(ctx.request.body.keyword)}`)
            })
            res = data
        } else {
            await queue.add(async () => {
                return await axios.get(`https://restapi.amap.com/v3/place/around?key=${key}&location=${item}&radius=${ctx.request.body.radius}&keywords=${encodeURIComponent(ctx.request.body.keyword)}`)
            })
        }
    }))
    ctx.body = JSON.stringify(res)
})

// 获取相似定位
router.post('/simPlace', async ctx => {
    let user = ctx.request.body.user
    let location = Buffer.from(ctx.request.body.location, 'base64').toString()
    let currentArr = location.split(';').map(item => [Number(item.split(',')[0]), Number(item.split(',')[1])])
    let keyMap = await dboSearch({fuser: user}, 'keyMap')
    let timeSault = keyMap[0]['key']
    let currentIdx = currentInArr(currentArr.length, timeSault, user)
    let res
    // 防止攻击者拦截中转服务器的请求，所以虚假的定位也要发送请求给阿里
    await Promise.all(currentArr.map(async (item, index) => {
        if (index === currentIdx) {
            let { data } = await queue.add(async () => {
                return await axios.get(`https://restapi.amap.com/v3/geocode/regeo?output=json&location=${item}&key=${key}&radius=${ctx.request.body.radius}&extensions=all`)
            })
            res = data
        } else {
            await queue.add(async () => {
                return await axios.get(`https://restapi.amap.com/v3/geocode/regeo?output=json&location=${item}&key=${key}&radius=${ctx.request.body.radius}&extensions=all`)
            })
        }
    }))
    ctx.body = JSON.stringify(res)
})

// 获取路段同名点
router.post('/roadPath', async ctx => {
    let { data } = await queue.add(async () => {
        return await axios.get(`https://restapi.amap.com/v3/place/text?keywords=${encodeURIComponent(ctx.request.body.road)}&city=${ctx.request.body.city}&key=${key}&types=${encodeURIComponent('交通地名')}`)
    })
    ctx.body = JSON.stringify(data)
})

// 获取规划路径
router.post('/carPath', async ctx => {
    let { data } = await queue.add(async () => {
        return await axios.get(`https://restapi.amap.com/v3/direction/driving?key=${key}&origin=${ctx.request.body.origin}&destination=${ctx.request.body.destination}&strategy=0&waypoints=${ctx.request.body.waypass}`)
    })
    ctx.body = JSON.stringify(data)
})

// 设置当前位置
router.post('/currentLocation', async ctx => {
    let current
    let user
    try {
        let userkey = await dboSearch({fuser: ctx.request.body.user}, 'keyMap')
        user = userkey[0]['user']
        let location = Buffer.from(ctx.request.body.current, 'base64').toString()
        let currentArr = location.split(';').map(item => [Number(item.split(',')[0]), Number(item.split(',')[1])])
        let timeSault = userkey[0]['key']
        current = currentArr[currentInArr(currentArr.length, timeSault, ctx.request.body.user)]
        let userLocation = await dboSearch({user})
        if (!Array.isArray(userLocation)) throw new Error('DB Error')
        let path = userLocation[0].path
        path.push(current)
        res = await dboUpdate({old: {user}, new: {
            $set: {
                location: current,
                path
            }
        }})
        if (!res.result) throw new Error('DB Error')
        ctx.body = JSON.stringify({
            status: 200,
            msg: 'OK'
        })
    } catch (e) {
        let status = e.status || 500
        let message = e.message || 'Server Error'
        ctx.response.body = { status, message }
    }
})

// 获取已走路径
router.post('/getPath', async ctx => {
    try {
        let userLocation = await dboSearch({user: ctx.request.body.user})
        if (!Array.isArray(userLocation)) throw new Error('DB Error')
        if (userLocation.length === 0) {
            ctx.body = JSON.stringify({
                status: 200,
                msg: 'user does not exits.',
                data: []
            })
            return
        }
        let path = userLocation[0].path
        ctx.body = JSON.stringify({
            status: 200,
            msg: 'OK',
            data: path
        })
    } catch (e) {
        let status = e.status || 500
        let message = e.message || 'Server Error'
        ctx.response.body = { status, message }
    }
})

// 添加用户
router.post('/create', async ctx => {
    let current
    try {
        let userkey = await dboSearch({fuser: ctx.request.body.user}, 'keyMap')
        let location = Buffer.from(ctx.request.body.current, 'base64').toString()
        let currentArr = location.split(';').map(item => [Number(item.split(',')[0]), Number(item.split(',')[1])])
        let timeSault = userkey[0]['key']
        current = currentArr[currentInArr(currentArr.length, timeSault, ctx.request.body.user)]
        let res = await dboAdd([{user: userkey[0]['user'], location: current, path: [current]}])
        if (!res.result) throw new Error('DB Error')
        ctx.body = JSON.stringify({
            status: 200,
            msg: 'OK',
            data: res
        })
    } catch (e) {
        let status = e.status || 500
        let message = e.message || 'Server Error'
        ctx.response.body = { status, message }
    }
})

// 删除用户
router.post('/delete', async ctx => {
    let user
    try {
        user = ctx.request.body.user
        let res = await dboDelete({user: ctx.request.body.user})
        if (!res.result) throw new Error('DB Error')
        ctx.body = JSON.stringify({
            status: 200,
            msg: 'OK',
            data: res
        })
    } catch (e) {
        let status = e.status || 500
        let message = e.message || 'Server Error'
        ctx.response.body = { status, message }
    }
})

// 查询用户是否存在
router.post('/isCreated', async ctx => {
    try {
        let user = await dboSearch({fuser: ctx.request.body.user}, 'keyMap')
        let userLocation = await dboSearch({user: user[0]['user']})
        console.log(userLocation)
        if (!Array.isArray(userLocation)) throw new Error('DB Error')
        if (userLocation.length === 0) {
            ctx.body = JSON.stringify({
                status: 200,
                msg: 'user does not exits.',
                isCreated: 0
            })
        } else {
            ctx.body = JSON.stringify({
                status: 200,
                msg: 'user is exits.',
                isCreated: 1
            })
        }
    } catch (e) {
        let status = e.status || 500
        let message = e.message || 'Server Error'
        ctx.response.body = { status, message }
    }
})


// 获取时间参数
router.post('/time', async ctx => {
    let now = Date.now()
    let userLocation
    let fuserLocation
    try {
        userLocation = await dboSearch({user: ctx.request.body.user}, 'keyMap')
        fuserLocation = await dboSearch({fuser: ctx.request.body.user}, 'keyMap')
        if (!Array.isArray(userLocation) || !Array.isArray(fuserLocation)) throw new Error('DB Error')
        if (userLocation.length === 0 && fuserLocation.length === 0) {
            let fuser = fuserName(ctx.request.body.user, now)
            let res = await dboAdd([{user: ctx.request.body.user, key: now, fuser}], 'keyMap')
            if (!res.result) throw new Error('DB Error')
        } else {
            if (userLocation.length > 0) {
                let res = await dboUpdate({old: {user: ctx.request.body.user}, new: {
                    $set: {
                        key: now,
                        fuser: fuserName(ctx.request.body.user, now)
                    }
                }}, 'keyMap')
                if (!res.result) throw new Error('DB Error')
            }
            if (fuserLocation.length > 0) {
                let res = await dboUpdate({old: {fuser: ctx.request.body.user}, new: {
                    $set: {
                        key: now,
                        fuser: fuserName(fuserLocation[0]['user'], now)
                    }
                }}, 'keyMap')
                if (!res.result) throw new Error('DB Error')
            }
        }
        ctx.body = JSON.stringify({
            time: now
        })
    } catch (e) {
        let status = e.status || 500
        let message = e.message || 'Server Error'
        ctx.response.body = { status, message }
    }
})



// 注册路由中间件
app.use(router.routes()).use(router.allowedMethods());

https.createServer(options, app.callback()).listen(3000, (err) => {
    if (err) {
      console.log('服务启动出错', err);
    } else {
      console.log('guessWord-server运行在' + 3000 + '端口');
    }
  });
console.log('app running...')
