pipeline {
    agent any

    environment {
        DOCKER_HUB_ID = 'dlho1222' 
        GIT_URL = 'https://github.com/dlho1222/Community_Board'
        
        // 1. 본인의 Dependency-Track 서버 URL 주소로 변경하세요 (예: http://IP:PORT)
        DTRACK_URL = 'http://localhost:8081' 
        
        // 2. Dependency-Track에 등록할 프로젝트 정보 (각각에 고유 UUID가 부여됩니다)
        // 수동 테스트 시 생성된 프로젝트 ID(UUID)가 있다면 아래 기재하여 덮어쓰기가 가능하고,
        // 없으면 프로젝트 이름과 버전(autoCreate)을 사용해 자동으로 생성하게 전송합니다.
        BACKEND_PROJECT_NAME = 'community-board-backend'
        BACKEND_PROJECT_VERSION = '1.0.0'
        FRONTEND_PROJECT_NAME = 'community-board-frontend'
        FRONTEND_PROJECT_VERSION = '1.0.0'
    }

    stages {
        stage('1. Checkout') {
            steps {
                git branch: 'jenkins', credentialsId: 'github-id', url: "${GIT_URL}"
            }
        }

        stage('2. Source SCA Scan (Build SBOM)') {
            steps {
                echo '🔍 [소스코드 빌드 SBOM 스캔 시작]...'
                // 1. 소스 디렉토리로부터 SBOM 추출 (CycloneDX JSON 포맷)
                sh 'syft dir:./backend -o cyclonedx-json=backend-build-sbom.json'
                sh 'syft dir:./frontend -o cyclonedx-json=frontend-build-sbom.json'
                
                // 2. Grype 취약점 스캔 실행
                // --fail-on high 옵션: High 등급 이상의 취약점이 발견되면 빌드를 에러 상태로 강제 종료시킵니다.
                sh 'grype backend-build-sbom.json --fail-on high'
                sh 'grype frontend-build-sbom.json --fail-on high'
                echo '✅ [소스코드 빌드 SBOM 스캔 성공] - 치명적인 취약점이 없습니다.'
            }
        }

        stage('3. Backend Build') {
            steps {
                dir('backend') {
                    sh 'chmod +x ./gradlew'
                    sh './gradlew clean build -x test' 
                }
            }
        }

        stage('4. Docker Image Build') {
            steps {
                echo '🛠️ [Docker 이미지 빌드]...'
                // 취약점 검증 전이므로 Docker Hub Push는 하지 않고 로컬 빌드만 진행합니다.
                sh "docker build -t ${DOCKER_HUB_ID}/backend-app:latest ./backend"
                sh "docker build -t ${DOCKER_HUB_ID}/frontend-app:latest ./frontend"
            }
        }

        stage('5. Binary SCA Scan (Docker Image SBOM)') {
            steps {
                echo '🔍 [바이너리 Docker 이미지 SBOM 스캔 시작]...'
                // 1. 빌드된 Docker 이미지의 파일 시스템으로부터 SBOM 추출
                sh "syft ${DOCKER_HUB_ID}/backend-app:latest -o cyclonedx-json=backend-image-sbom.json"
                sh "syft ${DOCKER_HUB_ID}/frontend-app:latest -o cyclonedx-json=frontend-image-sbom.json"
                
                // 2. Grype 취약점 스캔 실행 (OS 패키지 및 런타임 취약점 검증)
                sh 'grype backend-image-sbom.json --fail-on high'
                sh 'grype frontend-image-sbom.json --fail-on high'
                echo '✅ [바이너리 Docker 이미지 SBOM 스캔 성공] - 치명적인 취약점이 없습니다.'
            }
        }

        stage('6. Docker Hub Push') {
            steps {
                echo '🚀 [스캔 통과 - Docker Hub로 이미지 푸시]...'
                withCredentials([usernamePassword(credentialsId: 'docker-hub-id', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh "echo ${DOCKER_PASS} | docker login -u ${DOCKER_USER} --password-stdin"
                    sh "docker push ${DOCKER_HUB_ID}/backend-app:latest"
                    sh "docker push ${DOCKER_HUB_ID}/frontend-app:latest"
                }
            }
        }

        stage('7. Dependency-Track SBOM Upload') {
            steps {
                echo '📤 [Dependency-Track으로 SBOM 전송]...'
                withCredentials([string(credentialsId: 'dependency-track-api-key', variable: 'DTRACK_API_KEY')]) {
                    script {
                        // 백엔드 이미지 SBOM 업로드
                        // Dependency-Track API 규격에 맞추어 multipart/form-data 형식으로 전송합니다.
                        // autoCreate=true로 지정 시 프로젝트가 없으면 자동으로 새로 만듭니다.
                        sh """
                            curl -X "POST" "${DTRACK_URL}/api/v1/bom" \
                                 -H "X-Api-Key: ${DTRACK_API_KEY}" \
                                 -H "Content-Type: multipart/form-data" \
                                 -F "projectName=${BACKEND_PROJECT_NAME}" \
                                 -F "projectVersion=${BACKEND_PROJECT_VERSION}" \
                                 -F "autoCreate=true" \
                                 -F "bom=@backend-image-sbom.json"
                        """

                        // 프론트엔드 이미지 SBOM 업로드
                        sh """
                            curl -X "POST" "${DTRACK_URL}/api/v1/bom" \
                                 -H "X-Api-Key: ${DTRACK_API_KEY}" \
                                 -H "Content-Type: multipart/form-data" \
                                 -F "projectName=${FRONTEND_PROJECT_NAME}" \
                                 -F "projectVersion=${FRONTEND_PROJECT_VERSION}" \
                                 -F "autoCreate=true" \
                                 -F "bom=@frontend-image-sbom.json"
                        """
                    }
                }
                echo '✅ [Dependency-Track SBOM 전송 완료]'
            }
        }

        stage('8. Deploy (Docker Compose)') {
            steps {
                script {
                    try {
                        sh "export DOCKER_API_VERSION=1.44 && docker-compose down || true"
                        sh "export DOCKER_API_VERSION=1.44 && docker-compose up -d"
                    } catch (Exception e) {
                        sh "export DOCKER_API_VERSION=1.44 && docker compose down || true"
                        sh "export DOCKER_API_VERSION=1.44 && docker compose up -d"
                    }
                }
            }
        }
    }

    post {
        success {
            echo '🎉 취약점 통과 및 배포에 최종 성공했습니다!'
        }
        failure {
            echo '❌ 취약점 탐지 또는 배포 에러가 발생했습니다. 로그를 확인하세요.'
        }
    }
}
