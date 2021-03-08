const MongoClient = require('mongodb').MongoClient
const dbUrl = 'mongodb://localhost:27017/'
const dbName = 'ibs'
const connName = 'location'

// 增
async function dboAdd(dbStr) {
    let db = null
    let res = null
    try {
        db = await MongoClient.connect(dbUrl)
        const conn = db.db(dbName).collection(connName)
        res = await conn.insertMany(dbStr)
    } catch (e) {
        res = e
    } finally {
        if (db != null) db.close()
        return res
    }
}
// 改
async function dboUpdate(dbStr) {
    let db = null
    let res = null
    try {
        db = await MongoClient.connect(dbUrl)
        const conn = db.db(dbName).collection(connName)
        res = await conn.updateMany(dbStr.old, dbStr.new)
    } catch (e) {
        res = e
    } finally {
        if (db != null) db.close()
        return res
    }
}
// 删
async function dboDelete(dbStr) {
    let db = null
    let res = null
    try {
        db = await MongoClient.connect(dbUrl)
        const conn = db.db(dbName).collection(connName)
        res = await conn.deleteMany(dbStr)
    } catch (e) {
        res = e
    } finally {
        if (db != null) db.close()
        return res
    }
}
// 查
async function dboSearch(dbStr) {
    let db = null
    let res = null
    try {
        db = await MongoClient.connect(dbUrl)
        const conn = db.db(dbName).collection(connName)
        res = await conn.find(dbStr).toArray()
    } catch (e) {
        res = e
    } finally {
        if (db != null) db.close()
        return res
    }
}

module.exports = { dboAdd, dboDelete, dboSearch, dboUpdate }
