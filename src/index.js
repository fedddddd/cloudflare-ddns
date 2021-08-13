const fetch = require('node-fetch')
const parse = require('parse-duration')

require('./config-maker')
.then(async (config) => {
    if (!config.cloudflare) {
        console.log('Cloudflare authentication configuration missing (needs token or email & key)')
        return
    }
    
    if (!config.domain || !config.subdomain) {
        console.log('Missing domain or subdomain in configuration')
        return
    }
    
    const cf = require('cloudflare')(config.cloudflare)
    
    const domain    = config.domain
    const subdomain = config.subdomain
    const interval  = parse(config.interval || '5min') || 5 * 60 * 1000
    
    const getExternalAddress = async () => {
        const result = await (await fetch('https://extreme-ip-lookup.com/json/')).json()
        return result.query
    }
    
    const zone = (await cf.zones.browse()).result.find(zone => zone.name == domain.toLowerCase())
    
    if (!zone) {
        console.log('Domain not found')
        return
    }

    var record = (await cf.dnsRecords.browse(zone.id)).result.find(record => record.name == subdomain)
    if (!record) {
        const address = await getExternalAddress()
        const result = await cf.dnsRecords.add(zone.id, {
            name: subdomain,
            type: 'A',
            content: address,
            ttl: 1
        })

        console.log(`Created record: type: A, name: ${subdomain}, content: ${address}, ttl: 1`)

        record = result.result
    } else {
        console.log('Record found')
    }

    const updateRecord = async () => {
        const address = await getExternalAddress()
        if (record.content == address) {
            return
        }

        record = (await cf.dnsRecords.edit(zone.id, record.id, {
            name: subdomain,
            type: 'A',
            ttl: 1,
            content: address
        })).result

        console.log(`Updated record: content: ${address}`)
    }

    await updateRecord()
    setInterval(updateRecord, interval)
})