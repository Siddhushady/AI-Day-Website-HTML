pipeline {
  agent any

  environment {
    DOCKERHUB_CREDENTIALS = 'dockerhub'
    GITHUB_CREDENTIALS = 'github-creds'
    KUBE_CONFIG_CREDENTIALS = 'kubeconfig'   // secret file in Jenkins
    DOCKER_IMAGE = "rsiddharth2264/jenkins-pipeline"
    APP_NAME = "ai-day-app"
    NAMESPACE = "default"
    REPLICAS = "2"
  }

  parameters {
    booleanParam(name: 'AUTO_SWITCH', defaultValue: true, description: 'Automatically switch service selector to new color after smoke test')
  }

  stages {

    stage('Clone') {
      steps { checkout scm }
    }

    stage('Build & Tag') {
      steps {
        sh '''
          echo "Building Docker image..."
          docker build -t $DOCKER_IMAGE:$BUILD_NUMBER .
          docker tag $DOCKER_IMAGE:$BUILD_NUMBER $DOCKER_IMAGE:latest
        '''
      }
    }

    stage('Push to DockerHub') {
      steps {
        withCredentials([usernamePassword(credentialsId: env.DOCKERHUB_CREDENTIALS, usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
          sh '''
            echo "Logging in to DockerHub..."
            echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
            docker push $DOCKER_IMAGE:$BUILD_NUMBER
            docker push $DOCKER_IMAGE:latest
          '''
        }
      }
    }

    stage('Determine current color') {
      steps {
        withCredentials([file(credentialsId: env.KUBE_CONFIG_CREDENTIALS, variable: 'KUBECONF')]) {
          script {
            sh 'export KUBECONFIG=$KUBECONF'
            env.CURRENT_COLOR = sh(script: "kubectl -n ${NAMESPACE} get svc ${APP_NAME} -o jsonpath='{.spec.selector.color}' || echo ''", returnStdout: true).trim()
            if (!env.CURRENT_COLOR) {
              env.CURRENT_COLOR = 'green'  // default initial live color
            }
            env.NEW_COLOR = (env.CURRENT_COLOR == 'blue') ? 'green' : 'blue'
            echo "Current color: ${env.CURRENT_COLOR}"
            echo "New color: ${env.NEW_COLOR}"
          }
        }
      }
    }

    stage('Render & Apply Deployment') {
      steps {
        withCredentials([file(credentialsId: env.KUBE_CONFIG_CREDENTIALS, variable: 'KUBECONF')]) {
          sh '''
            export KUBECONFIG=$KUBECONF
            # render template to a temp file
            sed "s|{{COLOR}}|${NEW_COLOR}|g; s|{{IMAGE}}|${DOCKER_IMAGE}:${BUILD_NUMBER}|g; s|{{APP}}|${APP_NAME}|g; s|{{REPLICAS}}|${REPLICAS}|g" k8s/deployment-bluegreen.yaml > /tmp/deploy-${NEW_COLOR}.yaml
            kubectl -n ${NAMESPACE} apply -f /tmp/deploy-${NEW_COLOR}.yaml
            # ensure service exists (apply once)
            sed "s|{{APP}}|${APP_NAME}|g" k8s/service.yaml > /tmp/service.yaml
            kubectl -n ${NAMESPACE} apply -f /tmp/service.yaml
            # wait for rollout
            kubectl -n ${NAMESPACE} rollout status deployment/${APP_NAME}-${NEW_COLOR} --timeout=120s
          '''
        }
      }
    }

    stage('Smoke test new color') {
      steps {
        withCredentials([file(credentialsId: env.KUBE_CONFIG_CREDENTIALS, variable: 'KUBECONF')]) {
          sh '''
            export KUBECONFIG=$KUBECONF
            # create a temporary smoke service pointing to NEW_COLOR
            cat <<EOF | kubectl -n ${NAMESPACE} apply -f -
            apiVersion: v1
            kind: Service
            metadata:
              name: ${APP_NAME}-smoke
            spec:
              ports:
                - protocol: TCP
                  port: 80
                  targetPort: 80
              selector:
                app: ${APP_NAME}
                color: ${NEW_COLOR}
            EOF

            sleep 3
            CLUSTER_IP=$(kubectl -n ${NAMESPACE} get svc ${APP_NAME}-smoke -o jsonpath='{.spec.clusterIP}')
            echo "Smoke target: $CLUSTER_IP:80"
            STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://$CLUSTER_IP:80/health || true)
            echo "Smoke HTTP code: $STATUS"
            kubectl -n ${NAMESPACE} delete svc ${APP_NAME}-smoke || true
            if [ "$STATUS" != "200" ]; then
              echo "Smoke test failed"
              exit 1
            fi
            echo "Smoke test passed"
          '''
        }
      }
    }

    stage('Switch traffic (patch Service)') {
      when { expression { return params.AUTO_SWITCH == true } }
      steps {
        withCredentials([file(credentialsId: env.KUBE_CONFIG_CREDENTIALS, variable: 'KUBECONF')]) {
          sh '''
            export KUBECONFIG=$KUBECONF
            echo "Patching Service ${APP_NAME} to color=${NEW_COLOR}"
            kubectl -n ${NAMESPACE} patch svc ${APP_NAME} --type='merge' -p "{\"spec\":{\"selector\":{\"app\":\"${APP_NAME}\",\"color\":\"${NEW_COLOR}\"}}}"
            # verify endpoints
            kubectl -n ${NAMESPACE} get endpoints ${APP_NAME} -o yaml
          '''
        }
      }
    }

    stage('Post-switch verification') {
      when { expression { return params.AUTO_SWITCH == true } }
      steps {
        withCredentials([file(credentialsId: env.KUBE_CONFIG_CREDENTIALS, variable: 'KUBECONF')]) {
          sh '''
            export KUBECONFIG=$KUBECONF
            # Since Service is NodePort 30080, we can curl localhost:30080
            for i in 1 2 3; do
              STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:30080/health || true)
              echo "Attempt $i -> $STATUS"
              if [ "$STATUS" = "200" ]; then
                echo "Post-switch verify OK"
                exit 0
              fi
              sleep 3
            done
            echo "Post-switch verification failed"
            exit 1
          '''
        }
      }
    }
  } // stages

  post {
    failure {
      script {
        withCredentials([file(credentialsId: env.KUBE_CONFIG_CREDENTIALS, variable: 'KUBECONF')]) {
          sh '''
            export KUBECONFIG=$KUBECONF
            echo "Attempting to rollback service to previous color: ${CURRENT_COLOR}"
            kubectl -n ${NAMESPACE} patch svc ${APP_NAME} --type='merge' -p "{\"spec\":{\"selector\":{\"app\":\"${APP_NAME}\",\"color\":\"${CURRENT_COLOR}\"}}}" || true
            echo "Rollback attempted"
          '''
        }
      }
    }
    success {
      echo "Blue-Green deployment succeeded."
    }
  }
}
