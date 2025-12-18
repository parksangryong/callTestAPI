### FIREBASE

0. 파이어베이스 생성(패키지이름 + SHA 인증서 지문 발급)
1. 라이브러리 - Google drive API 추가
2. OAuth 발급 (사용할 드라이브 만큼)
   - GOOGLE_CLIENT_ID(.env)에 추가
   - GOOGLE_CLIENT_SECRET(.env)에 추가
3. oAuth2Client 설정 후 토큰 저장
4. 토큰 통해 녹취 업로드 및 다운로드
