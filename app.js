const express = require('express')
const app = express()
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const path = require('path')
app.use(express.json())
const bcrypt = require('bcrypt')

let db = null

const dbPath = path.join(__dirname, 'userData.db')

const initializeServerAndDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server is up and running')
    })
  } catch (e) {
    console.log(`DB ERROR : ${e.message}`)
    process.exit(1)
  }
}

initializeServerAndDB()

//API-1
app.post('/register/', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const q = `
    select * from user where username = '${username}';
    `
  const presentUser = await db.get(q)
  if (presentUser === undefined) {
    if (password.length >= 5) {
      const hashedPassword = await bcrypt.hash(password, 10)
      const sec_q = `
            insert into user(username,name,password,gender,location)
            values('${username}','${name}','${hashedPassword}','${gender}','${location}');
            `
      await db.run(sec_q)
      response.status(200)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

//API-2
app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const q = `
    select * from user where username = '${username}';
    `
  const presentUser = await db.get(q)
  if (presentUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isCorrectPassword = await bcrypt.compare(
      password,
      presentUser.password,
    )
    if (isCorrectPassword) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

//API-3
app.put('/change-password/', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const q = `
    select * from user where username = '${username}';
    `
  const presentUser = await db.get(q)
  const isvalid = await bcrypt.compare(oldPassword, presentUser.password)
  if (isvalid) {
    if (newPassword.length >= 5) {
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      const sec_q = `
      update user set password= '${hashedPassword}' 
      where username = '${username}';
      `
      await db.run(sec_q)
      response.status(200)
      response.send('Password updated')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('Invalid current password')
  }
})

module.exports = app
