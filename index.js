import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

const app = express()

// 🔐 باسورد لوحة التحكم
const ADMIN_PASSWORD = "123456"

// 📁 فولدر الملفات
if (!fs.existsSync('files')) fs.mkdirSync('files')

// اسم عشوائي
const random = (ext) => crypto.randomBytes(4).toString('hex') + ext

// 🔥 بدون تحديد حجم (يعتمد على السيرفر)
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'files/'),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.bin'
      cb(null, random(ext))
    }
  }),
  limits: {
    fileSize: Infinity
  }
})

// 🔥 رفع
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.json({ status: false })

  const url = `${req.protocol}://${req.get('host')}/${req.file.filename}`

  res.json({
    status: true,
    url
  })
})

// 📂 عرض كل الملفات
app.get('/api/files', (req, res) => {
  const pass = req.query.password
  if (pass !== ADMIN_PASSWORD) return res.json({ status: false })

  const files = fs.readdirSync('./files')
  res.json({ status: true, files })
})

// 🗑️ حذف
app.get('/api/delete', (req, res) => {
  const { file, password } = req.query

  if (password !== ADMIN_PASSWORD)
    return res.json({ status: false })

  const filePath = './files/' + file

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
    return res.json({ status: true })
  }

  res.json({ status: false })
})

// 📂 عرض مباشر
app.use(express.static('files'))

// 🌐 واجهة
app.use(express.static('public'))

// 🔥 مهم لـ Render
const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log("🔥 Running"))