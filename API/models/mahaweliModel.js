const db = require('../config/db.js')

exports.getAllTanks = async (req, res)=> {
    const result = await db.query("SELECT * FROM mahawelitanks")
    console.log(result.rows)
    res.status(200).json(
        {
            status: "success",
            data: result.rows
        }
    )

}
exports.getTankbyId = async (req,res)=>{
    const result = db.query("SELECT * FROM mahawelitanks WHERE id =")
}