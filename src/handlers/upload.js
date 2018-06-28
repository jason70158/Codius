/**
 * @fileOverview Handler to upload codius pod to network
 * @name upload.js<handlers>
 * @author Travis Crist
 */

const { getCurrencyDetails, unitsPerHost } = require('../common/price.js')
const { getValidHosts, cleanHostListUrls } = require('../common/host-utils.js')
const { discoverHosts } = require('../common/discovery.js')
const { uploadManifestToHosts } = require('../common/manifest-upload.js')
const ora = require('ora')
const { generateManifest } = require('codius-manifest')
const statusIndicator = ora({ text: '', color: 'blue', spinner: 'point' })
const codiusState = require('../common/codius-state.js')
const fse = require('fs-extra')
const inquirer = require('inquirer')
const config = require('../config.js')
const jsome = require('jsome')
const logger = require('riverpig')('codius-cli:uploadhandler')

function checkOptions ({ addHostEnv }) {
  // If the host number is set but the add host env is not specified warn the user
  if (!addHostEnv) {
    statusIndicator.warn('Hosts will NOT be added to the HOSTS env in the generated manifest.')
  }
}

async function addHostsToManifest (status, { addHostEnv }, manifestJson, hosts) {
  if (addHostEnv) {
    status.start('Adding hosts to HOSTS env in generated manifest')
    const containers = manifestJson.manifest.containers
    for (const container of containers) {
      if (container.environment.HOSTS) {
        throw new Error('HOSTS env variable already exists in a container. Option --add-hosts-env cannot be used if the HOSTS env already exists in any container.')
      }
      container.environment = container.environment || {}
      container.environment.HOSTS = JSON.stringify(hosts)
    }
    status.succeed()
  }
}

function getUploadOptions ({ maxMonthlyRate = config.price.amount, duration, units = config.price.units }) {
  return {
    maxMonthlyRate: maxMonthlyRate,
    duration: duration,
    units: units
  }
}

async function upload (options) {
  checkOptions(options)

  try {
    await codiusState.validateOptions(statusIndicator, options)
    statusIndicator.start('Generating Codius Manifest')
    const generatedManifestObj = await generateManifest(options.codiusVarsFile, options.codiusFile)

    let hostList
    // Skip discover if --host option is used.
    if (!options.host) {
      const codiusHostsExists = await fse.pathExists(options.codiusHostsFile)
      if (options.codiusHostsFile || codiusHostsExists) {
        logger.debug('Codius Hosts File exists, or was provided as a parameter, using it for host list.')
        hostList = (await fse.readJson(options.codiusHostsFile)).hosts
      } else {
        statusIndicator.start('Discovering Hosts')
        const discoverCount = options.hostCount > 50 ? options.hostCount : 50
        hostList = await discoverHosts(discoverCount)
        statusIndicator.succeed(`Discovered ${hostList.length} Hosts`)
      }
    } else {
      hostList = options.host
    }
    const cleanHostList = cleanHostListUrls(hostList)
    statusIndicator.start('Calculating Max Monthly Rate')
    const maxMonthlyRate = await unitsPerHost(options)
    const currencyDetails = await getCurrencyDetails()

    statusIndicator.start(`Checking Host Monthly Rate vs Max Monthly Rate ${maxMonthlyRate.toString()} ${currencyDetails}`)
    const validHostList = await getValidHosts(options, maxMonthlyRate, cleanHostList, generatedManifestObj)
    statusIndicator.succeed()
    addHostsToManifest(statusIndicator, options, generatedManifestObj, validHostList)

    if (!options.assumeYes) {
      console.info(config.lineBreak)
      console.info('Generated Manifest:')
      jsome(generatedManifestObj)
      console.info('will be uploaded to host(s):')
      jsome(validHostList)
      console.info('with options:')
      jsome(getUploadOptions(options))
      statusIndicator.warn('All information in this manifest will be made public!')
      const userResp = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continueToUpload',
          message: `Do you want to proceed with the pod upload?`,
          default: false
        }
      ])
      if (!userResp.continueToUpload) {
        statusIndicator.start('User declined to upload pod')
        throw new Error('Upload aborted by user')
      }
    }
    statusIndicator.start(`Uploading to ${validHostList.length} host(s)`)

    const uploadHostsResponse = await uploadManifestToHosts(statusIndicator,
      validHostList, options.duration, maxMonthlyRate, generatedManifestObj)

    if (uploadHostsResponse.success.length > 0) {
      statusIndicator.start('Updating Codius State File')
      await codiusState.saveCodiusState(options, generatedManifestObj, uploadHostsResponse)
      statusIndicator.succeed(`Codius State File: ${options.codiusStateFile} Updated`)
    }

    process.exit(0)
  } catch (err) {
    statusIndicator.fail()
    logger.error(err)
    process.exit(1)
  }
}

module.exports = {
  upload
}
