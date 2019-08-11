'use strict'

const cluster = require('cluster')
const MultiProcess = require('./src/MultiProcess')

module.exports = new MultiProcess(cluster)