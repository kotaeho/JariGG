function Home() {
  const handleLogin = () => {
    window.location.href =
      'https://port-0-jariggback-m5yynzb8aef2a683.sel4.cloudtype.app/auth/discord'
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>자리지지</h1>
      <button
        onClick={handleLogin}
        style={{
          backgroundColor: 'purple', // 연보라색
          color: 'white', // 텍스트 색상
          border: 'none', // 테두리 제거
          borderRadius: '5px', // 모서리 둥글게
          padding: '8px 20px', // 내부 여백
          cursor: 'pointer' // 클릭 가능한 포인터 표시
        }}>
        로그인
      </button>
      <h1>사용법</h1>
      <h1>디스코드 계정으로 로그인한뒤</h1>
      <h1>채팅을 치면 됩니다.</h1>
      <h1>자리 구매 판매글 이외에 다른글을 쓰면 안돼요.</h1>
      <h1>시세를 조작하면 안돼요.</h1>
      <h1>채팅은 10분에 한번씩 칠수있어요.</h1>
      <h1>수정 및 삭제는 할수없어요.</h1>
      <h1>채팅창 디코유저이름을 클릭하면 복사가 돼요</h1>
    </div>
  )
}

export default Home
