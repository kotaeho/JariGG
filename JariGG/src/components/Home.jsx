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
      <h3>사용법</h3>
      <h3>디스코드 계정으로 로그인한뒤</h3>
      <h3>채팅을 치고 보내기를 누르면 됩니다다.</h3>
      <h3>자리 구매 판매글 이외에 다른글을 쓰면 안됩니다.</h3>
      <h3>시세를 조작하면 안됩니다.</h3>
      <h3>채팅은 10분에 한번씩 칠수있어요.</h3>
      <h3>수정 및 삭제는 할수없어요.</h3>
      <h3>채팅창 디코유저이름을 클릭하면 복사가 돼요</h3>
      <h3>채팅은 입력후 30분뒤에 삭제됩니다.</h3>
      <h3>melaenjeonyong@naver.com 문의사항 보내주세요.</h3>
    </div>
  )
}

export default Home
