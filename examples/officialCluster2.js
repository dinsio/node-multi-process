/**
 * how the official cluster module works in worker-bind mode
 */
const cluster = require('cluster')
const cpus = require('os').cpus().length

if (cluster.isMaster) {
    let counter = 0
    for (let  i = 0; i < cpus; i++) { 
        let worker = cluster.fork()
        worker.on('message', function(msg){
            console.log('master received from worker ' + worker.id + ' :',msg)
            console.log('master send msg back to worker ' + worker.id)
            worker.send('456')
            if (msg === '123') counter++
            if (counter === cpus) process.exit()
        })
        console.log('create worker',worker.id)
    }
} 
else {
    console.log('worker',cluster.worker.id,'created')
    process.on('message', function(msg){
        console.log('worker', cluster.worker.id, 'received:', msg)
    })
    console.log('worker', cluster.worker.id , 'send msg to master')
    process.send('123')
}
