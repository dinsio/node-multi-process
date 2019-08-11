'use strict'

const EventEmitter = require('events').EventEmitter
const MasterProcess = require('./MasterProcess')
const WorkerProcess = require('./WorkerProcess')

function MultiProcess(cluster) {

    EventEmitter.call(this)

    let self = this

    let master = cluster.isMaster ? new MasterProcess(cluster) : null
    let worker = cluster.isWorker ? new WorkerProcess(cluster) : null

    // properties
    this.current = (function(){
        return (cluster.isMaster ? master : worker)
    })()
    this.settings = cluster.settings
    this.workers = cluster.isWorker ? undefined : function() {
        return cluster.workers
    }
    
    // methods
    this.createWorker = cluster.isWorker ? undefined : cluster.fork
    this.setupProcess = cluster.isWorker ? undefined : cluster.setupMaster
    this.disconnect = cluster.isWorker ? undefined : cluster.disconnect
    this.killWorker = cluster.isWorker ? undefined : function(id,signal) {
        cluster.workers[id].kill(signal||'MASTER_KILL')
    }
    this.onMasterRun = function(callback) {
        if (cluster.isMaster && typeof callback === 'function') callback(self.current)
    }
    this.onWorkerRun = function(callback) {
        if (cluster.isWorker && typeof callback === 'function') callback(self.current)
    }

    this._online_worker_ids_ = []
    
    // events
    cluster.on('fork',(worker) => {
        self.emit('create',worker)
    })
    cluster.on('online',(worker) => {
        if (self._online_worker_ids_.indexOf(worker.id) < 0) self._online_worker_ids_.push(worker.id)
    })
    cluster.on('setup', (settings) => {
        self.emit('setup',settings)
    })
    cluster.on('disconnect', (worker) => {
        let idx = self._online_worker_ids_.indexOf(worker.id)
        if (idx >= 0) self._online_worker_ids_.splice(idx,1)
        if (self._online_worker_ids_.length === 0) self.emit('disconnect')
    })

    this.originalCluster = cluster

}

MultiProcess.prototype = MultiProcess
MultiProcess.prototype.__proto__ = EventEmitter.prototype

module.exports = MultiProcess