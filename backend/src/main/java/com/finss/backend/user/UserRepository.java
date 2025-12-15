package com.finss.backend.user;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
/*
데이터베이스 연동 (Repository & Entity)
 Entity: User.java는 @Entity로 지정된 클래스로, 데이터베이스의 users 테이블과 매핑됩니다. 사용자의 ID, 이름, 비밀번호, 이메일 등의 필드를 정의
   * Repository: UserRepository.java는 JpaRepository를 상속받은 인터페이스입니다. Spring Data JPA가 이 인터페이스를 기반으로 save(), findById() 같은 기본적인 CRUD 메소드와 findByUsername(), findByEmail() 같은 커스텀 쿼리
     메소드를 자동으로 구현
     Spring의 Repository는 DB접근을 추상화한 인터페이스 - 안드로이드의 Repository 패턴과는 약간다름 Spring은 DAO에 가까움
 */
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
}
