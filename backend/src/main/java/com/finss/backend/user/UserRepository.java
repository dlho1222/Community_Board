package com.finss.backend.user;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
/*
데이터베이스 연동 (Repository & Entity)
UserRepository는 JpaRepository를 상속받은 인터페이스, Spring Data JPA가 이 인터페이스를 기반으로 save(), findById() 같은 기본적인 CRUD 메소드와
findByUsername(), findByEmail() 같은 커스텀 쿼리 메소드를 자동으로 구현
*/
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
}
