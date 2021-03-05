<template>
    <div id="app">
        <div id="container">
        </div>
        <div id="panel"></div>
    </div>
</template>

<script>
import AMap from 'AMap'
export default {
    mounted() {
        this.init()
    },
    methods: {
        init: function () {
            var vm = this
            var map = new AMap.Map('container', {
                resizeEnable: true,
                zoom: 15
            });
            map.plugin(["AMap.ToolBar"], function() {
                map.addControl(new AMap.ToolBar());
            });
            AMap.plugin('AMap.Geolocation', function() {
                var geolocation = new AMap.Geolocation({
                    enableHighAccuracy: true,//是否使用高精度定位，默认:true
                    timeout: 10000,          //超过10秒后停止定位，默认：5s
                    buttonPosition:'RT',    //定位按钮的停靠位置
                    buttonOffset: new AMap.Pixel(10, 20),//定位按钮与设置的停靠位置的偏移量，默认：Pixel(10, 20)
                    zoomToAccuracy: true,   //定位成功后是否自动调整地图视野到定位点
                });
                map.addControl(geolocation);
                geolocation.getCurrentPosition(function(status,result){
                    if(status=='complete'){
                        vm.currentPosition = [result.position.lng, result.position.lat]
                        map.setZoom(15);
                    }else{
                        alert(result.message)
                    }
                });
            });
            // AMap.service(["AMap.PlaceSearch"], function() {
            //     //构造地点查询类
            //     var placeSearch = new AMap.PlaceSearch({
            //         type: '餐饮服务', // 兴趣点类别
            //         pageSize: 5, // 单页显示结果条数
            //         pageIndex: 1, // 页码
            //         city: "广州", // 兴趣点城市
            //         citylimit: true,  //是否强制限制在设置的城市内搜索
            //         map: map, // 展现结果的地图实例
            //         panel: "panel", // 结果列表将在此容器中进行展示。
            //         autoFitView: true // 是否自动调整地图视野使绘制的 Marker点都处于视口的可见范围
            //     });
            //     placeSearch.searchNearBy('餐饮服务', vm.currentPosition, 200, function(status, result) {
            //         console.log(status, result)
            //     });
            // });
            var drivingOption = {
                policy: 1, // 其它policy参数请参考 https://lbs.amap.com/api/javascript-api/reference/route-search#m_DrivingPolicy
                ferry: 1, // 是否可以使用轮渡
                province: '京', // 车牌省份的汉字缩写
                map: map,
                panel: 'panel'
            }

            // 构造路线导航类
            var driving = new AMap.Driving(drivingOption)

            // 根据起终点经纬度规划驾车导航路线
            driving.search(new AMap.LngLat(116.379028, 39.865042), new AMap.LngLat(116.427281, 39.903719), function(status, result) {
                // result 即是对应的驾车导航信息，相关数据结构文档请参考  https://lbs.amap.com/api/javascript-api/reference/route-search#m_DrivingResult
                if (status === 'complete') {
                    console.log(result)
                } else {
                    // log.error('获取驾车数据失败：' + result)
                    console.log('fail:' + result)
                }
            });
        }
    },
    data () {
        return {
            currentPosition: [113.39363,23.04218]
        }
    }
}
</script>

<style>
#container {
  width: 100%;
  height: 100vh;
}
#panel {
    position: fixed;
    background-color: white;
    max-height: 90%;
    overflow-y: auto;
    top: 10px;
    right: 10px;
    width: 280px;
    border-bottom: solid 1px silver;
}
</style>
