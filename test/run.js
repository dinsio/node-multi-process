const multi_process = require('../index')

try {
    let failed = []
    function should(expected,name) {
        if (eval(expected) !== true) failed.push(name)
    }
    if (multi_process.current.isMaster) {
        multi_process.fork()
        should(`multi_process.current.id === null`,'master.id')
        should(`multi_process.current.isMaster === true`,'master.isMaster')
        should(`multi_process.current.isWorker === false`,'master.isWorker')
        should(`typeof multi_process.current.sendMsg2Worker === 'function'`,'master.sendMsg2Worker')
        should(`typeof multi_process.current.createWorker === 'function'`,'master.createWorker')
        should(`typeof multi_process.current.sendMsg2Master === 'undefined'`,'master.sendMsg2Master')
        should(`typeof multi_process.current.onMasterRun === 'function'`,'master.onMasterRun')
        should(`typeof multi_process.current.onWorkerRun === 'function'`,'master.onWorkerRun')
        if (failed.length === 0) console.log('master passed')
    }
    else {
        should(`multi_process.current.id !== null`,'worker.id')
        should(`multi_process.current.isMaster === false`,'worker.isMaster')
        should(`multi_process.current.isWorker === true`,'worker.isWorker')
        should(`typeof multi_process.current.sendMsg2Worker === 'undefined'`,'worker.sendMsg2Worker')
        should(`typeof multi_process.current.createWorker === 'undefined'`,'master.createWorker')
        should(`typeof multi_process.current.sendMsg2Master === 'function'`,'worker.sendMsg2Master')
        should(`typeof multi_process.current.onMasterRun === 'undefined'`,'worker.onMasterRun')
        should(`typeof multi_process.current.onWorkerRun === 'undefined'`,'worker.onWorkerRun')
        if (failed.length === 0) console.log('worker passed')
        process.exit()
    }
}
catch (err) {
    console.log('Error:',err)
}