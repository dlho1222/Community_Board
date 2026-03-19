# 🛡️ 시큐어 코딩 마스터 플랜 (Community Board)

## 🎯 기본 원칙 (Primary Principles)
1. **보안 원리 파악 (Learning by Principle):** 보안의 근본 원리를 깊이 체득하기 위해, 외부 라이브러리(Spring Security 등)의 자동화된 기능에 의존하지 않고 자바와 스프링의 순수 기능(`HttpSession`, `Filter` 등)을 사용하여 직접 구현한다.
2. **사용자 직접 코딩 (Manual Implementation):** AI는 학습 효과를 극대화하기 위해 절대로 파일을 직접 수정하지 않는다. 대신 사용자가 직접 코딩할 수 있도록 상세한 수정 가이드(Before/After)와 보안적 이유를 제시한다.

---

## 📋 보안 점검 및 시큐어 코딩 현황

| 번호 | 점검 항목 | 위험도 | 상태 | 관련 파일 |
| :--- | :--- | :---: | :---: | :--- |
| **1** | **부적절한 인가 및 권한 관리** (Admin/isAdmin 삭제) | 🔴 높음 | ✅ **완료** | `AdminController`, `PostController`, `postApi.ts` 등 |
| **2** | **파일 업로드/다운로드 보안** (웹쉘 방어) | 🔴 높음 | ⏳ 대기 | `FileStorageService` |
| **3** | **입력값 검증 및 XSS 방어** (스크립트 실행 차단) | 🟠 중간 | ⏳ 대기 | `PostServiceImpl`, `CommentServiceImpl` |
| **4** | **인증 및 세션 관리 강화** (SecurityConfig 설정) | 🟠 중간 | ⏳ 대기 | `SecurityConfig`, `UserController` |
| **5** | **정보 노출 방지** (예외 처리 시 내부 정보 은폐) | 🟡 낮음 | ⏳ 대기 | `GlobalExceptionHandler` (신규) |
| **6** | **비밀번호 정책 강화** (복잡도 검증) | 🟡 낮음 | ⏳ 대기 | `UserServiceImpl` |
| **7** | **비즈니스 로직 설계 오류** (admin 아이디 권한 부여) | 🟠 중간 | ⏳ 대기 | `UserServiceImpl` |
| **8** | **CSRF 방어 강화** (토큰 검증 및 SameSite 설정) | 🔴 높음 | ⏳ 대기 | `SecurityConfig`, `api.ts` |

---

## 🛠️ 상세 조치 가이드

### 1. 부적절한 인가 및 권한 관리 (완료)
- **문제:** `@RequestHeader` 및 `@RequestParam` 변조를 통해 관리자 권한 탈취 가능.
- **해결:** 
    - 클라이언트 입력값(`X-USER-ID`, `isAdmin`) 싹 다 무시 및 삭제.
    - 서버 `HttpSession` 기반의 `"loginUser"` 객체 활용 권한 체크 로직 전면 도입.
    - 프런트엔드 API 호출 시 불필요한 인자 제거 및 세션 연동 완료.
- **원리:** 클라이언트가 보내는 데이터는 모두 조작 가능하다고 가정하고, 서버 내부의 안전한 메모리(Session)만 신뢰한다.

