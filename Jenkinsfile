pipeline {
    agent any

    environment {
        // 1. 본인의 Docker Hub 아이디로 수정하세요
        DOCKER_HUB_ID = 'dlho1222' 
        
        // 2. 본인의 GitHub 리포지토리 URL로 수정하세요 (https://... 형태)
        GIT_URL = 'https://github.com/dlho1222/Community_Board'
    }

    stages {
        stage('1. Checkout') {
            steps {
                // 'github-id'는 아까 Credentials에서 만든 ID입니다.
                git branch: 'jenkins', credentialsId: 'github-id', url: "${GIT_URL}"
            }
        }

        stage('2. Backend Build') {
            steps {
                dir('backend') { // 리포지토리 내 백엔드 폴더명으로 수정 (예: 'backend')
                    sh 'chmod +x ./gradlew'
                    sh './gradlew clean build -x test' 
                }
            }
        }

        stage('3. Docker Image Build & Push') {
            steps {
                // docker-hub-id 열쇠를 꺼내서 변수에 담습니다.
                withCredentials([usernamePassword(credentialsId: 'docker-hub-id', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    // 1. 도커 허브 로그인
                    sh "echo ${DOCKER_PASS} | docker login -u ${DOCKER_USER} --password-stdin"
                    
                    // 2. 백엔드 이미지 빌드 및 푸시
                    sh "docker build -t ${DOCKER_HUB_ID}/backend-app:latest ./backend"
                    sh "docker push ${DOCKER_HUB_ID}/backend-app:latest"
                    
                    // 3. 프론트엔드 이미지 빌드 및 푸시 (프론트엔드 폴더가 있다면)
                    sh "docker build -t ${DOCKER_HUB_ID}/frontend-app:latest ./frontend"
                    sh "docker push ${DOCKER_HUB_ID}/frontend-app:latest"
                }
            }
        }

        stage('4. Deploy (Docker Compose)') {
            steps {
                // DOCKER_API_VERSION을 1.44로 강제 지정하여 통신 에러를 방지합니다.
                // docker-compose 대신 최신 방식인 'docker compose'가 깔려있을 수 있으니 둘 다 대비합니다.
                script {
                    try {
                        sh "export DOCKER_API_VERSION=1.44 && docker-compose down || true"
                        sh "export DOCKER_API_VERSION=1.44 && docker-compose up -d"
                    } catch (Exception e) {
                        // 만약 위 명령어가 실패하면 하이픈 없는 버전을 시도합니다.
                        sh "export DOCKER_API_VERSION=1.44 && docker compose down || true"
                        sh "export DOCKER_API_VERSION=1.44 && docker compose up -d"
                    }
                }
            }
        }
    }

    post {
        success {
            echo '🎉 배포에 성공했습니다!'
        }
        failure {
            echo '❌ 배포 중 에러가 발생했습니다. 로그를 확인하세요.'
        }
    }
}
