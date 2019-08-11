/**
 * how the multi-process module works in normal mode
 */
const multi_process = require('../index')
const cpus = require('os').cpus().length

if (multi_process.current.isMaster) {
    let counter = 0
    let master = multi_process.current
    master.on('message', function(worker,obj){
        console.log('master received from worker ' + worker.id + ' :',obj)
        console.log('master send msg back to worker ' + worker.id)
        master.sendMsg2Worker('456',worker)
        if (obj === '123') counter++
        if (counter === cpus) process.exit()
    })
    for (let  i = 0; i < cpus; i++) { 
        let worker = multi_process.createWorker()
        console.log('create worker',worker.id)
    }
}

if (multi_process.current.isWorker) {
    let worker = multi_process.current
    console.log('worker',worker.id,'created')
    worker.on('message', function(msg){
        console.log('worker ' + worker.id + ' received:',msg)
    })
    worker.sendMsg2Master('123')
}
