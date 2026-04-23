import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

const app = express()

// 🔐 باسورد لوحة التحكم
const ADMIN_PASSWORD = "123456"

// 📁 فولدر الملفات
if (!fs.existsSync('/tmp/files')) fs.mkdirSync('/tmp/files', { recursive: true })

// اسم عشوائي
const random = (ext) => crypto.randomBytes(4).toString('hex') + ext

// رفع
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, '/tmp/files/'),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.bin'
      cb(null, random(ext))
    }
  })
})

// 🔥 رفع
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.json({ status: false })

  const url = `${req.protocol}://${req.get('host')}/files/${req.file.filename}`

  res.json({
    status: true,
    url
  })
})

// 📂 عرض كل الملفات
app.get('/api/files', (req, res) => {
  const pass = req.query.password
  if (pass !== ADMIN_PASSWORD) return res.json({ status: false })

  const files = fs.readdirSync('/tmp/files')
  res.json({ status: true, files })
})

// 🗑️ حذف
app.get('/api/delete', (req, res) => {
  const { file, password } = req.query

  if (password !== ADMIN_PASSWORD)
    return res.json({ status: false })

  const filePath = '/tmp/files/' + file

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
    return res.json({ status: true })
  }

  res.json({ status: false })
})

// 📂 عرض الملفات
app.use('/files', express.static('/tmp/files'))

// 🌐 واجهة
app.use(express.static('public'))

// ❌ بدون listen
export default app