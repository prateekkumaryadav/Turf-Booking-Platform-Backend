pipeline {
    agent any

    environment {
        NODEJS_HOME = '/Users/prateek/.nvm/versions/node/v25.4.0'
        PATH = "${NODEJS_HOME}/bin:/usr/local/bin:/opt/homebrew/bin:${env.PATH}"
        GATEWAY_IMAGE   = 'prateekkumaryadav/turf-api-gateway'
        AUTH_IMAGE       = 'prateekkumaryadav/turf-auth-service'
        TURF_IMAGE       = 'prateekkumaryadav/turf-turf-service'
        BOOKING_IMAGE    = 'prateekkumaryadav/turf-booking-service'
        DOCKER_IMAGE_TAG = "${BUILD_NUMBER}"
        DOCKER_HUB_CREDS = credentials('dockerhub-credentials')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // ───────────────────────────────────────────────
        // Detect which microservices have changed
        // ───────────────────────────────────────────────
        stage('Detect Changes') {
            steps {
                script {
                    // Fetch enough history for git diff to work
                    sh "git fetch --depth=2 origin ${env.GIT_BRANCH ?: 'main'} || true"

                    def changes = ''
                    try {
                        changes = sh(script: "git diff --name-only HEAD~1 HEAD 2>/dev/null", returnStdout: true).trim()
                    } catch (err) {
                        changes = ''
                    }

                    // If no changes detected (first build, shallow clone, or error) — build everything
                    if (changes == '') {
                        echo "No diff detected (first build or shallow clone). Building ALL services."
                        env.BUILD_GATEWAY = 'true'
                        env.BUILD_AUTH    = 'true'
                        env.BUILD_TURF   = 'true'
                        env.BUILD_BOOKING = 'true'
                    } else {
                        echo "Changed files:\n${changes}"
                        env.BUILD_GATEWAY = changes.contains('api-gateway/') ? 'true' : 'false'
                        env.BUILD_AUTH    = changes.contains('auth-service/') ? 'true' : 'false'
                        env.BUILD_TURF   = changes.contains('turf-service/') ? 'true' : 'false'
                        env.BUILD_BOOKING = changes.contains('booking-service/') ? 'true' : 'false'

                        // If no service directory matched (e.g. only Jenkinsfile or root files changed),
                        // build everything — ensures images exist after pipeline-only commits
                        if (env.BUILD_GATEWAY == 'false' && env.BUILD_AUTH == 'false' && env.BUILD_TURF == 'false' && env.BUILD_BOOKING == 'false') {
                            echo "No service directories changed (root-level change). Building ALL services."
                            env.BUILD_GATEWAY = 'true'
                            env.BUILD_AUTH    = 'true'
                            env.BUILD_TURF   = 'true'
                            env.BUILD_BOOKING = 'true'
                        }
                    }

                    echo "Build Gateway: ${env.BUILD_GATEWAY}"
                    echo "Build Auth:    ${env.BUILD_AUTH}"
                    echo "Build Turf:    ${env.BUILD_TURF}"
                    echo "Build Booking: ${env.BUILD_BOOKING}"
                }
            }
        }

        // ───────────────────────────────────────────────
        // Install Dependencies — only for changed services
        // ───────────────────────────────────────────────
        stage('Install Dependencies') {
            parallel {
                stage('Gateway Deps') {
                    when { expression { return env.BUILD_GATEWAY == 'true' } }
                    steps {
                        echo 'Installing API Gateway dependencies...'
                        dir('api-gateway') { sh 'npm install' }
                    }
                }
                stage('Auth Deps') {
                    when { expression { return env.BUILD_AUTH == 'true' } }
                    steps {
                        echo 'Installing Auth Service dependencies...'
                        dir('auth-service') { sh 'npm install' }
                    }
                }
                stage('Turf Deps') {
                    when { expression { return env.BUILD_TURF == 'true' } }
                    steps {
                        echo 'Installing Turf Service dependencies...'
                        dir('turf-service') { sh 'npm install' }
                    }
                }
                stage('Booking Deps') {
                    when { expression { return env.BUILD_BOOKING == 'true' } }
                    steps {
                        echo 'Installing Booking Service dependencies...'
                        dir('booking-service') { sh 'npm install' }
                    }
                }
            }
        }

        // ───────────────────────────────────────────────
        // Run Tests — only for changed services
        // ───────────────────────────────────────────────
        stage('Run Tests') {
            parallel {
                stage('Gateway Tests') {
                    when { expression { return env.BUILD_GATEWAY == 'true' } }
                    steps {
                        echo 'Running API Gateway tests...'
                        dir('api-gateway') { sh 'npm run test' }
                    }
                }
                stage('Auth Tests') {
                    when { expression { return env.BUILD_AUTH == 'true' } }
                    steps {
                        echo 'Running Auth Service tests...'
                        dir('auth-service') { sh 'npm run test' }
                    }
                }
                stage('Turf Tests') {
                    when { expression { return env.BUILD_TURF == 'true' } }
                    steps {
                        echo 'Running Turf Service tests...'
                        dir('turf-service') { sh 'npm run test' }
                    }
                }
                stage('Booking Tests') {
                    when { expression { return env.BUILD_BOOKING == 'true' } }
                    steps {
                        echo 'Running Booking Service tests...'
                        dir('booking-service') { sh 'npm run test' }
                    }
                }
            }
        }

        // ───────────────────────────────────────────────
        // Build & Push Docker Images — only for changed services
        // Buildx multi-arch must build+push in one step
        // ───────────────────────────────────────────────
        stage('Build & Push Docker Images') {
            steps {
                sh "docker buildx create --use --name multiarch_builder || true"
                sh "echo ${DOCKER_HUB_CREDS_PSW} | docker login -u ${DOCKER_HUB_CREDS_USR} --password-stdin"

                script {
                    if (env.BUILD_GATEWAY == 'true') {
                        echo 'Building & Pushing API Gateway image...'
                        dir('api-gateway') {
                            sh """
                            docker buildx build \\
                              --platform linux/amd64,linux/arm64 \\
                              -t ${GATEWAY_IMAGE}:${DOCKER_IMAGE_TAG} \\
                              -t ${GATEWAY_IMAGE}:latest \\
                              --push .
                            """
                        }
                    }
                    if (env.BUILD_AUTH == 'true') {
                        echo 'Building & Pushing Auth Service image...'
                        dir('auth-service') {
                            sh """
                            docker buildx build \\
                              --platform linux/amd64,linux/arm64 \\
                              -t ${AUTH_IMAGE}:${DOCKER_IMAGE_TAG} \\
                              -t ${AUTH_IMAGE}:latest \\
                              --push .
                            """
                        }
                    }
                    if (env.BUILD_TURF == 'true') {
                        echo 'Building & Pushing Turf Service image...'
                        dir('turf-service') {
                            sh """
                            docker buildx build \\
                              --platform linux/amd64,linux/arm64 \\
                              -t ${TURF_IMAGE}:${DOCKER_IMAGE_TAG} \\
                              -t ${TURF_IMAGE}:latest \\
                              --push .
                            """
                        }
                    }
                    if (env.BUILD_BOOKING == 'true') {
                        echo 'Building & Pushing Booking Service image...'
                        dir('booking-service') {
                            sh """
                            docker buildx build \\
                              --platform linux/amd64,linux/arm64 \\
                              -t ${BOOKING_IMAGE}:${DOCKER_IMAGE_TAG} \\
                              -t ${BOOKING_IMAGE}:latest \\
                              --push .
                            """
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            echo "Backend Pipeline run completed."
            echo "Services built: Gateway=${env.BUILD_GATEWAY}, Auth=${env.BUILD_AUTH}, Turf=${env.BUILD_TURF}, Booking=${env.BUILD_BOOKING}"
        }
        success {
            emailext (
                subject: "BUILD SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: "Backend build was successful!\nProject: ${env.JOB_NAME}\nBuild Number: ${env.BUILD_NUMBER}\nBuild URL: ${env.BUILD_URL}\n\nServices built: Gateway=${env.BUILD_GATEWAY}, Auth=${env.BUILD_AUTH}, Turf=${env.BUILD_TURF}, Booking=${env.BUILD_BOOKING}",
                recipientProviders: [[$class: 'DevelopersRecipientProvider'], [$class: 'RequesterRecipientProvider']],
                to: 'prateek.student20@gmail.com',
                mimeType: 'text/plain'
            )
        }
        failure {
            emailext (
                subject: "BUILD FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: "Backend build has failed!\nProject: ${env.JOB_NAME}\nBuild Number: ${env.BUILD_NUMBER}\nBuild URL: ${env.BUILD_URL}\nCheck the console output",
                recipientProviders: [[$class: 'DevelopersRecipientProvider'], [$class: 'RequesterRecipientProvider']],
                to: 'prateek.student20@gmail.com',
                mimeType: 'text/plain'
            )
        }
    }
}
