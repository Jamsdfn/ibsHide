<template>
    <div id="app">
        <div id="container">
        </div>
        <div class="input-card" v-if="car">
            <div class="input-item">
                <input type="button" class="btn" value="开始动画" id="start" @click="startAnimation"/>
                <input type="button" class="btn" value="暂停动画" id="pause" @click="pauseAnimation"/>
            </div>
            <div class="input-item">
                <input type="button" class="btn" value="继续动画" id="resume" @click="resumeAnimation"/>
                <input type="button" class="btn" value="停止动画" id="stop" @click="stopAnimation"/>
            </div>
        </div>
    </div>
</template>

<script>
import AMap from 'AMap'
import axios from 'axios'
import Mock from 'mockjs'
import md5 from 'md5'

export default {
    mounted() {
        this.init()
    },
    methods: {
        async init () {
            this.currentInArr(1,Date.now())
            let {data} = await  axios({
                url: `${this.backEnd}/time`,
                method: 'post',
                headers: {
                    'Content-type': 'application/json'
                },
                data: {
                    user: `${this.fackUsername(this.username)}`
                }
            })
            this.timeSault = data.time
            let res = await axios({
                url: `${this.backEnd}/isCreated`,
                method: 'post',
                headers: {
                    'Content-type': 'application/json'
                },
                data: {
                    user: `${this.fackUsername(this.username)}`
                }
            })

            if (res.data.isCreated === 1) this.create = true

            let vm = this
            var map = new AMap.Map('container', {
                center: vm.center,
                resizeEnable: true,
                zoom: 16
            });

            this.map = map

            map.plugin(["AMap.ToolBar"], function() {
                map.addControl(new AMap.ToolBar())
            });

            // 当前精确定位
            AMap.plugin('AMap.Geolocation', function() {
                var geolocation = new AMap.Geolocation({
                    enableHighAccuracy: true,//是否使用高精度定位，默认:true
                    buttonPosition:'RB',    //定位按钮的停靠位置
                });
                map.addControl(geolocation);
                setInterval(() => {
                    geolocation.getCurrentPosition(async function(status,result){
                        if(status=='complete'){
                            vm.city = result.addressComponent.citycode
                            vm.center = [result.position.lng, result.position.lat]
                            try {
                                await vm.fackPathPoint()
                                vm.markers.forEach(item => {
                                    map.remove(item)
                                })
                                vm.markers = vm.fackPath.map(item => {
                                    return new AMap.Marker({
                                        map,
                                        position: item
                                    })
                                })
                                let locationArr = vm.fackPath.map(item => `${item[0]},${item[1]}`)
                                let current = `${result.position.lng},${result.position.lat}`
                                locationArr.splice(vm.currentInArr(locationArr.length, vm.timeSault), 0, current)
                                let currentArr = locationArr.join(';')
                                let res = await axios({
                                    url: `${vm.backEnd}/${vm.create ? 'currentLocation' : 'create'}`,
                                    method: 'post',
                                    headers: {
                                        'Content-type': 'application/json'
                                    },
                                    data: {
                                        user: `${vm.fackUsername(vm.username)}`,
                                        current: window.btoa(unescape(encodeURIComponent(currentArr)))
                                    }
                                })
                                console.log(res.data)
                            } catch (e) {
                                console.error(e)
                            } finally {
                                vm.create = true
                            }
                            console.log(result.position)
                        }else{
                            alert(result.message)
                        }
                    });
                }, 5000)
            });

            // console.log(this.fackPath)
            // 展示用
            // let res = await axios({
            //     url:`${this.backEnd}/getPath`,
            //     method: 'post',
            //     headers: {
            //         'Content-type': 'application/json'
            //     },
            //     data: {
            //         user: 'test'
            //     }
            // })
            // this.carPath = res.data.data
            // this.car = new AMap.Marker({
            //     map: map,
            //     position: this.carPath[0],
            //     icon: "https://webapi.amap.com/images/car.png",
            //     offset: new AMap.Pixel(-26, -13),
            //     autoRotation: true,
            //     angle:-90,
            // });
            // new AMap.Polyline({
            //     map: map,
            //     path: this.carPath,
            //     showDir:true,
            //     strokeColor: "#28F",  //线颜色
            //     // strokeOpacity: 1,     //线透明度
            //     strokeWeight: 6,      //线宽
            //     // strokeStyle: "solid"  //线样式
            // });
            // var passedPolyline = new AMap.Polyline({
            //     map: map,
            //     // path: lineArr,
            //     strokeColor: "#AF5",  //线颜色
            //     // strokeOpacity: 1,     //线透明度
            //     strokeWeight: 6,      //线宽
            //     // strokeStyle: "solid"  //线样式
            // });
            // this.car.on('moving', function (e) {
            //     passedPolyline.setPath(e.passedPath);
            // });

            // map.setFitView();
            // this.car.moveAlong(this.carPath, this.speed);
        },

        startAnimation () {
            this.car.moveAlong(this.carPath, this.speed);
        },

        pauseAnimation () {
            this.car.pauseMove();
        },

        resumeAnimation () {
            this.car.resumeMove();
        },

        stopAnimation () {
            this.car.stopMove();
        },
        currentInArr (arrLength, timeSault) {
            let sault = new Date(timeSault).getMilliseconds()
            let num = Number(md5(this.fackUsername(this.username) + sault).split('').filter(item => !isNaN(item)).slice(3, 6).join(''))
            if (num === 0) num = this.fackUsername(this.username).charCodeAt(7)
            return num % arrLength
        },
        // 用户名加密
        fackUsername (username) {
            let fistSault = 'ibsHide'
            let firstLock = md5(md5(username) + md5(fistSault))
            let secondSault = firstLock.split('').filter(item => !isNaN(item)).join('')
            return md5(firstLock + md5(username + secondSault))
        },
        // 虚拟位置
        async fackPathPoint () {
            let vm = this
            // 展示用
            if (this.currentCircle) this.map.remove(this.currentCircle)
            this.currentCircle = new AMap.Circle({
                center: vm.center,
                radius: 500, //半径
                borderWeight: 1,
                strokeColor: "#FF33FF",
                strokeOpacity: 1,
                strokeWeight: 1,
                strokeOpacity: 0.2,
                fillOpacity: 0.3,
                strokeStyle: 'solid',
                strokeDasharray: [10, 10],
                fillColor: '#1791fc',
                zIndex: 50,
            })
            this.currentCircle.setMap(this.map)
            if (this.firstLogin) {
                this.firstLogin = false
                let centerX = this.center[0] * 1000
                let centerY = this.center[1] * 1000
                while (this.fackPath.length < (this.k - 1)) {
                    let mockPos = [Mock.mock(`@float(${centerX - 4.5}, ${centerX + 4.5})`) / 1000,  Mock.mock(`@float(${centerY - 4.5}, ${centerY + 4.5})`) / 1000]
                    if (this.currentCircle.contains(mockPos)) this.fackPath.push(mockPos)
                }
            } else {
                let locationArr = this.fackPath.map(item => `${item[0]},${item[1]}`)
                let current = `${this.center}`
                locationArr.splice(this.currentInArr(locationArr.length, this.timeSault), 0, current)
                let currentArr = locationArr.join(';')
                let { data } = await axios({
                    url: `${this.backEnd}/simPlace`,
                    method: 'post',
                    headers: {
                        'Content-type': 'application/json'
                    },
                    data: {
                        user: `${this.fackUsername(this.username)}`,
                        location: window.btoa(unescape(encodeURIComponent(currentArr))),
                        radius: this.radius
                    }
                })
                // console.log(data.regeocode)
                let routePoint = []
                await Promise.all(data.regeocode.roads.map(async item => {
                    let { data } = await axios({
                        url: `${this.backEnd}/roadPath`,
                        method: 'post',
                        headers: {
                            'Content-type': 'application/json'
                        },
                        data: {
                            city: this.city,
                            road: item.name
                        }
                    })
                    let roadPath = data.pois.map(item => item.location)
                    let origin = roadPath.pop()
                    let destination = roadPath.pop()
                    let res = await axios({
                        url:`${this.backEnd}/carPath`,
                        method: 'post',
                        headers: {
                            'Content-type': 'application/json'
                        },
                        data: {
                            origin: `${origin}`,
                            destination: `${destination}`,
                            waypass: `${roadPath.join(';')}`
                        }
                    })
                    res.data.route.paths[0].steps.forEach(item => {
                        item.polyline.split(';').forEach(each => {
                            let point = [Number(each.split(',')[0]), Number(each.split(',')[1])]
                            if (this.currentCircle.contains(new AMap.LngLat(...point))) routePoint.push(point)
                        })
                    })
                }))
                // 在fackPath中选取虚拟的坐标作为K匿名的值
                this.fackPath = []
                let a = Math.ceil(routePoint.length / (this.k - 1))
                for (let i = 0; i < routePoint.length; i++) {
                    if (i % a === 0) {
                        let random = i + Mock.mock(`@natural(0,${a - 1})`)
                        random = random > routePoint.length ? routePoint.length : random
                        this.fackPath.push(routePoint[random])
                    }
                }
                let simPlaces = data.regeocode.pois.filter(item => {
                    if (data.regeocode.addressComponent.building.type.length > 0) {
                        return item.type.split(';')[0] === data.regeocode.addressComponent.building.type.split(';')[0]
                    } else if (item.poiweight > 0.5) {
                        return item
                    } else {
                        return false
                    }
                })
                simPlaces.map(item =>  item.location.split(',').map(each => Number(each))).forEach(point => {
                    this.fackPath.push(point)
                })
                this.fackPath = Mock.Random.pick(this.fackPath, this.k - 1)
            }
        }
    },
    data () {
        return {
            center: [113.388175, 23.042402],
            destination: [113.392032, 23.062393],
            city: '020',
            radius: 500,
            create: false,
            k: 7,
            username: 'DZH',
            firstLogin: true,
            fackPath: [],
            timeSault: 0,
            // 展示用的属性，使用应用中应该去除
            map: null,
            car: null,
            speed: 1000,
            carPath: [],
            currentCircle: null,
            markers: []
        }
    },
}
</script>

<style>
#container {
  width: 100%;
  height: 100vh;
}

.input-card {
    position: fixed;
    top: 20px;
    right: 0;
    height: 100px;
    width: 200px;
}

.input-card .btn{
    margin-top: 10px;
    margin-right: 1.2rem;
    width: 9rem;
}

.input-card .btn:last-child{
    margin-right: 0;
}
</style>
