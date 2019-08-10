'use strict'

let multi_process = require('cluster')

// get current process
multi_process.current = (function(){
    return (multi_process.isMaster ? multi_process : multi_process.worker) 
})()

// alias for fork()
multi_process.createWorker = function () {
    return multi_process.fork()
}

// create shrtcuts
multi_process.master = (function(){
    return (multi_process.isMaster ? multi_process.current : null)
})()
multi_process.worker = (function(){
    return (multi_process.isWorker ? multi_process.current : null)
})()

// set properties
if (multi_process.isMaster) {
    multi_process.master.id = null
    multi_process.master.sendMsg2Worker = function (msg,worker) {
        worker.send(msg)
    }
}
if (multi_process.isWorker) {
    multi_process.worker.isMaster = false
    multi_process.worker.isWorker = true
    multi_process.worker.sendMsg2Master = function (msg) {
        multi_process.worker.send(msg)
    }
}

// register functions
multi_process.onMasterRun = function(fn) {
    if (multi_process.current.isMaster && typeof fn == 'function') fn(multi_process.master)
}
multi_process.onWorkerRun = function(fn) {
    if (multi_process.current.isWorker && typeof fn == 'function') fn(multi_process.worker)
}

// link to the original cluster
multi_process.cluster = multi_process

module.exports = multi_process