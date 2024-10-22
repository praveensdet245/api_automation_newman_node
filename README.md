## API Tests 

This project has all utilities which are required to execute 
test collection name is sample-service and it has it's environment file as well

and this project has functions to publish assertions count to slack channel through slack webhook urls
this has functions to upload newman reports to gcp cloud and that link we can publish to slack where upper management can have a look at report

## Prerequisites
npm install -g newman
npm install --global gulp-cli

You should have docker in your local to check this project in docker


## LOCAL TESTING via DOCKER

1. ``docker build -f Dockerfile .`` ( it will take 3 mins the first time )
2. ``docker images``
3. Get the image sha
4. ``docker run -it -p 127.0.0.1:3000:3000 {image-sha from step 3} sh``
5. node index.js
6. The server should be locally live @ 127.0.0.1:3000


## Local Testing via gulp

1. ```gulp -T``` to list out gulp tasks
2. ```export ENV=dev & gulp <task name>``` to run particular task
3. ```export ENV=dev & gulp``` to run all services testcases
