const MultiProcess = require('../src/MultiProcess')
const MasterProcess = require('../src/MasterProcess')
const WorkerProcess = require('../src/WorkerProcess')

let failed = []
function should(expected,name) {
    if (eval(expected) !== true) failed.push(name)
}

let cluster = require('cluster')

let mp = new MultiProcess(cluster)
should("mp.current.isMaster === cluster.isMaster","mp.isMaster")
should("mp.current.isWorker === cluster.isWorker","mp.isWorker")
should("mp.settings === mp.originalCluster.settings","mp.settings")
if (mp.isMaster) should("mp.workers == mp.originalCluster.workers","mp.workers")
should("mp.createWorker === mp.originalCluster.fork","mp.createWorker")
should("mp.setupProcess === mp.originalCluster.setupMaster","mp.setupProcess")
should("mp.disconnect === mp.originalCluster.disconnect","mp.disconnect")
if (mp.isMaster) should("mp.killWorker === mp.originalCluster.killWorker","mp.killWorker")
should("typeof mp.onMasterRun === 'function'","mp.onMasterRun")
should("typeof mp.onWorkerRun === 'function'","mp.onWorkerRun")

let map = null
let wp = null
if (mp.current.isMaster) {
    map = new MasterProcess(cluster)
    should("map.isMaster === true","master.isMaster")
    should("map.isWorker === false","master.isWorker")
    should("typeof map.sendMsg2Worker === 'function'","master.sendMsg2Worker")
    if (failed.length === 0) console.log('master process test pass')
    mp.createWorker()
}
else {
    wp = new WorkerProcess(cluster)
    should("wp.isMaster === false","")
    should("wp.isWorker === true","")
    should("wp.process === wp._original_worker_.process","")
    should("wp.disconnect === wp._original_worker_.disconnect","")
    should("wp.isConnected === wp._original_worker_.isConnected","")
    should("wp.isDead === wp._original_worker_.isDead","")
    should("wp.suicide === wp._original_worker_.kill","")
    should("typeof wp.sendMsg2Master === 'function'","")
    if (failed.length === 0) console.log('worker process test pass')
    process.exit()
}
