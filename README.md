# **multi-process Document / 文档**

A better wrapper for nodejs official module 'cluster'. This will save your ass from the nightmares which are caused by the bad apis design of module 'cluster'. Adding multi-process feature to your nodejs application will become a pleasure.

这是一个对 nodejs 自带官方 cluster 模块的二次封装，它能将你从官方 cluster 的糟糕 API 设计当中拯救出来！让你轻松愉悦的给自己的 nodejs 应用增加多进程能力。

### **[中文版文档点这里](https://github.com/dinsio/node-multi-process/blob/master/docs/readme_cn.md)**

## **Module 'cluster' sucks!**

Why nodejs official module 'cluster' sucks? it's a long story, so if you are interested, feel free to give it a shot!

**[Why Nodejs Official Module 'cluster' Sucks?](https://github.com/dinsio/node-multi-process/blob/master/docs/why_nodejs_official_cluster_sucks_en.md)**

or let's skip to multi-process directly!

## **multi-process Installation**

~~~
npm install multi-process

or

yarn add multi-process
~~~

You should notice that multi-process module is ***available in nodejs only!*** As for versions supported, the 'cluster' module came out very early, so there are almost no limitations.

## **How To Use**

I will rewrite the code segments in **[Why Nodejs Official Module 'cluster' Sucks?](https://github.com/dinsio/node-multi-process/blob/master/docs/why_nodejs_official_cluster_sucks_en.md)** as comparisions, two modes provided.

There is no need to write comments at all!

### Case 1:
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

### Case 2: here is another mode even better
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

As you can see, the only thing i did is to make codes more logical and more semantic. Hope you will enjoy it.

## **A Real World Usage - Fibonacci Runner**

### Case 1: single-process mode runner
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

#### Result: about 60s

### Case 2: multi-process mode runner
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

#### Result: about 25s, A good performance improvement!

## **My APIS**

First of all, you should know i didn't change the original 'cluster' too much!

I only added some properties, some methods, some references, just to make the whole thing looks more semantic and more intuitive.

Here We Go!

### multi_process

- properties

  - isMaster - just the same as cluster.isMaster
  - isWorker - just the same as cluster.isWorker
  - current - get the current process instance
    - properties
      - isMaster - a tag to mark if the current process is a master
      - isWorker - a tag to mark if the current process is a worker
  - master - when the current process is a master, you will have this property
    - properties
      - id - null
      - isMaster - true
      - isWorker - false
    - methods
      - sendMsg2Worker(msg,worker) - a method sends message to a worker process
        - msg - Object - message content
        - worker - Worker - the worker process you send message to
  - worker - when the current process is a worker, you will have this property
    - properties
      - id - current worker process id
      - isMaster - false
      - isWorker - true
    - methods
      - sendMsg2Master(msg) - a method sends message to a master process
        - msg - Object - message content
  - cluster - here is a ref to the original cluster, in case you need it

- methods

  - createWorker() - create a worker process at once
  - onMasterRun(callback) - register a callback function to master process
    - callback(master) - Function - run after the master process is ready
      - master - the master instance
  - onWorkerRun(callback) - register a callback function to worker process
    - callback(worker) - Function - run after the worker process is ready
      - worker - the worker instance

## **Examples**

I provided several examples to explain every thing about this module, you can find them in my github repostry.

**[Source Code](https://github.com/dinsio/node-multi-process/blob/master/examples)**

- examples
  - officialCluster1.js - how the official cluster module works in cluster-bind mode
  - officialCluster2.js - how the official cluster module works in worker-bind mode
  - multiProcess1.js - how the multi-process module works in normal mode
  - multiProcess2.js - how the multi-process module works in registeration mode
  - fibonacci1.js - how to run a fibonacci runner in single-process mode
  - fibonacci1.js - how to run a fibonacci runner in multi-process mode

### Hope it is helpful to you guys !