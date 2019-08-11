'use strict'

const EventEmitter = require('events').EventEmitter

function MasterProcess(cluster) {

    if (cluster.isWorker) throw new Error('current process is a worker')

    EventEmitter.call(this)

    let self = this

    // properties
    this.id = null
    this.isMaster = cluster.isMaster
    this.isWorker = cluster.isWorker

    // methods
    this.sendMsg2Worker = function(msg,worker) {
        return worker.send(msg)
    }

    // events
    cluster.on('message', (worker,msg) => {
        self.emit('message',worker,msg)
    })

    this._original_cluster_ = cluster
}

MasterProcess.prototype = MasterProcess
MasterProcess.prototype.__proto__ = EventEmitter.prototype

module.exports = MasterProcess