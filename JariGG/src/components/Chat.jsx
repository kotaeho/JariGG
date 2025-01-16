import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import io from 'socket.io-client'

function Chat() {
  const [messages, setMessages] = useState([]) // 채팅 메시지 상태
  const [newMessage, setNewMessage] = useState('') // 새 메시지 입력 상태
  const [socket, setSocket] = useState(null) // 소켓 연결 상태
  const [user, setUser] = useState(null) // 디스코드 사용자 정보 상태
  const [messageTimeout, setMessageTimeout] = useState(false) // 10분 제한 상태
  const [waitTime, setWaitTime] = useState(0) // 남은 대기 시간

  const location = useLocation()
  const { user: receivedUser } = location.state || {}

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
        withCredentials: true, // 인증 정보 포함
        extraHeaders: {
          'Content-Type': 'application/json' // 필요한 경우 헤더 추가
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
        marginLeft: '400px',
        marginRight: '400px'
      }}>
      <h1>자리지지</h1>

      {/* 메시지 리스트 부분 */}
      <div
        style={{
          flexGrow: 1,
          overflowY: 'auto',
          paddingBottom: '10px',
          textAlign: 'left' // 메시지를 왼쪽 정렬
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
