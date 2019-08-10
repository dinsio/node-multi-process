# **multi-process 文档**

这是一个对 nodejs 自带官方 cluster 模块的二次封装，它能将你从官方 cluster 的糟糕 API 设计当中拯救出来！让你轻松愉悦的给自己的 nodejs 应用增加多进程功能。

A wrapper for nodejs official module 'cluster'. This will save your ass from the nightmares which are caused by the bad apis design of module 'cluster'. Adding multi-process feature to your nodejs application will become a pleasant thing.

### **[English Document Is Here](https://github.com/dinsio/node-multi-process/blob/master/README.md)**

## **官方自带的 cluster 模块 API 太烂了!**

为什么我说 nodejs 官方自带的 cluster 模块 API 太烂了？这是一个很长的故事，如果你感兴趣可以点下边的链接进去看看。

**[为什么 Nodejs 官方自带的 cluster 模块 API 太烂了?](https://github.com/dinsio/node-multi-process/blob/master/docs/why_nodejs_official_cluster_sucks_cn.md)**

或者你就直接继续往下看 multi-process 的使用方法吧！

## **multi-process 的安装**

~~~
npm install multi-process

或者

yarn add multi-process
~~~

请注意 multi-process 这个包 ***只能在 nodejs 下使用!*** 至于 nodejs 版本倒是没什么特别的要求，因为我这里只是重新封装了 cluster，并无其它依赖，而 cluster 很久以前就出现在 nodejs 的早期版本中了，所以基本没有限制。

## **怎么用？**

我会把 **[为什么 Nodejs 官方自带的 cluster 模块 API 太烂了?](https://github.com/dinsio/node-multi-process/blob/master/docs/why_nodejs_official_cluster_sucks_cn.md)** 这篇文章里提到的例子用 multi-process 重写一遍作为对比，提供两种模式。

而且我发现，使用这个包，根本没必要写注释啊……

### 例子 1:
#### **[Source Code](https://github.com/dinsio/node-multi-process/blob/master/examples/multiProcess1.js)**
~~~
const multi_process = require('multi-process')

if (multi_process.current.isMaster) {

    multi_process.master.on('message', function(worker,obj){
        console.log('master received from worker ' + worker.id + ' :',obj)
        console.log('master send msg back to worker ' + worker.id)
        multi_process.master.sendMsg2Worker('456',worker)
    })

    let worker = multi_process.createWorker()
    console.log('create worker',worker.id)
}

if (multi_process.current.isWorker) {

    console.log('worker',multi_process.worker.id,'created')
    multi_process.worker.on('message', function(msg){
        console.log('worker ' + multi_process.worker.id + ' received:',msg)
    })

    multi_process.worker.sendMsg2Master('123')
}
~~~

### 例子 2: 这里提供了一种更加符合 JavaScript 风格的语法表达
#### **[Source Code](https://github.com/dinsio/node-multi-process/blob/master/examples/multiProcess2.js)**
~~~
const multi_process = require('multi-process')

multi_process.onMasterRun(function(master) {

    master.on('message', function(worker,obj){
        console.log('master received from worker ' + worker.id + ' :',obj)
        console.log('master send msg back to worker ' + worker.id)
        master.sendMsg2Worker('456',worker)
    })

    let worker = multi_process.createWorker()
    console.log('create worker',worker.id)
})

multi_process.onWorkerRun(function(worker){

    console.log('worker', worker.id, 'created')
    worker.on('message', function(msg){
        console.log('worker ' + worker.id + ' received:',msg)
    })

    worker.sendMsg2Master('123')
})
~~~

就像你看到的那样，我唯一做的一件事就是让代码更语义化更有逻辑了，希望你也喜欢这个风格

## **真实用例 - 斐波那契数列**

### 例子 1: 单进程运行模式
#### **[Source Code](https://github.com/dinsio/node-multi-process/blob/master/examples/fibonacci1.js)**
~~~
const cpus = require('os').cpus().length
const fibonacci = require ('fibonacci')

let start = new Date().getTime()
for (let i=0; i<cpus; i++) {
    fibonacci.iterate(10000)
}
let stop = new Date().getTime()
console.log('single-process mode time cost',(stop-start),'ms')
~~~

#### 结果: 大约耗时 60s

### 例子 2: 多进程模式运行
#### **[Source Code](https://github.com/dinsio/node-multi-process/blob/master/examples/fibonacci2.js)**
~~~
const cpus = require('os').cpus().length
const fibonacci = require ('fibonacci')
const multi_process = require('multi-process')

multi_process.onMasterRun(function(master){
    let start = new Date().getTime()
    let stop = 0
    let done = 0
    master.on('message', function(worker,obj){
        if (obj === 'done') done++
        if (done === cpus) {
            stop = new Date().getTime()
            console.log('multi-process mode time cost', (stop-start), 'ms')
            process.exit()
        }
    })
    start = new Date().getTime()
    for (let  i = 0; i < cpus; i++) { 
        multi_process.fork()
    }
})

multi_process.onWorkerRun(function(worker){
    worker.on('message', function(msg){
        console.log('worker ' + worker.id + ' received:',msg)
    })
    fibonacci.iterate(10000)
    worker.sendMsg2Master('done')
})
~~~

#### 结果: 大约耗时 25s, 性能表现有了非常明显的提升！

## **My APIS**

首先说明一下，我并没有对官方自带的 cluster 进行太多改动。只是给它重新梳理了一下 api，加入了一些属性、方法、引用，使得它看起来更加语义化和符合直觉。

看这里!

### multi_process

- 属性

  - isMaster - 跟 cluster.isMaster 是一样的
  - isWorker - 跟 cluster.isWorker 是一样的
  - current - 获得当前进程的实例
    - 属性
      - isMaster - 标记当前进程是否是个 master
      - isWorker - 标记当前进程是否是个 worker
  - master - 只有当前进程是 master 的时候，你才能访问到这个属性
    - 属性
      - id - null
      - isMaster - true
      - isWorker - false
    - 方法
      - sendMsg2Worker(msg,worker) - 发送消息到 worker 进程
        - msg - Object - 消息体，可以是 object
        - worker - Worker - 要发送的 worker 对象
  - worker - 只有当前进程是 master 的时候，你才能访问到这个属性
    - 属性
      - id - 当前 worker 进程的 id
      - isMaster - false
      - isWorker - true
    - methods
      - sendMsg2Master(msg) - 发送消息到 master 进程
        - msg - Object - 消息体
  - cluster - 这里维持了一个对自带 cluster 的引用, 以防万一你用到它

- 方法

  - createWorker() - 创建一个 worker 进程
  - onMasterRun(callback) - 给 master 进程注册回调函数
    - callback(master) - Function - 当 master 进程创建成功之后就会执行这一函数
      - master - 被创建出来的 master 进程实例
  - onWorkerRun(callback) - 给 worker 进程注册回调函数
    - callback(worker) - Function - 当 worker 进程创建成功之后就会执行这一函数
      - worker - 被创建出来的 worker 进程实例

## **Examples**

Examples 目录里面我提供了几个例子来解释和说明跟这个模块相关的所有事情，你可以在我的 github 仓库里找到源码

**[源码链接](https://github.com/dinsio/node-multi-process/blob/master/examples)**

- examples
  - officialCluster1.js - 演示怎样用官方模块通过给 cluster 绑定消息处理器的方式实现主从进程交互
  - officialCluster2.js - 演示怎样用官方模块通过给 worker 绑定消息处理器的方式实现主从进程交互
  - multiProcess1.js - 演示用 multi-process 模块来实现相同功能的常规代码模式
  - multiProcess2.js - 演示用 multi-process 模块来实现相同功能的注册回调代码模式
  - fibonacci1.js - 演示单进程斐波那契运算
  - fibonacci1.js - 演示用 multi-process 模块实现多进程加速斐波那契运算

### 希望这个模块能帮到大家！