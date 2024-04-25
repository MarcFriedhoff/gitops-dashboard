# GitOps Dashboard

This project is a Dashboard for GitOps projects. It provides a visual interface for monitoring and managing your GitOps workflows.

## Folder Structure

The main parts of the project are:

- `client/`: This directory contains the React client application.
- `server/`: This directory contains the Node.js server application.
- `Dockerfile`: This file is used to build Docker images for the project.

## Building the Project

The project can be built using Docker. Here's how you can build the Docker image:

```bash
docker build -t gitops-dashboard .
```

This command builds a Docker image using the Dockerfile in the current directory and tags the image as gitops-dashboard.

## Running the Project Locally in Docker

After building the Docker image, you can run the project using the following command:

```bash
docker run -p 3000:3000 gitops-dashboard
```

This command runs the gitops-dashboard Docker image and maps port 3000 in the Docker container to port 3000 on the host machine.

After running this command, you can access the GitOps Dashboard at http://localhost:3000.


## Deployment Instructions

To deploy the GitOps Dashboard in Kubernetes, use the helm chart provided in the `k8s/helm/` directory. The helm chart deploys the GitOps Dashboard as a set of Kubernetes resources, including deployments, services, and ingresses.

To deploy the GitOps Dashboard using the helm chart, follow these steps:

## Create the gitops-secret secret
    
```bash
kubectl create secret generic git-ops-secret --from-literal=GITOPS_USERNAME=<username> --from-literal=GITOPS_PASSWORD=<password>
```

## Run helm install

Execute the following command to run the helm chart:

```bash
helm install gitops-dashboard ./helm/gitops-dashboard
```

This command installs the GitOps Dashboard in the default namespace using the helm chart provided in the `helm/gitops-dashboard` directory.