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

export default {
    mounted() {
        this.init()
    },
    methods: {
        async init () {
            let vm = this
            var map = new AMap.Map('container', {
                center: vm.center,
                resizeEnable: true,
                zoom: 16
            });

            map.plugin(["AMap.ToolBar"], function() {
                map.addControl(new AMap.ToolBar())
            });

            // map.on('click', (e) => {
            //     console.log(e.lnglat)
            // })

            let { data } = await axios({
                url: `${this.backEnd}/simPlace`,
                method: 'post',
                headers: {
                    'Content-type': 'application/json'
                },
                data: {
                    location:`${this.center}`,
                    radius: this.radius
                }
            })
            let fackPath = []
            let circle = new AMap.Circle({
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
                // 线样式还支持 'dashed'
                fillColor: '#1791fc',
                zIndex: 50,
            })

            circle.setMap(map)
            console.log(data.regeocode)
            await Promise.all(data.regeocode.roads.map(async item => {
                let { data } = await axios({
                    url: `${this.backEnd}/roadPath`,
                    method: 'post',
                    headers: {
                        'Content-type': 'application/json'
                    },
                    data: {
                        city: vm.city,
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
                        if (circle.contains(new AMap.LngLat(...point))) fackPath.push(point)
                    })
                })
            }))
            // 在fackPath中选取虚拟的坐标作为K匿名的值
            // fackPath.forEach(item => {
            //     new AMap.Marker({
            //         map,
            //         position: item
            //     })
            // })
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
                new AMap.Marker({
                    map,
                    position: point,
                    icon: 'https://vdata.amap.com/icons/b18/1/2.png'
                })
            })
            new AMap.Marker({
                map,
                position: vm.center,
                icon: 'https://vdata.amap.com/icons/b18/1/2.png'
            })

            map.plugin(["AMap.ToolBar"], function() {
                map.addControl(new AMap.ToolBar());
            });

            // 当前精确定位
            AMap.plugin('AMap.Geolocation', function() {
                var geolocation = new AMap.Geolocation({
                    enableHighAccuracy: true,//是否使用高精度定位，默认:true
                    buttonPosition:'RB',    //定位按钮的停靠位置
                });
                map.addControl(geolocation);
                // setInterval(() => {
                //     geolocation.getCurrentPosition(function(status,result){
                //         if(status=='complete'){
                //             vm.city = result.addressComponent.citycode
                //             // axios({
                //             //     url: `${vm.backEnd}/${vm.create ? 'currentLocation' : 'create'}`,
                //             //     method: 'post',
                //             //     headers: {
                //             //         'Content-type': 'application/json'
                //             //     },
                //             //     data: {
                //             //         user: 'DZH',
                //             //         current: `${result.position.lng},${result.position.lat}`
                //             //     }
                //             // }).then(res => {console.log(res)}).finally(() => {
                //             //     vm.create = true
                //             // })
                //             console.log(result.position)
                //         }else{
                //             alert(result.message)
                //         }
                //     });
                // }, 5000)
            });
            let res = await axios({
                url:`${this.backEnd}/carPath`,
                method: 'post',
                headers: {
                    'Content-type': 'application/json'
                },
                data: {
                    origin: `${this.center}`,
                    destination: `${this.destination}`,
                    waypass: ''
                }
            })
            this.carPath.push(this.center)
            res.data.route.paths[0].steps.forEach(item => {
                item.polyline.split(';').forEach(each => {
                    this.carPath.push([Number(each.split(',')[0]), Number(each.split(',')[1])])
                })
            })
            this.carPath.push(this.destination)

            this.car = new AMap.Marker({
                map: map,
                position: this.center,
                icon: "https://webapi.amap.com/images/car.png",
                offset: new AMap.Pixel(-26, -13),
                autoRotation: true,
                angle:-90,
            });
            new AMap.Polyline({
                map: map,
                path: this.carPath,
                showDir:true,
                strokeColor: "#28F",  //线颜色
                // strokeOpacity: 1,     //线透明度
                strokeWeight: 6,      //线宽
                // strokeStyle: "solid"  //线样式
            });
            var passedPolyline = new AMap.Polyline({
                map: map,
                // path: lineArr,
                strokeColor: "#AF5",  //线颜色
                // strokeOpacity: 1,     //线透明度
                strokeWeight: 6,      //线宽
                // strokeStyle: "solid"  //线样式
            });
            this.car.on('moving', function (e) {
                passedPolyline.setPath(e.passedPath);
            });

            map.setFitView();
            this.car.moveAlong(this.carPath, this.speed);
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
    },
    data () {
        return {
            center: [113.388175, 23.042402],
            destination: [113.392032, 23.062393],
            city: '020',
            webServeKey: 'fbe03fc0e064ce1011a6e3a47c1494e3',
            car: null,
            carPath: [],
            radius: 500,
            speed: 1000,
            create: false
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
