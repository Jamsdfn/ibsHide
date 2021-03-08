const Koa = require('koa');
const Router = require("@koa/router");
const cors = require('koa2-cors');
const axios = require('axios')
const bodyparser = require('koa-bodyparser');

const {dboAdd, dboDelete, dboUpdate, dboSearch} = require('./dbOp')

const app = new Koa();
const router = new Router();

const key = 'fbe03fc0e064ce1011a6e3a47c1494e3'

app.use(cors());
app.use(bodyparser())

// 设置路由
// 获取相似定位
router.post('/simPlace', async ctx => {
    let { data } = await axios.get(`https://restapi.amap.com/v3/geocode/regeo?output=json&location=${ctx.request.body.location}&key=${key}&radius=${ctx.request.body.radius}&extensions=all`)
    ctx.body = JSON.stringify(data)
})

// 获取规划路径
router.post('/carPath', async ctx => {
    let { data } = await axios.get(`https://restapi.amap.com/v3/direction/driving?key=${key}&origin=${ctx.request.body.origin}&destination=${ctx.request.body.destination}&strategy=0`)
    ctx.body = JSON.stringify(data)
})

// 设置当前位置
router.post('/currentLocation', async ctx => {
    let user
    let current
    try {
        user = ctx.request.body.user
        current = ctx. request.body.current.split(',').map(item => Number(item))
        let userLocation = await dboSearch({user})
        if (!Array.isArray(userLocation)) throw new Error('DB Error')
        let path = userLocation[0].path
        path.push(current)
        let res = await dboUpdate({old: {user}, new: {
            $set: {
                location: current,
                path
            }
        }})
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
    let user
    let current
    try {
        user = ctx.request.body.user
        current = ctx. request.body.current.split(',').map(item => Number(item))
        let res = await dboAdd([{user: ctx.request.body.user, location: current, path: [current]}])
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

// 注册路由中间件
app.use(router.routes()).use(router.allowedMethods());

app.listen(3000);

console.log('app running...')
