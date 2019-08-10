/**
 * how to run a fibonacci runner in single-process mode 
 */
const cpus = require('os').cpus().length
const fibonacci = require ('fibonacci')

let start = new Date().getTime()
console.log('single-process mode begin')
for (let i=0; i<cpus; i++) {
    fibonacci.iterate(10000)
}
let stop = new Date().getTime()
console.log('single-process mode time cost is',(stop-start),'ms')
