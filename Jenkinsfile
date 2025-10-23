pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "rsiddharth2264/jenkins-pipeline"
        GITHUB_CREDENTIALS = 'github-creds'
        KUBECONF = credentials('kubeconfig') // create this in Jenkins with your kubeconfig content
        APP_NAME = "ai-day-app"
        REPLICAS = 2
        NAMESPACE = "default"
    }

    stages {
        stage('Clone Repository') {
            steps {
                git branch: 'main', url: 'https://github.com/Siddhushady/AI-Day-Website-HTML.git', credentialsId: "${GITHUB_CREDENTIALS}"
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t $DOCKER_IMAGE:$BUILD_NUMBER .'
            }
        }

        stage('Push to DockerHub') {
            steps {
                sh "docker push $DOCKER_IMAGE:$BUILD_NUMBER"
            }
        }

        stage('Determine Current Color') {
            steps {
                withCredentials([string(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
                    script {
                        // Try to get current color from service
                        def currentColor = sh(script: "kubectl -n $NAMESPACE get svc $APP_NAME -o jsonpath='{.spec.selector.color}' || echo 'none'", returnStdout: true).trim()
                        env.CURRENT_COLOR = currentColor
                        env.NEW_COLOR = (currentColor == "blue") ? "green" : "blue"
                        echo "Current color: ${env.CURRENT_COLOR}"
                        echo "New color: ${env.NEW_COLOR}"
                    }
                }
            }
        }

        stage('Render & Apply Deployment') {
            steps {
                withCredentials([string(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
                    script {
                        // Replace variables in deployment template
                        sh """
                        sed -e 's|{{COLOR}}|${NEW_COLOR}|g' \\
                            -e 's|{{IMAGE}}|${DOCKER_IMAGE}:${BUILD_NUMBER}|g' \\
                            -e 's|{{APP}}|${APP_NAME}|g' \\
                            -e 's|{{REPLICAS}}|${REPLICAS}|g' k8s/deployment-bluegreen.yaml > /tmp/deploy-${NEW_COLOR}.yaml
                        kubectl -n $NAMESPACE apply -f /tmp/deploy-${NEW_COLOR}.yaml
                        """
                        // Apply service selector for new color
                        sh """
                        sed -e 's|{{APP}}|${APP_NAME}|g' -e 's|{{COLOR}}|${NEW_COLOR}|g' k8s/service.yaml > /tmp/service.yaml
                        kubectl -n $NAMESPACE apply -f /tmp/service.yaml
                        kubectl -n $NAMESPACE rollout status deployment/${APP_NAME}-${NEW_COLOR} --timeout=120s
                        """
                    }
                }
            }
        }

        stage('Switch Traffic') {
            steps {
                withCredentials([string(credentialsId: 'kubeconfig', variable: 'KUBECONFIG')]) {
                    script {
                        if (env.CURRENT_COLOR != 'none') {
                            echo "Switching service selector to new color ${NEW_COLOR}..."
                            sh """
                            kubectl -n $NAMESPACE patch svc ${APP_NAME} --type=merge -p '{"spec":{"selector":{"app":"${APP_NAME}","color":"${NEW_COLOR}"}}}'
                            """
                        } else {
                            echo "Service not found, already using ${NEW_COLOR} color."
                        }
                    }
                }
            }
        }
    }

    post {
        success {
            echo "Deployment successful. Live color: ${NEW_COLOR}"
        }
        failure {
            echo "Deployment failed. Check logs."
        }
    }
}
