import { createDatabase } from './db.js'
import { createApp } from './app.js'

const db = createDatabase()
const app = await createApp(db)
const port = Number(process.env.PORT || 3000)
app.listen(port, '0.0.0.0', () => console.log(`Collective Edit server listening on ${port}`))
