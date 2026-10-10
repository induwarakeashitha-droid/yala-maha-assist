const db = require('../config/db.js')

exports.getAllTanks = async (req, res)=> {
    const result = await db.query("SELECT * FROM mahawelitanks")

}
