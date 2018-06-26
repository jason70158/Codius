/**
 * @fileOverview
 * @name extend-manifest.js<cmds>
 * @author Travis Crist
 */

const logger = require('riverpig')('codius-cli:extend-manifest')
const { extendManifestOptions } = require('../cmds/options/options.js')
const { extendManifest } = require('../handlers/extend-manifest.js')

exports.command = 'extend-manifest <manifestHash> [options]'
exports.desc = 'Extends the mainfest hash on the specified host with the provided options.'
exports.builder = extendManifestOptions
exports.handler = async function (argv) {
  logger.debug(`Extend manifest args: ${JSON.stringify(argv)}`)
  await extendManifest(argv)
}
