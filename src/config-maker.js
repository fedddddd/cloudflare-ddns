const path = require('path')
const fs   = require('fs')

if (fs.existsSync(path.join(__dirname, '../config/config.json'))) {
    module.exports = new Promise((resolve, reject) => {
        resolve(require('../config/config.json'))
    })
    
    return
}

if (!fs.existsSync('./config')) {
    fs.mkdirSync('./config')
}

const config = {cloudflare: {}}

var configFinished = false

const questions = [
    {
        text: `Cloudflare token: `,
        callback: (value) => {
            if (value) {
                config.cloudflare.token = value
            }

            return true
        }
    },
    {
        text: `Cloudflare email: `,
        show: () => {
            return !config.cloudflare.token
        },
        callback: (value) => {
            if (!value) {
                return false
            }

            config.cloudflare.email = value
            return true
        }
    },
    {
        text: `Cloudflare key: `,
        show: () => {
            return !config.cloudflare.token
        },
        callback: (value) => {
            if (!value) {
                return false
            }

            config.cloudflare.key = value
            return true
        }
    },
    {
        text: `Domain: `,
        callback: (value) => {
            if (!value) {
                return false
            }

            config.domain = value
            return true
        }
    },
    {
        text: `Subdomain: `,
        callback: (value) => {
            if (!value) {
                return false
            }

            configFinished = true
            config.subdomain = value
            return true
        }
    }
]

module.exports = new Promise((resolve, reject) => {
    const readline = require('readline')

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    rl._writeToOutput = (string) => {
        if (string.includes('\r')) {
            rl.muted = false
        }

        rl.output.write(rl.muted ? '*' : string)
    }

    const askQuestion = (index) => {
        var question = questions[index]

        if (question.show != undefined && !question.show()) {
            askQuestion(index + 1)
        }

        rl.question(question.text, (string) => {
            string = string.trim().length > 0 ? string : null

            var nextIndex = index + 1
            const next = (_index) => {
                nextIndex = _index
            }

            const result = question.callback(string, next)
            if (result && nextIndex >= questions.length) {
                rl.close()
                return
            }
            
            result
                ? askQuestion(nextIndex)
                : askQuestion(index)
        })

        if (question.hidden) {
            rl.muted = true
        }
    }

    askQuestion(0)

    rl.on('close', () => {
        if (!configFinished) {
            console.log('\nConfiguration aborted, exiting')
            process.exit(0)
        }

        fs.writeFile(path.join(__dirname, '../config/config.json'), JSON.stringify(config, null, 4), () => {
            console.log('Configuration saved')
            resolve(config)
        })
    })
})