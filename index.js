
const express = require('express')
const cors = require('cors')
const fetch = require('node-fetch')
const path = require('path')
const fs = require('fs')

const app = express()

app.use(cors())

const port = 8052
let cacheRes = {}

//const reset = '\x1b[0m'
//const fgRed = '\x1b[31m'
//const fgGreen = '\x1b[32m'
//const fgYellow = '\x1b[33m'


/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
async function redirectToService(req, res, serviceName) {
    const { webosService } = require('../crunchyroll-webos-service/src/index')
    const { body } = req
    const message = {
        respond: response => {
            if (response.returnValue === false) {
                res.status(500).json(response)
            } else {
                if (response.content) {
                    cacheRes[response.resUrl] = response.content
                }
                res.status(200).json(response)
            }
        },
        payload: body || {}
    }
    webosService[serviceName](message)
}

app.use(express.json({ limit: '50Mb' }))

app.post('/webos', async (req, res) => {
    const { body } = req
    const { url } = body
    delete body.url

    console.log(`req ${body.method} ${url}`)
    try {
        const result = await fetch(url, body)
        const data = await result.arrayBuffer()
        const content = Buffer.from(data).toString('base64')
        const headers = Object.fromEntries(result.headers)
        res.status(200).json({
            status: result.status,
            statusText: result.statusText,
            headers,
            content,
        })
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: e.toString() })
    }
})

app.post('/webos2', (req, res) => redirectToService(req, res, 'forwardRequest0'))

app.post('/compare', async (req, res) => {
    const { body } = req
    /** @type {{url: string}} */
    const { url } = body
    if (url in cacheRes) {
        if (cacheRes[url] !== body.content) {
            console.error('     compare DISTINTS', url)
        } else {
            console.error('  compare', url.substring(0, 60))
        }
        delete cacheRes[url]
    } else {
        console.error('     compare not found', url)
    }
    res.sendStatus(200)
})

app.post('/save-mock-data', async (req, res) => {
    const { body } = req
    const { name, data } = body
    const mockRuta = path.join(__dirname, '../crunchyroll-webos-stream/src/mock-data/data')
    const filePath = path.join(mockRuta, `${name}`)
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf-8')
    res.status(200).send()

})

app.post('/fonts', (req, res) => redirectToService(req, res, 'fonts'))

app.get('/fonts', async (req, res) => {
    const { url } = req.query
    try {
        const filePath = new URL(url).pathname
        const content = fs.readFileSync(filePath)
        res.setHeader('Content-Type', 'font/ttf')
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.status(200).send(content)
    } catch (err) {
        console.error(err)
        res.status(500).send(`Error al leer el archivo: ${err.message}`)
    }
})

const rutaPublica = path.join(__dirname, 'public')

app.get('/hls/:filename', (req, res) => {
    const filename = req.params.filename
    res.sendFile(path.join(rutaPublica + '/hls/', filename))
})

app.get('/:filename', (req, res) => {
    /** @type {String} */
    const filename = req.params.filename
    if (filename.endsWith('.mpd') || filename.endsWith('.mp4') || filename.endsWith('.m4s')) {
        res.sendFile(path.join(rutaPublica + '/dash/', filename))
    } else {
        res.sendFile(path.join(rutaPublica, filename))
    }
})

app.use((req, res, _next) => {
    console.log('--> 404', req.url)
    res.sendStatus(404)
})

app.listen(port, () => {
    console.log(`api escuchando en el puerto ${port}`)
})
