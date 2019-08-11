'use strict'

const EventEmitter = require('events').EventEmitter

function WorkerProcess(cluster) {

    if (cluster.isMaster) throw new Error('current process is a master')

    EventEmitter.call(this)
    
    let self = this
    let worker = cluster.worker

    // properties
    this.id = worker.id
    this.isMaster = cluster.isMaster
    this.isWorker = cluster.isWorker
    this.process = worker.process

    // methods
    this.disconnect = worker.disconnect
    this.isConnected = worker.isConnected
    this.isDead = worker.isDead
    this.suicide = worker.kill
    this.sendMsg2Master = function(msg) {
        return worker.send(msg)
    }

    // events
    worker.on('online', () => {
        self.emit('online')
    })
    worker.on('listening', (address) => {
        self.emit('listening',address)
    })
    worker.on('message', (msg) => {
        self.emit('message',msg)
    })
    worker.on('error', (err) => {
        self.emit('error',err)
    })
    worker.on('disconnect', () => {
        self.emit('disconnect')
    })
    worker.on('exit', (code,signal) => {
        self.emit('exit',code,signal)
    })

    this._original_cluster_ = cluster
    this._original_worker_ = cluster.worker
}

WorkerProcess.prototype = WorkerProcess
WorkerProcess.prototype.__proto__ = EventEmitter.prototype

module.exports = WorkerProcess