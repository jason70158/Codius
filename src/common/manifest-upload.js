/**
 * @fileOverview
 * @name manifest-upload.js
 * @author Travis Crist
 */

const logger = require('riverpig')('codius-cli:manifest-upload')
const fetch = require('ilp-fetch')
const config = require('../config.js')
const moment = require('moment')
const { getCurrencyDetails } = require('../common/price.js')
const jsome = require('jsome')

async function fetchUploadManifest (host, duration, maxMonthlyRate, manifestJson) {
  return new Promise((resolve, reject) => {
    fetch(`${host}/pods?duration=${duration}`, {
      headers: {
        Accept: `application/codius-v${config.version.codius.min}+json`,
        'Content-Type': 'application/json'
      },
      maxPrice: maxMonthlyRate,
      method: 'POST',
      body: JSON.stringify(manifestJson)
    }).then(async (res) => {
      if (res.status === 200) {
        await new Promise((resolve) => {
          setTimeout(resolve, 3000)
        })

        resolve({
          status: res.status,
          host,
          response: await res.json(),
          price: res.price
        })
      } else {
        resolve({
          host,
          response: await res.json()
        })
      }
    }).catch((error) => {
      resolve({ host, error })
    })
  })
}

async function uploadManifestToHosts (status, hosts, duration, maxMonthlyRate, manifestJson) {
  const currency = await getCurrencyDetails()
  logger.debug(`Upload to Hosts: ${JSON.stringify(hosts)} Duration: ${duration}`)
  const uploadPromises = hosts.map((host) => {
    return fetchUploadManifest(host, duration, maxMonthlyRate, manifestJson)
  })
  const responses = await Promise.all(uploadPromises)
  const parsedResponses = responses.reduce((acc, curr) => {
    const res = curr.response
    if (curr.status === 200) {
      const successObj = {
        url: res.url,
        manifestHash: res.manifestHash,
        host: curr.host,
        expiry: res.expiry,
        expirationDate: moment(res.expiry).format('MM-DD-YYYY HH:mm:ss ZZ'),
        expires: moment().to(moment(res.expiry)),
        pricePaid: curr.price,
        units: currency
      }
      acc.success = [...acc.success, successObj]
    } else {
      const failedObj = {
        host: curr.host,
        response: res,
        statusCode: res.statusCode || '',
        statusText: res.message || ''
      }
      acc.failed = [...acc.failed, failedObj]
    }
    return acc
  }, { success: [], failed: [] })

  status.succeed('Upload Completed')
  if (parsedResponses.success.length > 0) {
    parsedResponses.success.map((obj) => {
      status.succeed(`Upload to ${obj.host} Successful`)
      jsome(obj)
    })
  }

  if (parsedResponses.failed.length > 0) {
    parsedResponses.failed.map((obj) => {
      status.fail(`Upload to ${obj.host} Failed`)
      jsome(obj)
    })
  }

  console.info(config.lineBreak)
  if (parsedResponses.success.length > 0) {
    status.succeed(`${parsedResponses.success.length} Successful Uploads`)
  }

  if (parsedResponses.failed.length > 0) {
    status.fail(`${parsedResponses.failed.length} Failed Uploads`)
  }

  if (parsedResponses.success.length > 0) {
    status.stopAndPersist({ symbol: 'o', text: `Manifest Hash: ${parsedResponses.success[0].manifestHash}` })
  }

  return parsedResponses
}

module.exports = {
  uploadManifestToHosts
}
