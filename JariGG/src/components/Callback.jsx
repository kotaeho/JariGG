// src/components/Callback.jsx
import { useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

function Callback() {
  const [searchParams] = useSearchParams()
  const code = searchParams.get('code')
  const navigate = useNavigate()

  useEffect(() => {
    if (code) {
      axios
        .post(
          `https://port-0-jariggback-m5yynzb8aef2a683.sel4.cloudtype.app/api/auth/discord/callback`,
          { code }
        )
        .then(response => {
          console.log('User data:', response.data)
          if (response.data.redirectTo) {
            // 사용자 정보를 state에 포함하여 /chat 페이지로 이동
            navigate('/chat', {
              state: {
                user: response.data.user // 사용자 정보를 state에 포함
              }
            })
          }
        })
        .catch(error => {
          console.error('Error fetching user data:', error)
        })
    }
  }, [code, navigate])

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Processing...</h1>
    </div>
  )
}

export default Callback
