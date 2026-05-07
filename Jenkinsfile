pipeline {
    agent any

    environment {
        NODE_ENV = 'development'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                // Retry tối đa 3 lần nếu npm registry bị timeout hoặc mạng flaky
                retry(3) {
                    echo 'Installing Backend Dependencies...'
                    dir('backend') {
                        sh 'npm install'
                    }
                }
                retry(3) {
                    echo 'Installing Frontend Dependencies...'
                    dir('frontend') {
                        sh 'npm install'
                    }
                }
            }
        }

        stage('Build Frontend') {
            steps {
                retry(3) {
                    echo 'Building React Frontend...'
                    dir('frontend') {
                        sh 'npm run build'
                    }
                }
            }
        }

        stage('Docker Build & Deploy') {
            steps {
                // Retry tối đa 3 lần nếu Docker Hub bị chậm hoặc kết nối mạng tạm thời lỗi
                retry(3) {
                    echo 'Building Docker images and starting services...'
                    sh 'docker-compose up -d --build'
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully! Application is running.'
        }
        failure {
            echo 'Pipeline failed after all retry attempts! Please check the logs.'
        }
    }
}
