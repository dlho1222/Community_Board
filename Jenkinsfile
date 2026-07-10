pipeline {
    agent any

    environment {
        DOCKER_HUB_ID = 'dlho1222' 
        GIT_URL = 'https://github.com/dlho1222/Community_Board'
        
        // 1. 본인의 Dependency-Track 서버 URL 주소로 변경하세요 (예: http://IP:PORT)
        DTRACK_URL = 'http://192.168.111.130:8089' 
        
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
                // 이전 빌드가 남긴 컴파일 찌꺼기 폴더를 삭제하여 1차 스캔 시 오염을 방지합니다.
                sh 'rm -rf backend/build'
                
                // 1. 소스 디렉토리로부터 SBOM 추출 (CycloneDX 1.6 버전으로 고정)
                sh 'syft dir:./backend -o cyclonedx-json@1.6=backend-build-sbom.json'
                sh 'syft dir:./frontend -o cyclonedx-json@1.6=frontend-build-sbom.json'
                
                // 2. Grype 취약점 스캔 실행
                // --fail-on high 옵션: High 등급 이상의 취약점이 발견되면 빌드를 에러 상태로 강제 종료시킵니다.
                sh 'grype backend-build-sbom.json --by-cve --fail-on high'
                sh 'grype frontend-build-sbom.json --by-cve --fail-on high'
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

        stage('5. Dependency-Track SBOM Upload') {
            steps {
                echo '📤 [Dependency-Track으로 SBOM 전송 및 선전송 시작]...'
                // 1. 빌드된 Docker 이미지의 파일 시스템으로부터 SBOM 추출 (CycloneDX 1.6 버전으로 고정)
                sh "syft ${DOCKER_HUB_ID}/backend-app:latest -o cyclonedx-json@1.6=backend-image-sbom.json"
                sh "syft ${DOCKER_HUB_ID}/frontend-app:latest -o cyclonedx-json@1.6=frontend-image-sbom.json"

                // 2. Dependency-Track으로 SBOM 업로드
                withCredentials([string(credentialsId: 'dependency-track-api-key', variable: 'DTRACK_API_KEY')]) {
                    script {
                        // 백엔드 이미지 SBOM 업로드
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
                
                // 3. 디트랙 서버가 업로드된 SBOM의 분석을 마칠 때까지 15초간 대기합니다.
                echo '⏳ [Dependency-Track 취약점 동기화 분석 대기 - 15초]...'
                sh 'sleep 15'
            }
        }

        stage('6. Binary SCA Scan (Docker Image SBOM)') {
            steps {
                echo '🔍 [바이너리 Docker 이미지 SBOM 스캔 시작 (VEX 병합 적용)]...'
                withCredentials([string(credentialsId: 'dependency-track-api-key', variable: 'DTRACK_API_KEY')]) {
                    script {
                        // 백엔드 VEX 조회 및 스캔
                        sh """
                            echo "🔍 [백엔드 이미지 VEX 확인 중]..."
                            RESPONSE=\$(curl -s -X GET "${DTRACK_URL}/api/v1/project/lookup?name=${BACKEND_PROJECT_NAME}&version=${BACKEND_PROJECT_VERSION}" \
                                 -H "X-Api-Key: ${DTRACK_API_KEY}" \
                                 -H "Accept: application/json")
                            BACKEND_UUID=\$(echo "\$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('uuid', ''))" 2>/dev/null)
                            
                            if [ -n "\$BACKEND_UUID" ] && [ "\$BACKEND_UUID" != "null" ]; then
                                curl -s -X GET "${DTRACK_URL}/api/v1/vex/project/\$BACKEND_UUID" \
                                     -H "X-Api-Key: ${DTRACK_API_KEY}" \
                                     -H "Accept: application/json" \
                                     -o backend-vex-downloaded.json
                                python3 merge_vex.py backend-vex-downloaded.json backend-local-vex.json backend-vex.json backend-grype.yaml
                                if [ -f backend-grype.yaml ]; then
                                    grype backend-image-sbom.json -c backend-grype.yaml --by-cve --fail-on high
                                else
                                    grype backend-image-sbom.json --by-cve --fail-on high
                                fi
                            fi
                        """

                        // 프론트엔드 VEX 조회 및 스캔
                        sh """
                            echo "🔍 [프론트엔드 이미지 VEX 확인 중]..."
                            RESPONSE=\$(curl -s -X GET "${DTRACK_URL}/api/v1/project/lookup?name=${FRONTEND_PROJECT_NAME}&version=${FRONTEND_PROJECT_VERSION}" \
                                 -H "X-Api-Key: ${DTRACK_API_KEY}" \
                                 -H "Accept: application/json")
                            FRONTEND_UUID=\$(echo "\$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('uuid', ''))" 2>/dev/null)
                            
                            if [ -n "\$FRONTEND_UUID" ] && [ "\$FRONTEND_UUID" != "null" ]; then
                                curl -s -X GET "${DTRACK_URL}/api/v1/vex/project/\$FRONTEND_UUID" \
                                     -H "X-Api-Key: ${DTRACK_API_KEY}" \
                                     -H "Accept: application/json" \
                                     -o frontend-vex-downloaded.json
                                python3 merge_vex.py frontend-vex-downloaded.json frontend-local-vex.json frontend-vex.json frontend-grype.yaml
                                if [ -f frontend-grype.yaml ]; then
                                    grype frontend-image-sbom.json -c frontend-grype.yaml --by-cve --fail-on high
                                else
                                    grype frontend-image-sbom.json --by-cve --fail-on high
                                fi
                            fi
                        """
                    }
                }
                echo '✅ [바이너리 Docker 이미지 SBOM 스캔 성공] - 예외 처리 완료 및 통과'
            }
        }

        stage('7. Docker Hub Push') {
            steps {
                echo '🚀 [스캔 통과 - Docker Hub로 이미지 푸시]...'
                withCredentials([usernamePassword(credentialsId: 'docker-hub-id', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh "echo ${DOCKER_PASS} | docker login -u ${DOCKER_USER} --password-stdin"
                    sh "docker push ${DOCKER_HUB_ID}/backend-app:latest"
                    sh "docker push ${DOCKER_HUB_ID}/frontend-app:latest"
                }
            }
        }

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
        always {
            // 빌드 성공/실패 여부와 관계없이 생성된 모든 SBOM json 파일을 젠킨스 빌드 이력에 보관
            archiveArtifacts artifacts: '*-sbom.json', followSymlinks: false
        }
        success {
            echo '🎉 취약점 통과 및 배포에 최종 성공했습니다!'
        }
        failure {
            echo '❌ 취약점 탐지 또는 배포 에러가 발생했습니다. 로그를 확인하세요.'
        }
    }
}
