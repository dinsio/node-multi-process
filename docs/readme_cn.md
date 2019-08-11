# **multi-process 文档**

这是一个对 nodejs 自带官方 cluster 模块的二次封装，它能将你从官方 cluster 的糟糕 API 设计当中拯救出来！让你轻松愉悦的给自己的 nodejs 应用增加多进程功能。

A wrapper for nodejs official module 'cluster'. This will save your ass from the nightmares which are caused by the bad apis design of module 'cluster'. Adding multi-process feature to your nodejs application will become a pleasant thing.

### **[English Document Is Here](https://github.com/dinsio/node-multi-process/blob/master/README.md)**

<div style="height:20px;"></div>

## **官方自带的 cluster 模块 API 太烂了!**

为什么我说 nodejs 官方自带的 cluster 模块 API 太烂了？这是一个很长的故事，如果你感兴趣可以点下边的链接进去看看。

**[为什么 Nodejs 官方自带的 cluster 模块 API 太烂了?](https://github.com/dinsio/node-multi-process/blob/master/docs/why_nodejs_official_cluster_sucks_cn.md)**

或者你就直接继续往下看 multi-process 的使用方法吧！

<div style="height:20px;"></div>

## **multi-process 的安装**

> npm install multi-process

或者

> yarn add multi-process

请注意 multi-process 这个包 ***只能在 nodejs 下使用!*** 至于 nodejs 版本倒是没什么特别的要求，因为我这里只是重新封装了 cluster，并无其它依赖，而 cluster 很久以前就出现在 nodejs 的早期版本中了。但是考虑到 message 事件回调函数的参数一致性，***nodejs 6.0+ 是必须的***。

<div style="height:20px;"></div>

## **怎么用？**

我会把 **[为什么 Nodejs 官方自带的 cluster 模块 API 太烂了?](https://github.com/dinsio/node-multi-process/blob/master/docs/why_nodejs_official_cluster_sucks_cn.md)** 这篇文章里提到的例子用 multi-process 重写一遍作为对比，提供两种模式。

而且我发现，使用这个包，根本没必要写注释啊……

### 例子 1:
#### **[Source Code](https://github.com/dinsio/node-multi-process/blob/master/examples/multiProcess1.js)**
~~~
const multi_process = require('multi-process')

if (multi_process.current.isMaster) {

    let master = multi_process.current
    master.on('message', function(worker,obj){
        console.log('master received from worker ' + worker.id + ' :',obj)
        console.log('master send msg back to worker ' + worker.id)
        master.sendMsg2Worker('456',worker)
    })

    let worker = multi_process.createWorker()
    console.log('create worker',worker.id)
}

if (multi_process.current.isWorker) {

    let worker = multi_process.current
    console.log('worker',worker.id,'created')
    worker.on('message', function(msg){
        console.log('worker ' + worker.id + ' received:',msg)
    })

    worker.sendMsg2Master('123')
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

<div style="height:20px;"></div>

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

<div style="height:20px;"></div>

## **My APIS**

首先说明一下，我并没有对官方自带的 cluster 进行太多改动。只是给它重新梳理了一下 api，加入了一些属性、方法、引用，使得它看起来更加语义化和符合直觉。

看这里!

当你在你的代码中执行 require('multi-process') 的时候，你实际上得到了一个 [MultiProcess](#multiprocess) 的实例，而它实际上是一个多进程管理器，API 如下：

<div style="height:10px;"></div>
<div id="multiprocess" style="height:1px;"></div>

### **MultiProcess 类**

- #### 属性
  - current - [MasterProcess](#masterprocess) | [WorkerProcess](#workerprocess) - 运行时当前进程的实例
  - settings - 同 [cluster.settings](https://nodejs.org/api/cluster.html#cluster_cluster_settings)
  - workers - 同 [cluster.workers](https://nodejs.org/api/cluster.html#cluster_cluster_workers) - 这里存储了当前所有的 worker 进程实例
  - originalCluster - [Cluster](https://nodejs.org/api/cluster.html#cluster_cluster) - 它是我们引用的原始 cluster 对象，放在这里以备万一你用到

- #### 方法
  - createWorker() - 同 [cluster.fork()](https://nodejs.org/api/cluster.html#cluster_cluster_fork_env) - 创建一个新的 worker 进程
    - 返回值 - [cluster.Worker](https://nodejs.org/api/cluster.html#cluster_class_worker) - 新的进程实例
  - setupProcess() - 同 [cluster.setupMaster()](https://nodejs.org/api/cluster.html#cluster_cluster_fork_env)
  - disconnect() - 同 [cluster.disconnect()](https://nodejs.org/api/cluster.html#cluster_cluster_disconnect_callback) - 将会断开所有 worker 进程与 master 进程的连接
  - killWorker(id[,signal]) - 根据 id 杀掉一个 worker 进程
    - id - String - worker 进程 id
    - signal - String - [signal parameter in kill()](https://nodejs.org/api/cluster.html#cluster_worker_kill_signal_sigterm)
  - onMasterRun(callback) - 给 master 进程注册一个处理器，当 master 进程开始时执行
    - callback(master) - Function - 你想要在 master 进程开始时执行的代码
      - master - 我们当前的 master 进程实例
  - onWorkerRun(callback) - 给 worker 进程注册一个处理器，当每一个 worker 进程开始时执行
    - callback(worker) - Function - 你想要在 worker 进程开始时执行的代码
      - worker - 我们当前的 worker 进程实例

- #### 事件
  - on('create',(worker)=>{}) - 多进程管理器开始创建一个新的 worker 进程
    - worker - [cluster.Worker](https://nodejs.org/api/cluster.html#cluster_class_worker) - 新创建出来的 worker 实例
  - on('setup',(settings)=>{}) - 多进程管理器对进程进行设置
    - settings - [cluster.settings](https://nodejs.org/api/cluster.html#cluster_cluster_settings) - 设置的内容
  - on('disconnect',()=>{}) - 所有 worker 进程都已断开连接

<div style="height:10px;"></div>
<div id="masterprocess" style="height:1px;"></div>

### **MasterProcess 类**

- #### 属性
  - id - Null - 这里你会得到一个 null
  - isMaster - Boolean - 当然是 true 了
  - isWorker - Boolean - 当然是 false 了

- #### 方法
  - sendMsg2Worker(msg,worker) - 给指定 worker 进程发送消息
    - msg - Object - 要发送的消息内容
    - worker - [cluster.Worker](https://nodejs.org/api/cluster.html#cluster_class_worker) - 消息发送对象
    - returns - Boolean

- #### 事件
  - on('message',(worker,msg)=>{}) - master 进程收到消息
    - worker - [cluster.Worker](https://nodejs.org/api/cluster.html#cluster_class_worker) - 消息的来源 worker 进程实例
    - msg - Object - 收到的消息内容

<div style="height:10px;"></div>
<div id="workerprocess" style="height:1px;"></div>

### **WorkerProcess 类**

- #### 属性
  - id - Number - worker 进程 id
  - isMaster - Boolean - 当然是 false 了
  - isWorker - Boolean - 当然是 true 了
  - process - [ChildProcess](https://nodejs.org/api/child_process.html#child_process_class_childprocess) - 同 [worker.process](https://nodejs.org/api/cluster.html#cluster_worker_process)

- #### 方法
  - disconnect() - 同 [worker.disconnect()](https://nodejs.org/api/cluster.html#cluster_worker_disconnect) - 当前 worker 进程将自己与 master 进程断开连接
  - isConnected() - 同 [worker.isConnected()](https://nodejs.org/api/cluster.html#cluster_worker_isconnected) - 返回当前 worker 进程与 master 进程的连接状态
    - returns - Boolean
  - isDead() - 同 [worker.isDead()](https://nodejs.org/api/cluster.html#cluster_worker_isdead) - 当前 worker 进程是否已经终止
    - returns - Boolean
  - suicide() - 同 [worker.kill()](https://nodejs.org/api/cluster.html#cluster_worker_kill_signal_sigterm) - 当前 worker 进程自行终止
  - sendMsg2Master(msg) - 发送消息到 master 进程
    - msg - Object - 要发送的内容
    - returns - Boolean

- #### 事件
  - on('online',()=>{}) - 当前 worker 进程已经准备好
  - on('listening',(address)=>{}) - 当前 worker 进程开始侦听端口，仅限 net 相关模块才有用
    - address - [Event:'listening'](https://nodejs.org/api/cluster.html#cluster_event_listening_1) - 侦听地址信息
  - on('message',(msg)=>{}) - 当前 worker 进程收到消息
    - msg - Object - 消息内容
  - on('error',(err)=>{}) - 一个跟进程 fork 相关的错误被抛出
    - err - Error - 被捕捉到的错误
  - on('disconnect',()=>{}) - 当前 worker 进程断开了与 master 进程的连接
  - on('exit',(code,signal)=>{}) - 当前进程挂掉了
    - code - Number - 退出代码
    - signal - String - 当前 worker 进程退出时的信号码

<div style="height:20px;"></div>

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

<div style="height:20px;"></div>

### 希望这个模块能帮到大家！