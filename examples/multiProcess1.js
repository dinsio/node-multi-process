/**
 * how the multi-process module works in normal mode
 */
const multi_process = require('../index')
const cpus = require('os').cpus().length

if (multi_process.current.isMaster) {
    let counter = 0
    multi_process.master.on('message', function(worker,obj){
        console.log('master received from worker ' + worker.id + ' :',obj)
        console.log('master send msg back to worker ' + worker.id)
        multi_process.master.sendMsg2Worker('456',worker)
        if (obj === '123') counter++
        if (counter === cpus) process.exit()
    })
    for (let  i = 0; i < cpus; i++) { 
        let worker = multi_process.createWorker()
        console.log('create worker',worker.id)
    }
}

if (multi_process.current.isWorker) {
    console.log('worker',multi_process.worker.id,'created')
    multi_process.worker.on('message', function(msg){
        console.log('worker ' + multi_process.worker.id + ' received:',msg)
    })
    multi_process.worker.sendMsg2Master('123')
}
