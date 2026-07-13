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

        stage('0. Setup Security Tools') {
            steps {
                echo '🛠️ [보안 도구 자동 설치 및 캐시 점검]...'
                sh '''
                    mkdir -p /var/jenkins_home/bin
                    
                    # Install vexctl if not present
                    if [ ! -f /var/jenkins_home/bin/vexctl ]; then
                        echo "Installing vexctl..."
                        curl -sSfL https://github.com/openvex/vexctl/releases/latest/download/vexctl-linux-amd64 -o /var/jenkins_home/bin/vexctl
                        chmod +x /var/jenkins_home/bin/vexctl
                    fi
                    
                    # Install grant if not present
                    if [ ! -f /var/jenkins_home/bin/grant ]; then
                        echo "Installing grant..."
                        curl -sSfL https://get.anchore.io/grant | sh -s -- -b /var/jenkins_home/bin
                    fi
                    
                    # Verify versions
                    export PATH="/var/jenkins_home/bin:$PATH"
                    vexctl --version
                    grant --version
                '''
            }
        }

        stage('2. Source SCA & License Scan') {
            steps {
                echo '🔍 [소스코드 SBOM 및 라이선스 스캔 시작]...'
                sh 'rm -rf backend/build'
                
                // 1. 소스 디렉토리로부터 SBOM 추출 (CycloneDX 1.6 버전으로 고정)
                sh 'syft dir:./backend -o cyclonedx-json@1.6=backend-build-sbom.json'
                sh 'syft dir:./frontend -o cyclonedx-json@1.6=frontend-build-sbom.json'
                
                // 2. Grype 보안 취약점 스캔 (OpenVEX 필터 적용 및 차단 로그 저장)
                sh 'export PATH="/var/jenkins_home/bin:$PATH" && grype backend-build-sbom.json --vex backend-openvex.json --by-cve --fail-on high --severity high > backend-source-cve-blocked.txt'
                sh 'export PATH="/var/jenkins_home/bin:$PATH" && grype frontend-build-sbom.json --vex frontend-openvex.json --by-cve --fail-on high --severity high > frontend-source-cve-blocked.txt'
                
                // 3. Grant 라이선스 컴플라이언스 스캔 (위반 로그 저장)
                sh 'export PATH="/var/jenkins_home/bin:$PATH" && grant check backend-build-sbom.json -c .grant.yaml > backend-source-license-blocked.txt'
                sh 'export PATH="/var/jenkins_home/bin:$PATH" && grant check frontend-build-sbom.json -c .grant.yaml > frontend-source-license-blocked.txt'
                
                echo '✅ [소스코드 빌드 검증 성공] - 치명적인 취약점 및 라이선스 위반이 없습니다.'
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

        stage('5. Binary SCA & License Scan') {
            steps {
                echo '🔍 [바이너리 Docker 이미지 SBOM 및 라이선스 스캔 시작]...'
                // 1. 빌드된 Docker 이미지의 파일 시스템으로부터 SBOM 추출 (CycloneDX 1.6 버전으로 고정)
                sh "syft ${DOCKER_HUB_ID}/backend-app:latest -o cyclonedx-json@1.6=backend-image-sbom.json"
                sh "syft ${DOCKER_HUB_ID}/frontend-app:latest -o cyclonedx-json@1.6=frontend-image-sbom.json"
                
                // 2. Grype 보안 취약점 스캔 (OpenVEX 필터 적용 및 차단 로그 저장)
                sh 'export PATH="/var/jenkins_home/bin:$PATH" && grype backend-image-sbom.json --vex backend-openvex.json --by-cve --fail-on high --severity high > backend-image-cve-blocked.txt'
                sh 'export PATH="/var/jenkins_home/bin:$PATH" && grype frontend-image-sbom.json --vex frontend-openvex.json --by-cve --fail-on high --severity high > frontend-image-cve-blocked.txt'
                
                // 3. Grant 라이선스 컴플라이언스 스캔 (위반 로그 저장)
                sh 'export PATH="/var/jenkins_home/bin:$PATH" && grant check backend-image-sbom.json -c .grant.yaml > backend-image-license-blocked.txt'
                sh 'export PATH="/var/jenkins_home/bin:$PATH" && grant check frontend-image-sbom.json -c .grant.yaml > frontend-image-license-blocked.txt'
                
                echo '✅ [바이너리 Docker 이미지 검증 성공] - 치명적인 취약점 및 라이선스 위반이 없습니다.'
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

        stage('7. Dependency-Track SBOM & VEX Upload') {
            steps {
                echo '📤 [Dependency-Track으로 SBOM 및 VEX 전송 시작]...'
                withCredentials([string(credentialsId: 'dependency-track-api-key', variable: 'DTRACK_API_KEY')]) {
                    script {
                        // 1. 백엔드/프론트엔드 SBOM 업로드
                        sh """
                            curl -X "POST" "${DTRACK_URL}/api/v1/bom" \
                                 -H "X-Api-Key: ${DTRACK_API_KEY}" \
                                 -H "Content-Type: multipart/form-data" \
                                 -F "projectName=${BACKEND_PROJECT_NAME}" \
                                 -F "projectVersion=${BACKEND_PROJECT_VERSION}" \
                                 -F "autoCreate=true" \
                                 -F "bom=@backend-image-sbom.json"
                        """

                        sh """
                            curl -X "POST" "${DTRACK_URL}/api/v1/bom" \
                                 -H "X-Api-Key: ${DTRACK_API_KEY}" \
                                 -H "Content-Type: multipart/form-data" \
                                 -F "projectName=${FRONTEND_PROJECT_NAME}" \
                                 -F "projectVersion=${FRONTEND_PROJECT_VERSION}" \
                                 -F "autoCreate=true" \
                                 -F "bom=@frontend-image-sbom.json"
                        """

                        // 2. OpenVEX를 CycloneDX VEX 포맷으로 변환
                        echo '🔄 [OpenVEX -> CycloneDX VEX 변환 중]...'
                        sh 'python3 openvex_to_cyclonedx.py backend-openvex.json backend-cyclonedx-vex.json'
                        sh 'python3 openvex_to_cyclonedx.py frontend-openvex.json frontend-cyclonedx-vex.json'

                        // 3. 디트랙에서 각 프로젝트의 UUID 조회
                        echo '🔍 [디트랙 프로젝트 UUID 조회 중]...'
                        def backendUuid = sh(
                            script: """
                                curl -s -X GET "${DTRACK_URL}/api/v1/project/lookup?name=${BACKEND_PROJECT_NAME}&version=${BACKEND_PROJECT_VERSION}" \
                                     -H "X-Api-Key: ${DTRACK_API_KEY}" | python3 -c "import sys, json; print(json.load(sys.stdin).get('uuid', ''))"
                            """,
                            returnStdout: true
                        ).trim()

                        def frontendUuid = sh(
                            script: """
                                curl -s -X GET "${DTRACK_URL}/api/v1/project/lookup?name=${FRONTEND_PROJECT_NAME}&version=${FRONTEND_PROJECT_VERSION}" \
                                     -H "X-Api-Key: ${DTRACK_API_KEY}" | python3 -c "import sys, json; print(json.load(sys.stdin).get('uuid', ''))"
                            """,
                            returnStdout: true
                        ).trim()

                        // 4. CycloneDX VEX 파일 업로드
                        if (backendUuid) {
                            echo "📤 [백엔드 VEX 업로드] UUID: ${backendUuid}"
                            sh """
                                curl -X "PUT" "${DTRACK_URL}/api/v1/vex" \
                                     -H "X-Api-Key: ${DTRACK_API_KEY}" \
                                     -H "Content-Type: multipart/form-data" \
                                     -F "project=${backendUuid}" \
                                     -F "vex=@backend-cyclonedx-vex.json"
                            """
                        } else {
                            echo "⚠️ 백엔드 프로젝트 UUID 조회 실패"
                        }

                        if (frontendUuid) {
                            echo "📤 [프론트엔드 VEX 업로드] UUID: ${frontendUuid}"
                            sh """
                                curl -X "PUT" "${DTRACK_URL}/api/v1/vex" \
                                     -H "X-Api-Key: ${DTRACK_API_KEY}" \
                                     -H "Content-Type: multipart/form-data" \
                                     -F "project=${frontendUuid}" \
                                     -F "vex=@frontend-cyclonedx-vex.json"
                            """
                        } else {
                            echo "⚠️ 프론트엔드 프로젝트 UUID 조회 실패"
                        }
                    }
                }
                echo '✅ [Dependency-Track SBOM & VEX 전송 완료]'
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
            // 빌드 성공/실패 여부와 관계없이 생성된 모든 SBOM, VEX 원본, 변환 VEX 및 차단 보고서 파일을 보관
            archiveArtifacts artifacts: '*-sbom.json, *-openvex.json, *-cyclonedx-vex.json, *-blocked.txt', allowEmptyArchive: true, followSymlinks: false
        }
        success {
            echo '🎉 취약점 통과 및 배포에 최종 성공했습니다!'
        }
        failure {
            echo '❌ 취약점 탐지 또는 배포 에러가 발생했습니다. 로그를 확인하세요.'
        }
    }
}
