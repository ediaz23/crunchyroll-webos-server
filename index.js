
import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'
const app = express()

const router = express.Router()
const port = 8052


router.post('/', async (req, res) => {
    const { body } = req
    const { url } = body
    delete body.url

    console.log(`req ${body.method}`)
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

app.listen(port, () => {
    console.log(`api escuchando en el puerto ${port}`)
})
