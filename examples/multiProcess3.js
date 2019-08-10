const multi_process = require('../index')
const cpus = require('os').cpus().length

if (multi_process.current.isMaster) {
    let counter = 0
    multi_process.current.on('message', function(worker,obj){
        console.log('master received from worker ' + worker.id + ' :',obj)
        console.log('master send msg back to worker ' + worker.id)
        multi_process.current.sendMsg2Worker('456',worker)
        if (obj === '123') counter++
        if (counter === cpus) process.exit()
    })
    for (let  i = 0; i < cpus; i++) { 
        let worker = multi_process.createWorker()
        console.log('create worker',worker.id)
    }
}

if (multi_process.current.isWorker) {
    console.log('worker',multi_process.current.id,'created')
    multi_process.current.on('message', function(msg){
        console.log('worker ' + multi_process.current.id + ' received:',msg)
    })
    multi_process.current.sendMsg2Master('123')
}

