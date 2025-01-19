import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import io from 'socket.io-client'
import { useMediaQuery } from 'react-responsive'

function Chat() {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [socket, setSocket] = useState(null)
  const [user, setUser] = useState(null)
  const [messageTimeout, setMessageTimeout] = useState(false)
  const [waitTime, setWaitTime] = useState(0)

  const navigate = useNavigate()
  const location = useLocation()
  const { user: receivedUser } = location.state || {}

  const isMobile = useMediaQuery({ query: '(max-width: 768px)' }) // 모바일 화면 감지

  useEffect(() => {
    if (receivedUser) {
      console.log('Received user:', receivedUser)
      setUser(receivedUser)
    }
  }, [receivedUser])

  useEffect(() => {
    const socketInstance = io(
      'https://port-0-jariggback-m5yynzb8aef2a683.sel4.cloudtype.app',
      {
        withCredentials: true,
        extraHeaders: {
          'Content-Type': 'application/json'
        }
      }
    )
    setSocket(socketInstance)

    socketInstance.on('connect', () => {
      console.log('Connected to the socket server!')
    })

    socketInstance.on('previous messages', previousMessages => {
      setMessages(previousMessages)
    })

    socketInstance.on('chat message', msg => {
      if (msg.banned) {
        alert(
          `채팅이 금지되었습니다. 사유: ${
            msg.reason
          }. 이때부터 가능해요: ${new Date(msg.banUntil).toLocaleString()}`
        )
      } else if (msg.wait) {
        const seconds = Math.ceil(msg.remainingTime / 1000)
        setWaitTime(seconds)
        setMessageTimeout(true)

        const interval = setInterval(() => {
          setWaitTime(prevTime => {
            if (prevTime > 1) {
              return prevTime - 1
            } else {
              clearInterval(interval)
              setMessageTimeout(false)
              return 0
            }
          })
        }, 1000)
      } else {
        setMessages(prevMessages => [...prevMessages, msg])
      }
    })

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  const handleSendMessage = () => {
    if (newMessage.trim() !== '' && socket && user) {
      socket.emit('chat message', {
        username: user.username,
        message: newMessage
      })
      setNewMessage('')
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100vh',
        textAlign: 'center',
        marginLeft: isMobile ? '10px' : '400px',
        marginRight: isMobile ? '10px' : '400px'
      }}>
      <h1
        style={{
          cursor: 'pointer',
          color: 'blue',
          textDecoration: 'underline'
        }}
        onClick={() => navigate('/')}>
        자리지지
      </h1>

      <div
        style={{
          flexGrow: 1,
          overflowY: 'auto',
          paddingBottom: '10px',
          textAlign: 'left'
        }}>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {messages.map((msg, index) => (
            <li
              key={index}
              style={{ marginBottom: '10px' }}>
              <strong
                onClick={() => {
                  navigator.clipboard
                    .writeText(msg.username)
                    .then(() => {
                      alert(`${msg.username} 디코id 복사완료!`)
                    })
                    .catch(err => {
                      console.error('Failed to copy text: ', err)
                    })
                }}
                style={{
                  cursor: 'pointer',
                  color: 'skyblue',
                  fontFamily: 'Nanum Gothic, sans-serif'
                }}>
                {msg.username}
              </strong>
              : {msg.message}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ padding: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          value={newMessage}
          onChange={e => {
            if (e.target.value.length <= 20) {
              setNewMessage(e.target.value)
            }
          }}
          placeholder="메세지를 입력하세요"
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '10px'
          }}
        />
        {waitTime > 0 && (
          <p
            style={{
              marginBottom: '10px',
              color: 'red',
              fontWeight: 'bold'
            }}>
            {waitTime}초 뒤에 보낼 수 있습니다.
          </p>
        )}

        <button
          onClick={handleSendMessage}
          disabled={!user || messageTimeout}
          style={{
            width: '200px',
            padding: '10px',
            backgroundColor: !user || messageTimeout ? '#d3d3d3' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: !user || messageTimeout ? 'not-allowed' : 'pointer'
          }}>
          보내기
        </button>
      </div>
    </div>
  )
}

export default Chat
