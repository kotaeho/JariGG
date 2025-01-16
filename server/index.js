// 모듈 및 설정 불러오기
const express = require('express')
const axios = require('axios')
const cors = require('cors')
const dotenv = require('dotenv')
const http = require('http')
const socketIo = require('socket.io')
const mongoose = require('mongoose')
const path = require('path')

dotenv.config()

// MongoDB 연결
mongoose
  .connect('mongodb://svc.sel4.cloudtype.app:32325/chatDB', {})
  .then(() => console.log('MongoDB 연결 성공'))
  .catch(err => console.error('MongoDB 연결 오류:', err))

// Mongoose 연결 상태 확인
mongoose.connection.on('connected', () => {
  console.log('MongoDB에 연결됨:', mongoose.connection.host)
  console.log('연결된 DB:', mongoose.connection.name)
})

// 에러 처리
mongoose.connection.on('error', err => {
  console.log('MongoDB 연결 오류:', err)
})

// 사용자 금지 및 메시지 제한 관리 객체
let lastMessageTime = {} // 사용자별 마지막 메시지 보낸 시간 기록

// Express 앱 설정
const app = express()
app.use(
  cors({
    origin: process.env.REACT_APP_FRONTEND_URL,
    methods: 'GET,POST',
    allowedHeaders: 'Content-Type'
  })
)
app.use(express.json())

// HTTP 서버 및 Socket.IO 설정
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: 'https://web-jariggfront-m5yynzb8aef2a683.sel4.cloudtype.app/',
    methods: ['GET', 'POST']
  }
})

// 환경 변수 설정
const PORT = process.env.PORT || 5000
const CLIENT_ID = process.env.DISCORD_CLIENT_ID
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI

// === MongoDB 스키마 및 모델 정의 ===

// 채팅 메시지 모델 정의
const messageSchema = new mongoose.Schema({
  username: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
})

// 30분 후 자동 삭제되는 TTL 인덱스 추가
messageSchema.index({ timestamp: 1 }, { expireAfterSeconds: 1800 })

const Message = mongoose.model('Message', messageSchema)

// 금지된 사용자 모델 정의
const bannedUserSchema = new mongoose.Schema(
  {
    userid: { type: String, required: true, unique: true },
    banUntil: { type: Date, required: true },
    reason: { type: String, required: true }
  },
  { collection: 'BannedUser' }
)

const BannedUser = mongoose.model('BannedUser', bannedUserSchema)

// 사용자가 금지되었는지 확인하는 함수
const isUserBanned = async userid => {
  try {
    const bannedUser = await BannedUser.findOne({ userid }) // 사용자 금지 정보 가져오기

    if (bannedUser) {
      console.log('금지 해제 시간:', bannedUser.banUntil) // banUntil 확인
      console.log('현재 시간:', Date.now()) // 현재 시간 확인
      if (bannedUser.banUntil > Date.now()) {
        return { isBanned: true, bannedUser }
      } else {
        await BannedUser.deleteOne({ userid }) // 금지 해제
      }
    }
    return { isBanned: false, bannedUser: null }
  } catch (error) {
    console.error('오류:', error) // 에러 처리
    return { isBanned: false, bannedUser: null }
  }
}

// === Socket.IO 이벤트 처리 ===
io.on('connection', socket => {
  console.log('사용자가 연결됨')

  // 이전 채팅 메시지 로드
  Message.find()
    .sort({ timestamp: 1 })
    .then(messages => {
      socket.emit('previous messages', messages)
    })
    .catch(err => console.error('메시지 가져오기 오류:', err))

  // 메시지 받기
  socket.on('chat message', async msg => {
    const userid = msg.username
    const currentTime = Date.now()

    try {
      // 금지된 사용자 확인
      const { isBanned, bannedUser } = await isUserBanned(userid)
      if (isBanned) {
        socket.emit('chat message', {
          message: `메시지 전송이 금지되었습니다. 사유: ${bannedUser.reason}`,
          banned: true,
          banUntil: bannedUser.banUntil,
          reason: bannedUser.reason
        })
        return
      }

      // 메시지 전송 제한 확인 (10분 제한)
      if (
        lastMessageTime[userid] &&
        currentTime - lastMessageTime[userid] < 10 * 60 * 1000
      ) {
        const remainingTime =
          10 * 60 * 1000 - (currentTime - lastMessageTime[userid])
        socket.emit('chat message', {
          message: `다음 메시지를 보내기 전에 ${Math.ceil(
            remainingTime / 1000
          )}초 기다려주세요.`,
          wait: true,
          remainingTime: remainingTime
        })
        return
      }

      // 메시지 저장 및 브로드캐스트
      const newMessage = new Message({ username: userid, message: msg.message })
      await newMessage.save()

      lastMessageTime[userid] = currentTime
      io.emit('chat message', msg)
    } catch (error) {
      console.error('메시지 처리 오류:', error)
    }
  })

  // 사용자 연결 해제
  socket.on('disconnect', () => {
    console.log('사용자가 연결 해제됨')
  })
})

// === OAuth2 디스코드 인증 ===

app.use(express.static(path.join(__dirname, 'dist'))) // 'build'를 'dist'로 변경

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html')) // 여기도 'build'를 'dist'로 변경
})

// Step 1: OAuth2 로그인 URL 생성
app.get('/auth/discord', (req, res) => {
  const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_type=code&scope=identify email`
  res.redirect(authUrl)
})

// Step 2: 디스코드 인증 콜백 처리
app.post('/api/auth/discord/callback', async (req, res) => {
  const { code } = req.body

  if (!code) {
    return res.status(400).send('코드가 제공되지 않았습니다.')
  }

  try {
    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )

    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
    })

    res.json({ redirectTo: '/chat', user: userResponse.data })
  } catch (error) {
    console.error('인증 중 오류 발생:', error)
    res.status(500).send('OAuth2 인증 실패')
  }
})

// === 서버 시작 ===
server.listen(PORT, () => {
  console.log(`서버가 실행 중입니다: http://localhost:${PORT}`)
})
