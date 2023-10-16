import { connect } from 'mongoose'
import { contacts } from '../models/index'

export default class DatabaseHandler {
    connected = false
    connection
    models = { contacts }
    constructor(client) {}
    async connect() {
        const url = process.env.MONGODB_URL
        if (!url) {
            this.client.log.error('MONGODB_URL is missing, please fill the value!')
            process.exit(1)
        }
        try {
            const { connection } = await connect(url, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                useFindAndModify: false
            })
            connection.once('open', () => this.client.log.info('Database connection opened!'))
            connection.on('connected', () => this.client.log.info('Database connected!'))
            connection.on('error', (error) => this.client.log.error(error))
            this.connection = connection
            this.connected = true
        } catch (e) {
            this.client.log.error(e)
            this.connection = undefined
            this.connected = false
        }
    }

    saveContacts = async (info) => {
        if (!this.contacts.has('contacts')) {
            const data = await this.getContacts()
            this.contacts.set('contacts', data)
        }
        const data = this.contacts.get('contacts')
        for (const info of infos) {
            if (info.id) {
                const index = data.findIndex(({ id }) => id === info.id)
                if (index >= 0) {
                    if (info.notify !== data[index].notify) data[index].notify = info.notify
                    continue
                }
                data.push({
                    id: info.id,
                    notify: info.notify,
                    status: info.status,
                    imgUrl: info.imgUrl,
                    name: info.name,
                    verifiedName: info.verifiedName
                })
            }
        }
        this.contacts.set('contacts', data)
        await contacts.updateOne({ ID: 'contacts' }, { $set: { data } })
    }

    getContact = (jid) => {
        const contact = this.contacts.get('contacts')
        const isMod = this.config.mods.includes(jid)
        if (!contact)
            return {
                username: 'User',
                jid,
                isMod
            }
        const index = contact.findIndex(({ id }) => id === jid)
        if (index < 0)
            return {
                username: 'User',
                jid,
                isMod
            }
        const { notify, verifiedName, name } = contact[index]
        return {
            username: notify || verifiedName || name || 'User',
            jid,
            isMod
        }
    }

    contacts = new Map()
}
