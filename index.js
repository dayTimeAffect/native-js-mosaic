// 获取鼠标定位
// 获取鼠标定位范围size的像素平均值
// 设置该范围内所有像素点的值为上一步所取值

window.onload = () => {
    const revocation = document.getElementById('revocation')
    const recover = document.getElementById('recover')

    const mosaic = new CreateMosaic('content', 'myCanvas')
    revocation.onclick = () => mosaic.revocation()
    recover.onclick = () => mosaic.recover()
}

function CreateMosaic(contentId, canvasId){
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
    // 判断是否超过上一次马赛克范围
    const judgeD = (currentP, lastP, r) => {
        const [x1, y1] = currentP, [x2, y2] = lastP
        return Math.sqrt(Math.pow(Math.abs(x1 - x2), 2) + Math.pow(Math.abs(y1 - y2), 2)) <= r
    }
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
    // 设置范围内像素值
    const setPxColor = (imgDate, color) => {
        for (let i = 0; i < imgDate.data.length; i ++){
            imgDate.data[i] = color[i % 4]
        }
        return imgDate
    }
    // 计算出图片等比缩放的宽高
    const calculate = (cw, pw, ph) => {
        ph = ph * ( cw / pw )
        pw = cw
        return {pw, ph}
    }
    // 初始化参数
    const init = () =>{
        const content = document.getElementById(contentId)
        const canvas = document.getElementById(canvasId);
        const painting = canvas.getContext('2d');
        const size = 20 // 每次马赛克范围，像素
        let lastP = [0, 0] // 最后一次绘制中心点
        let isPrint = false // 绘制启动
        let brushFollow = false // 画笔启动
        let brush = null // 画笔
        let handleData = [] // 每次操作步骤
        let cacheDeleteData = [] // 缓存撤销数据用于恢复
        let scale = 1 // 缩放倍数
        let imgWH = [] // 图片原始宽高
        content.style.position = 'relative'
        content.style.overflow = 'hidden'
        return { content, canvas, painting, size, lastP, isPrint, brushFollow, brush, handleData, cacheDeleteData, scale, imgWH }
    }

    let { content, canvas, painting, size, lastP, isPrint, brushFollow, brush, handleData, cacheDeleteData, scale, imgWH } = init()
    const img = new Image();
    img.src = '3.jpg'
    img.crossOrigin = '';//跨域
    img.onload = () => {
        const {pw, ph} = calculate(canvas.width, img.width, img.height)
        imgWH = [img.width, img.height]
        canvas.height = ph
        painting.drawImage(img, 0, 0, pw, ph);
        handleData.push(painting.getImageData(0, 0, canvas.width, canvas.height))
    }

    content.onwheel = e => {
        const { offsetX, offsetY, wheelDelta } = e
        if (wheelDelta > 0){
            scale = scale - 0.1 >= 0.7 ? scale - 0.1 : 0.7
        }else{
            scale = scale + 0.1 <= 2.5 ? scale + 0.1 : 2.5
        }
        content.style.transform = `scale(${scale})`
        content.style.transformOrigin = `${offsetX}px ${offsetY}px`
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

    return {
        revocation,
        recover,
    }
}
