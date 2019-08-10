# Why Nodejs Official Module 'cluster' Sucks?

Nodejs is a single-thread javascript runtime, but sometimes we really need to enable the multi-core computing ability of our computers. Thanks to good nodejs contributors, they provided us an official module 'cluster', but i have to say, the apis of this module is a huge disaster, neither semantic nor intuitive.

Here are 2 *correct* code segments, when i say 'correct', it means these 2 codes indeed run as i expected, but i never guarantee it's easy to understand.

### Case 1: bind message handler to cluster
#### **[Source Code](https://github.com/dinsio/node-multi-process/blob/master/examples/officialCluster1.js)**
~~~
let cluster = require('cluster')

if (cluster.isMaster) {

    // it says i am a master process now
    // so i should first define how to handle messages from worker processes
    cluster.on('message', function(worker,msg){
        console.log('master received from worker ' + worker.id + ' :',msg)
        console.log('master send msg back to worker ' + worker.id)

        worker.send('456')
        // wait wait wait, why worker.send()?
        // you just printed i am a master
        // and worker is the message source passed in as a parameter
        // so it is also the tareget i should send message to (if needed)
        // then why it becomes the subject of this sentence here?
        // who the hell is going to send message to whom?
        // i'm 100% sure this send() function will send messages to worker
        // but the semanticization, it really sucks!
    })

} 
else {

    // i guess this is where a worker process belongs to
    console.log('worker',cluster.worker.id,'created')

    // define a message handler for the worker process
    // but why process appears here? shouldn't it be a worker or what?
    process.on('message', function(msg){
        console.log('worker', cluster.worker.id, 'received:', msg)
    })

    // worker send message to master, this is the only reasonable part.
    console.log('worker', cluster.worker.id , 'send msg to master')
    process.send('123')
}
~~~

### Case 2: bind message handler to worker process
#### **[Source Code](https://github.com/dinsio/node-multi-process/blob/master/examples/officialCluster2.js)**
~~~
let cluster = require('cluster')

if (cluster.isMaster) {

    // it says i am a master process now
    // so i should fork a worker process to run
    let worker = cluster.fork()

    // define a message handler for this new worker process
    worker.on('message', function(msg){

        console.log('master received from worker ' + worker.id + ' :',msg)
        // WTF! am i not running in a worker process?
        // why you print that i am a master?

        console.log('master send msg back to worker ' + worker.id)
        worker.send('456')
        // wait wait wait, worker.send()?
        // you just printed i am a master
        // in that case, the worker should be a tareget i send message to
        // but worker becomes the subject of this sentence here.
        // i'm confused, who the hell am i?

    })

} 
else {

    // i guess this is where a worker process belongs to
    console.log('worker',cluster.worker.id,'created')

    // define a message handler for the worker process
    // wait! why do this again? i just defined it previously!
    // why process appears here? shouldn't it be a worker or what?
    process.on('message', function(msg){
        console.log('worker', cluster.worker.id, 'received:', msg)
    })

    // worker send message to master, this is reasonable.
    console.log('worker', cluster.worker.id , 'send msg to master')
    process.send('123')
}
~~~

### What a pain in the ass! I can't follow, i can't understand, i am going crazy!

So i decided to change this situation, that is why we have multi-process package now!

#

### **[Back To 'multi-process' Module Document](https://github.com/dinsio/node-multi-process/blob/master/README.md)**
