
const express = require('express')
const cors = require('cors')
const fetch = require('node-fetch')
const path = require('path')

const app = express()

app.use(cors())

const rutaPublica = path.join(__dirname, 'public')

app.get('/kimi.mpd', (req, res) => {
    res.sendFile(path.join(rutaPublica + '/dash/', 'kimi.mpd'))
})

app.get('/kimi.bif', (req, res) => {
    res.sendFile(path.join(rutaPublica, 'kimi.bif'))
})

app.get('/kimi.ass', (req, res) => {
    res.sendFile(path.join(rutaPublica, 'kimi.ass'))
})

app.get('/segment/:filename', (req, res) => {
    const filename = req.params.filename
    res.sendFile(path.join(rutaPublica + '/dash/', filename))
})

app.get('/hls/:filename', (req, res) => {
    const filename = req.params.filename
    res.sendFile(path.join(rutaPublica + '/hls/', filename))
})

const router = express.Router()
const router2 = express.Router()
const port = 8052

router.post('/', async (req, res) => {
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

//const reset = '\x1b[0m'
//const fgRed = '\x1b[31m'
//const fgGreen = '\x1b[32m'
//const fgYellow = '\x1b[33m'

router2.post('/', async (req, res) => {
    const { webosService } = require('../crunchyroll-webos-service/index')
    const { body } = req
    const message = {
        respond: response => {
            if (response.returnValue === false) {
                res.status(500).json(response)
            } else {
                res.status(200).json(response)
            }
        },
        payload: body || {}
    }
    webosService['forwardRequest0'](message)
})

app.use(express.json())

app.use('/webos', router)
app.use('/webos2', router2)

app.listen(port, () => {
    console.log(`api escuchando en el puerto ${port}`)
})
