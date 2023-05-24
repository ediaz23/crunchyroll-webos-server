
import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'

const app = express()

const router = express.Router()
const router2 = express.Router()
const port = 8052

router2.post('/', async (req, res) => {
    const { webosService } = await import('../crunchyroll-webos-service/index')
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
    console.log(`req ${body.method} ${body.url}`)
    webosService['forwardRequest'](message)
})


router.post('/', async (req, res) => {
    const { body } = req
    const { url } = body
    delete body.url

    console.log(`req ${body.method} ${url}`)
    try {
        const result = await fetch(url, body)
        res.statusCode = result.status
        res.statusMessage = result.statusText
        result.body.pipe(res)
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: e.toString() })
    }
})

app.use(cors())
app.use(express.json())

app.use('/webos', router)
app.use('/webos2', router2)

app.listen(port, () => {
    console.log(`api escuchando en el puerto ${port}`)
})
