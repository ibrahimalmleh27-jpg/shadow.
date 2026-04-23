import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

const app = express()
app.use(express.json())

// 📁 ملفات
if (!fs.existsSync('/tmp/files')) fs.mkdirSync('/tmp/files', { recursive: true })

// 📁 مستخدمين
const USERS_FILE = '/tmp/users.json'
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify([]))

// 🔐 توليد توكن
const genToken = () => crypto.randomBytes(16).toString('hex')

// 📦 تحميل المستخدمين
const getUsers = () => JSON.parse(fs.readFileSync(USERS_FILE))

// 💾 حفظ المستخدمين
const saveUsers = (data) => fs.writeFileSync(USERS_FILE, JSON.stringify(data))

// 📦 رفع ملفات
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, '/tmp/files/'),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.bin'
      const name = crypto.randomBytes(4).toString('hex') + ext
      cb(null, name)
    }
  })
})

/* ======================
   🔐 تسجيل
====================== */
app.post('/api/register', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.json({ status: false })

  const users = getUsers()

  if (users.find(u => u.username === username)) {
    return res.json({ status: false, msg: "موجود بالفعل" })
  }

  const token = genToken()

  users.push({ username, password, token })
  saveUsers(users)

  res.json({ status: true, token })
})

/* ======================
   🔑 تسجيل دخول
====================== */
app.post('/api/login', (req, res) => {
  const { username, password } = req.body
  const users = getUsers()

  const user = users.find(u => u.username === username && u.password === password)

  if (!user) return res.json({ status: false })

  user.token = genToken()
  saveUsers(users)

  res.json({ status: true, token: user.token })
})

/* ======================
   🔐 تحقق من التوكن
====================== */
const auth = (req, res, next) => {
  const token = req.headers.authorization
  if (!token) return res.json({ status: false, msg: "No token" })

  const users = getUsers()
  const user = users.find(u => u.token === token)

  if (!user) return res.json({ status: false, msg: "Invalid token" })

  req.user = user
  next()
}

/* ======================
   📤 رفع
====================== */
app.post('/api/upload', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.json({ status: false })

  const url = `${req.protocol}://${req.get('host')}/files/${req.file.filename}`

  res.json({
    status: true,
    url
  })
})

/* ======================
   📂 عرض الملفات
====================== */
app.use('/files', express.static('/tmp/files'))

/* ======================
   🌐 واجهة
====================== */
app.use(express.static('public'))

// ❌ بدون listen (Vercel)
export default app