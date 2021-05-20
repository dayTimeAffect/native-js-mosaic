# 开门见山
接了个需求，图片处理新增马赛克，可以撤销上一步与还原撤销

# 技术需求
`JS`、`canvas`

# 设计思路
+ canvas画布绘制图片，保证图片比例不变，并且画布不能有留白
+ 鼠标在画布上移动时，获取鼠标位置
+ 获取鼠标定位范围size(每个马赛克大小)的像素平均值
+ 将该区域所有像素点的rgba设为刚刚所求的平均值
+ 循环2-4步,绘制前需要判断当前绘制点与上一次绘制点是否相离太近
+ 导出原尺寸大小的马赛克图片url
+ 撤销：保存每一次打马赛克后的图片数据
+ 恢复：缓存撤销数据

# 代码实现
### 定义一个函数,接受容器ID和canvasID
```
//html
<div id="content"><canvas id="myCanvas" width="1200" height="0"></canvas></div>

//js
function CreateMosaic(contentId, canvasId){
    //所有代码均在此函数内部
}
```
### 定义初始化函数，返回所需变量
```javascript
// 初始化参数
    const init = () =>{
        const content = document.getElementById(contentId)
        const canvas = document.getElementById(canvasId);
        const painting = canvas.getContext('2d');
        const size = 20 // 每次马赛克范围，像素
        let lastP = [0, 0] // 最后一次绘制中心点
        let isPrint = false // 绘制启动, true表示可绘制，false表示不可绘制
        let brushFollow = false // 画笔启动
        let brush = null // 画笔
        let handleData = [] // 每次操作步骤
        let cacheDeleteData = [] // 缓存撤销数据用于恢复
        let imgWH = [] // 图片原始宽高
        return { content, canvas, painting, size, lastP, isPrint, brushFollow, brush, handleData, cacheDeleteData, imgWH }
    }
let { content, canvas, painting, size, lastP, isPrint, brushFollow, brush, handleData, cacheDeleteData, imgWH } = init()

```
### 图片按canvas宽度等比缩放，并设置canvas最后的高与图片缩放后的高度一致
```javascript
// 计算出图片等比缩放的宽高
const calculate = (cw, pw, ph) => {
    ph = ph * ( cw / pw )
    pw = cw
    return {pw, ph}
}

const img = new Image();
    img.src = '图片地址'
    img.crossOrigin = '';//跨域
    img.onload = () => {
        const {pw, ph} = calculate(canvas.width, img.width, img.height)
        imgWH = [img.width, img.height]
        painting.drawImage(img, 0, 0, pw, ph);
        canvas.height = ph
        handleData.push(painting.getImageData(0, 0, canvas.width, canvas.height))
    }
```
### 定义求鼠标定位范围size(每个马赛克大小)的像素平均值
```javascript
// 获取范围内像素均值
    const getPxAVG = (imgDate) => {
        const data = imgDate.data
        let r = 0, g = 0, b = 0, a = 0
        const sumPx = data.length / 4
        for (let i = 0; i < sumPx; i ++){
            r = r + data[i * 4]
            g = g + data[i * 4 + 1]
            b = b + data[i * 4 + 2]
            a = a + data[i * 4 + 3]
        }
        return [r / sumPx, g / sumPx, b / sumPx, a / sumPx]
    }
```
### 设置某个区域所有像素点的rgba值
```javascript
// 设置范围内像素值
const setPxColor = (imgDate, color) => {
    for (let i = 0; i < imgDate.data.length; i ++){
        imgDate.data[i] = color[i % 4]
    }
    return imgDate
}
```
### 定义绘制马赛克函数
```javascript
// 绘制马赛克
    const printMosaic = (x, y) => {
        // 获取鼠标定位范围size的像素数据
        const imgData = painting.getImageData(x, y, size, size)
        // 获取范围像素数据平均值
        const pxAVG = getPxAVG(imgData)
        // 创建该区域马赛克图像数据
        let mosaic = setPxColor(painting.createImageData(size, size), pxAVG)
        // 重新绘制
        painting.putImageData(mosaic, x, y)
    }
```
### 定义onmousedown，onmousemove,onmouseup函数
```javascript
// 判断是否超过上一次马赛克范围
    const judgeD = (currentP, lastP, r) => {
        const [x1, y1] = currentP, [x2, y2] = lastP
        return Math.sqrt(Math.pow(Math.abs(x1 - x2), 2) + Math.pow(Math.abs(y1 - y2), 2)) <= r
    }
    canvas.onmousedown = e => {
        if (!brushFollow) return false
        isPrint = true
    }
    canvas.onmousemove = e => {
        const { offsetX, offsetY } = e
        if (!brushFollow) return false
        brush.style.transform = `translate(${offsetX - size / 2}px, ${offsetY - size / 2}px)`
        if (!isPrint) return false
        if (!judgeD([offsetX, offsetY], lastP, size / 2)){
            lastP = [offsetX, offsetY]
            printMosaic(offsetX - (size / 2), offsetY - (size / 2))
        }
    }
    canvas.onmouseup = e => {
        isPrint = false
        handleData.push(painting.getImageData(0, 0, canvas.width, canvas.height))
        cacheDeleteData = []
    }
```
### 定义画笔创建与启动函数
```javascript
    // 创建画笔
    const createBrush = () => {
        const brush = document.createElement('div')
        brush.style.position = 'absolute'
        brush.style.zIndex = '99'
        brush.style.width = size + 'px'
        brush.style.height = size + 'px'
        brush.style.background = 'rgba(233,233,233,0.5)'
        brush.style.pointerEvents = 'none'
        brush.style.left = '0'
        brush.style.right = '0'
        brush.style.transform = `translate(-${size}px, -${size}px)`
        content.appendChild(brush)
        return brush
    }
    // 启动
    const start = () => {
        !brush && (brush = createBrush())
        brushFollow = true
    }
    // 停止
    const stop = () => {
        brush && brush.remove()
        brushFollow = false
        brush = null
    }
    canvas.onmouseenter = start
    canvas.onmouseleave = stop
```
### 撤销与恢复
```javascript
    // 撤销
    const revocation = () => {
        if (handleData.length <= 1) return false
        cacheDeleteData.push(handleData.pop())
        painting.putImageData(handleData[handleData.length - 1], 0, 0)
    }
    // 恢复
    const recover = () => {
        if (cacheDeleteData.length === 0) return false
        handleData.push(cacheDeleteData.pop())
        painting.putImageData(handleData[handleData.length - 1], 0, 0)
    }
    //CreateMosaic暴露这两个函数即可
    return {
        revocation,
        recover,
    }
```
### 返回原始尺寸的马赛克图片
```javascript
//未实际写代码，说一下思路
// 创建一个canvas，宽高为imgWH缓存下的值。display:none，放入dom中。
//将canvas.toDataURL('image/png')结果新赋值给一个新的new Image()
//然后在 新canvas.getContext('2d').drawImage(0, 0, ...[imgWH])绘制
//最后 新canvas.toDataURL('image/png') 就是我们要的结果
```