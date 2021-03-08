const Koa = require('koa');
const Router = require("@koa/router");
const cors = require('koa2-cors');
const axios = require('axios')

const {dboAdd, dboDelete, dboUpdate, dboSearch} = require('./dbOp')

const app = new Koa();
const router = new Router();

const key = 'fbe03fc0e064ce1011a6e3a47c1494e3'

app.use(cors());

// 设置路由
router.get("/", ctx => {
    ctx.body = "Hello World";
});

router.get('/simPlace', async ctx => {
    let { data } = await axios.get(`https://restapi.amap.com/v3/geocode/regeo?output=json&location=${ctx.query.location}&key=${key}&radius=${ctx.query.radius}&extensions=all`)
    ctx.body = JSON.stringify(data)
})

router.get('/carPath', async ctx => {
    let { data } = await axios.get(`https://restapi.amap.com/v3/direction/driving?key=${key}&origin=${ctx.query.origin}&destination=${ctx.query.destination}`)
    ctx.body = JSON.stringify(data)
})


router.get('/currentLocation', ctx => {
    db.path.push(ctx.query.current)
    ctx.body = JSON.stringify({
        status: 200,
        msg: 'OK'
    })
})

router.get('/getPath', ctx => {
    ctx.body = JSON.stringify({
        status: 200,
        msg: 'OK',
        data: db.path
    })
})

  // 注册路由中间件
app.use(router.routes()).use(router.allowedMethods());

app.listen(3000);

console.log('app running...')
