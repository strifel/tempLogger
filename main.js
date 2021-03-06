const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors')
const sqlite3 = require('sqlite3')
const fs = require('fs')


let dbExists = false;
if (fs.existsSync("database.sqlite")) dbExists = true;
var db = new sqlite3.Database('database.sqlite');
let token;
// Database creation/token loading
if (!dbExists) {
    db.run("CREATE TABLE temps (time INT, sensor VARCHAR(10), humidity INT, temperature INT)")
    db.run("CREATE TABLE system (option TEXT, value TEXT)", () => {
        const crypto = require("crypto");
        token = crypto.randomBytes(30).toString('hex')
        console.log("Your token is: " + token + " \nSave it or read it from the database if you need it again!")
        db.run("INSERT INTO system (option, value) VALUES ('token', ?)", token)
    })
} else {
    db.get("SELECT value FROM system WHERE option='token'", function(err, row) {
        token = row.value;
    });
}
const app = express()
app.use(bodyParser.json())
app.use(express.static('web'));
app.use(cors({
    methods: "GET,HEAD"
}))

app.post('/input/:sensor', function (req, res) {
    if (!req.body.hasOwnProperty('token') || req.body['token'] !== token) {
        res.json({message: "Wrong token"}, 403)
        return
    }
    let temp = req.body['temperature'];
    let humidity = req.body['humidity'];
    let sensor = req.params.sensor;
    db.run("INSERT INTO temps (time, sensor, temperature, humidity) VALUES (?, ?, ?, ?)", Date.now(), sensor, temp, humidity, () => {
        res.json({message: "Temperature saved!"})
    })
})

app.get('/current/all', function (req, res) {
    db.all("SELECT sensor, temperature, humidity, MAX(time) AS lastUpdated FROM temps GROUP BY sensor", (err, rows) => {
        res.json({message: "Loaded Data of all sensors!", sensors: rows})
    })
})

app.get('/current/:sensor', function (req, res) {
    let sensor = req.params.sensor;
    db.get("SELECT temperature, humidity, time AS lastUpdated FROM temps WHERE sensor=? ORDER BY time DESC LIMIT 1", sensor, (err, row) => {
        res.json({message: "Loaded " + sensor + "!", ...row})
    })
})

app.get('/today/:sensor', function (req, res) {
    let sensor = req.params.sensor;
    var start = new Date();
    start.setHours(0,0,0,0);
    db.all("SELECT temperature, humidity, time FROM temps WHERE sensor=? AND time >= ? ORDER BY time ASC", sensor, start.getTime(),(err, rows) => {
        res.json({message: "Loaded " + sensor + " data from today!", data: rows})
    })
})

app.get('/lastDay/:sensor', function (req, res) {
    let sensor = req.params.sensor;
    db.all("SELECT temperature, humidity, time FROM temps WHERE sensor=? AND time >= ? ORDER BY time ASC", sensor, Date.now() - (1000 * 60 * 60 * 24),(err, rows) => {
        res.json({message: "Loaded " + sensor + " data from last 24 hours!", data: rows})
    })
})

app.get('/sensors', function (req, res) {
    db.all("SELECT DISTINCT sensor FROM temps ORDER BY sensor ASC", (err, rows) => {
        res.json({message: "Loaded sensor list!", data: rows})
    })
})

app.listen(8002, "0.0.0.0")
