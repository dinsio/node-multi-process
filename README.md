# **multi-process Document / 文档**

A better wrapper for nodejs official module 'cluster'. This will save your ass from the nightmares which are caused by the bad apis design of module 'cluster'. Adding multi-process feature to your nodejs application will become a pleasure.

这是一个对 nodejs 自带官方 cluster 模块的二次封装，它能将你从官方 cluster 的糟糕 API 设计当中拯救出来！让你轻松愉悦的给自己的 nodejs 应用增加多进程能力。

### **[中文版文档点这里](https://github.com/dinsio/node-multi-process/blob/master/docs/readme_cn.md)**

<div style="height:40px;"></div>

## **Module 'cluster' sucks!**

Why nodejs official module 'cluster' sucks? it's a long story, so if you are interested, feel free to give it a shot!

**[Why Nodejs Official Module 'cluster' Sucks?](https://github.com/dinsio/node-multi-process/blob/master/docs/why_nodejs_official_cluster_sucks_en.md)**

or let's skip to multi-process directly!

<div style="height:40px;"></div>

## **multi-process Installation**

> npm install multi-process

or

> yarn add multi-process

You should notice that multi-process module is ***available in nodejs only!*** As for versions supported, the 'cluster' module came out very early, but for the 'message' event callback function parameters concern, ***nodejs 6.0+ is required***.

<div style="height:40px;"></div>

## **How To Use**

I will rewrite the code segments in **[Why Nodejs Official Module 'cluster' Sucks?](https://github.com/dinsio/node-multi-process/blob/master/docs/why_nodejs_official_cluster_sucks_en.md)** as comparisions, two modes provided.

There is no need to write comments at all!

### Case 1:
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

<div style="height:40px;"></div>

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

<div style="height:40px;"></div>

## **My APIS**

First of all, you should know i didn't change the original 'cluster' too much!

I only added some properties, some methods, some references, just to make the whole thing looks more semantic and more intuitive.

Here is something you should know about, this will help you to understand multi-process!

> To solve the semanticization problems, i first analyzed the original 'cluster' module APIs and classify them, after that i created 3 classes, **[Class MultiProcess](#multiprocess)**, **[Class MasterProcess](#masterprocess)** and **[Class WorkerProcess](#workerprocess)** by reassigning proper APIs to proper class, finally we have 3 brand new classes with semantic and intuitive APIs. 

> When you execute require('multi-process') in your code, you actually get an instance of **[Class MultiProcess](#multiprocess)**, which should be considered as a multiple process manager. Property ***MultiProcess.current*** is a reference to the process you are running, it may be either a master process or a worker process, in either case, i will wrap the current process to an instance of MasterProcess or WorkerProcess based on it's type, and then refer MultiProcess.current to this instance. From now on we can do almost anything by operating ***MultiProcess.current*** only.

<div style="height:20px;"></div>
<div id="multiprocess" style="height:1px;"></div>

### **Class MultiProcess**

- #### Properties
  - current - [MasterProcess](#masterprocess) | [WorkerProcess](#workerprocess) - current process instance in your runtime
  - settings - the same as [cluster.settings](https://nodejs.org/api/cluster.html#cluster_cluster_settings)
  - workers - the same as [cluster.workers](https://nodejs.org/api/cluster.html#cluster_cluster_workers) - get all your running worker processes
  - originalCluster - [Cluster](https://nodejs.org/api/cluster.html#cluster_cluster) - the cluster object we wrapped, just in case you need it somehow.

- #### Methods
  - createWorker() - the same as [cluster.fork()](https://nodejs.org/api/cluster.html#cluster_cluster_fork_env) - create a new worker process
    - returns - [cluster.Worker](https://nodejs.org/api/cluster.html#cluster_class_worker) - the new worker process instance
  - setupProcess() - the same as [cluster.setupMaster()](https://nodejs.org/api/cluster.html#cluster_cluster_fork_env)
  - disconnect() - the same as [cluster.disconnect()](https://nodejs.org/api/cluster.html#cluster_cluster_disconnect_callback) - this will force each worker process to disconnect to master process
  - killWorker(id[,signal]) - kill a worker process by id
    - id - String - the worker process id
    - signal - String - [signal parameter in kill()](https://nodejs.org/api/cluster.html#cluster_worker_kill_signal_sigterm)
  - onMasterRun(callback) - register a handler to master process when it is ready
    - callback(master) - Function - the handler function you want to run
      - master - the master process instance you get
  - onWorkerRun(callback) - register a handler to worker process when it is ready
    - callback(worker) - Function - the handler function you want to run
      - worker - the worker process instance you get

- #### Events
  - on('create',(worker)=>{}) - the manager begin to fork a new worker process
    - worker - [cluster.Worker](https://nodejs.org/api/cluster.html#cluster_class_worker) - the new worker process instance you create
  - on('setup',(settings)=>{}) - the manager setup the process
    - settings - [cluster.settings](https://nodejs.org/api/cluster.html#cluster_cluster_settings) - the new settings content
  - on('disconnect',()=>{}) - all worker processes disconnected

<div style="height:20px;"></div>
<div id="masterprocess" style="height:1px;"></div>

### **Class MasterProcess**

- #### Properties
  - id - Null - here you get null
  - isMaster - Boolean - here you get true of course
  - isWorker - Boolean - here you get false of course

- #### Methods
  - sendMsg2Worker(msg,worker) - send a message to worker process
    - msg - Object - the message content you want to send
    - worker - [cluster.Worker](https://nodejs.org/api/cluster.html#cluster_class_worker) - the worker process you want to send message to
    - returns - Boolean

- #### Events
  - on('message',(worker,msg)=>{}) - master process get a message
    - worker - [cluster.Worker](https://nodejs.org/api/cluster.html#cluster_class_worker) - the worker process who send you this message
    - msg - Object - message content

<div style="height:20px;"></div>
<div id="workerprocess" style="height:1px;"></div>

### **Class WorkerProcess**

- #### Properties
  - id - Number - the worker process id
  - isMaster - Boolean - here you get false of course
  - isWorker - Boolean - here you get true of course
  - process - [ChildProcess](https://nodejs.org/api/child_process.html#child_process_class_childprocess) - the same as [worker.process](https://nodejs.org/api/cluster.html#cluster_worker_process)

- #### Methods
  - disconnect() - the same as [worker.disconnect()](https://nodejs.org/api/cluster.html#cluster_worker_disconnect) - this worker process will disconnect itself from master process
  - isConnected() - the same as [worker.isConnected()](https://nodejs.org/api/cluster.html#cluster_worker_isconnected) - return whether this worker is connected to master process
    - returns - Boolean
  - isDead() - the same as [worker.isDead()](https://nodejs.org/api/cluster.html#cluster_worker_isdead) - return whether this worker has terminated
    - returns - Boolean
  - suicide() - the same as [worker.kill()](https://nodejs.org/api/cluster.html#cluster_worker_kill_signal_sigterm) - the worker process kill iteself
  - sendMsg2Master(msg) - send a message to master process
    - msg - Object - the message content you want to send
    - returns - Boolean

- #### Events
  - on('online',()=>{}) - the worker process is ready
  - on('listening',(address)=>{}) - the worker process begin to listen, this is only available in net-related modules
    - address - [Event:'listening'](https://nodejs.org/api/cluster.html#cluster_event_listening_1) - listening address info
  - on('message',(msg)=>{}) - worker process get a message
    - msg - Object - message content
  - on('error',(err)=>{}) - a process-fork-related error jumps out
    - err - Error - the error caught
  - on('disconnect',()=>{}) - worker processes disconnected from master process
  - on('exit',(code,signal)=>{}) - the worker process dies
    - code - Number - the exit code
    - signal - String - the name of the signal that caused the process to be exited

<div style="height:40px;"></div>

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

<div style="height:40px;"></div>

### Hope it is helpful to you guys !