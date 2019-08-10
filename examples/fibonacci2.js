/**
 * how to run a fibonacci runner in multi-process mode
 */
const cpus = require('os').cpus().length
const fibonacci = require ('fibonacci')
const multi_process = require('../index')

multi_process.onMasterRun(function(master){
    let start = new Date().getTime()
    let stop = 0
    let done = 0
    master.on('message', function(worker,obj){
        if (obj === 'done') done++
        if (done === cpus) {
            stop = new Date().getTime()
            console.log('multi-process mode time cost is', (stop-start), 'ms')
            process.exit()
        }
    })
    console.log('multi-process mode begin')
    start = new Date().getTime()
    for (let  i = 0; i < cpus; i++) { 
        multi_process.createWorker()
    }
})

multi_process.onWorkerRun(function(worker){
    worker.on('message', function(msg){
        console.log('worker ' + worker.id + ' received:',msg)
    })
    fibonacci.iterate(10000)
    worker.sendMsg2Master('done')
})
