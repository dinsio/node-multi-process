# 为什么 Nodejs 官方自带的 'cluster' 模块太烂了？

我们都知道 nodejs 是一个单线程的 Javascript，但有时候我们还是想要尽可能利用电脑的多核运算能力，比如进行大量数学运算和加解密运算的时候。感谢 nodejs 社区建设者，很早就给我们提供了一个自带的 cluster 模块，但是我必须得说，这个模块的 api 设计简直就是灾难，既不语义化，也不符合直觉。

这里有两段正确运行的代码，我说它正确，是因为的确都能按照我的预期运行，但我可没说这代码很好理解。

#### *例子 1: 把消息处理器绑定给 cluster*
#### **[Source Code](https://github.com/dinsio/node-multi-process/blob/master/examples/officialCluster1.js)**
~~~
let cluster = require('cluster')

if (cluster.isMaster) {

    // 既然我是一个 master 进程，那么先定义一下怎么处理来自 worker 的消息吧
    cluster.on('message', function(worker,msg){
        console.log('master received from worker ' + worker.id + ' :',msg)
        console.log('master send msg back to worker ' + worker.id)

        worker.send('456')
        // 等一下，不对啊，为什么是 worker.send()?
        // 我不是一个 master 吗？这个 worker 参数不是指的消息来源吗？
        // 那么 worker 应该是我要回发消息的对象吧，为什么在这句代码里 worker 成了主语？
        // 到底是谁在给谁发消息？
        // 我 100% 确信这个代码是可以正常工作的，而且消息也被发回给了 worker 进程
        // 可是这个语义化，真的太糟糕了！
    })

} 
else {

    // 这里应该是 worker 进程了吧
    console.log('worker',cluster.worker.id,'created')

    // 我同样要给它绑定一个消息处理器
    // 但是这里怎么是 process.on()？不应该是一个 worker 什么的吗？
    process.on('message', function(msg){
        console.log('worker', cluster.worker.id, 'received:', msg)
    })

    // process.send() 这个子进程发了一条消息出去，嗯，难得有句不费解的代码
    console.log('worker', cluster.worker.id , 'send msg to master')
    process.send('123')
}
~~~

### 例子 2: 把消息处理器绑定到 worker 实例
#### **[Source Code](https://github.com/dinsio/node-multi-process/blob/master/examples/officialCluster2.js)**
~~~
let cluster = require('cluster')

if (cluster.isMaster) {

    // 我现在是一个 master 进程，所以由我来 fork 一个 worker 进程出来
    let worker = cluster.fork()

    // 然后给这个新创建的 worker 进程绑定消息处理器
    worker.on('message', function(msg){

        console.log('master received from worker ' + worker.id + ' :',msg)
        // 卧了个槽！什么情况？这段代码不是应该在 worker 进程运行吗？
        // 你为什么要打印说我是个 master？好吧，就算我是个 master 吧

        console.log('master send msg back to worker ' + worker.id)
        worker.send('456')
        // 等一下！ worker.send()?
        // 你不是刚打印说我是 master 吗？我都已经认了啊
        // 那样的话，worker 就应该是我要发送消息的目标对象，怎么这里又变成主语了？
        // 彻底晕了，我现在到底是谁？你是想弄死我好继承我的花呗嘛？
    })

} 
else {

    // 终于到了 worker 进程的代码区了
    console.log('worker',cluster.worker.id,'created')

    // 这是在搞什么？给 worker 进程定义消息处理器？
    // 那么刚才上边的代码我们在干什么？
    // 这个 process 又是个什么鬼？
    process.on('message', function(msg){
        console.log('worker', cluster.worker.id, 'received:', msg)
    })

    // 赶紧看一下这句还算正常的代码缓一缓
    console.log('worker', cluster.worker.id , 'send msg to master')
    process.send('123')
}
~~~

### 我就问你，操不操蛋？闹不闹心？你这思路我完全理解不能啊，快要疯了！

所以我决定改变这一状况，咱自己搞一个 multi-process 的包来自救吧。

#

### **[返回我的 'multi-process' 模块文档](https://github.com/dinsio/node-multi-process/blob/master/docs/readme_cn.md)**
