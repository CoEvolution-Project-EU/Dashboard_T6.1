# CoEvolution_Dashboard_T6.1
The CoEvolution Hub Dashboard represents the main graphical entry point of the CoEvolution
ecosystem. It provides a unified, web-based interface through which users can access AI
models, reports, risk analysis, and orchestration information. Through modular visualization
components, the dashboard aggregates data from backend services and pools, allowing end
users to navigate metadata, and review results in real time.


Frontend dashboard for the CoEvolution platform.

This application is built with **Angular** and served via **Nginx** inside a Docker container.
It can be deployed locally using Docker or in a **Kubernetes cluster**.

---
Based on the Advanced Visualisation Toolkit (AVT) developed by Aegis IT Research:

* [AEGIS](https://aegisresearch.eu/)
* [AVT](https://avt.aegisresearch.eu/?_gl=1%2A1vwo23l%2A_ga%2AMTg2MTY1OTMzOS4xNzM4NjczNjIz%2A_ga_F3BQXKXREW%2AMTczODY3MzYyMy4xLjAuMTczODY3MzYyMy4wLjAuMA..)

---
# Setup the Dashboard 

## tl;dr

```sh
docker-compose up
```
---

## Requirements

### Host setup

* Docker Engine version **18.06.0** or newer
* Docker Compose version **1.28.0** or newer
* 2 GB of RAM
* 
By default, it exposes the following port:

* 4200

## Usage

Give it about a minute to initialize, then access the web UI by opening <http://localhost:4200/fvt> in a web
browser.


> [!NOTE]
> Make sure you add */fvt/* on your url 

---

# Project Structure

```
.
├── src/                 Angular application source code
├── nginx/               Nginx configuration
├── k8s/                 Kubernetes deployment manifests
├── Dockerfile           Docker build configuration
├── docker-compose.yaml  Local container orchestration
├── nginx.conf           Nginx server configuration
└── README.md
```

---

# Environment Variables

The application reads runtime configuration from `assets/env.js`.

The following variables must be defined:

| Variable     | Description                    |
| ------------ | ------------------------------ |
| SERV_HOST    | Backend API host               |
| SOCKET_HOST  | Websocket service host         |
| KEYCLOAK_URL | Keycloak authentication server |


---

# Running the Application

# FVT Dashboard

Frontend dashboard for the CoEvolution platform.

This application is built with **Angular** and served via **Nginx** inside a Docker container.
It can be deployed locally using Docker or in a **Kubernetes cluster**.

---

# Project Structure

```
.
├── src/                 Angular application source code
├── nginx/               Nginx configuration
├── k8s/                 Kubernetes deployment manifests
├── Dockerfile           Docker build configuration
├── docker-compose.yaml  Local container orchestration
├── nginx.conf           Nginx server configuration
└── README.md
```

---

# Environment Variables

The application reads runtime configuration from `assets/env.js`.

The following variables must be defined:

| Variable     | Description                    |
| ------------ | ------------------------------ |
| SERV_HOST    | Backend API host               |
| SOCKET_HOST  | Websocket service host         |
| KEYCLOAK_URL | Keycloak authentication server |

These values are injected at container startup using `envsubst`.

---

# Running the Application

## 1. Run Angular locally (development)

Requirements:

* Node.js 18+
* npm

Install dependencies:

```bash
npm install
```

Start development server:

```bash
ng serve
```

Open:

```
http://localhost:4200
```

---

# Running with Docker

Build the container image:

```bash
docker build -t fvt-dashboard .
```

Run the container:

```bash
docker run -p 8080:80 \
-e SERV_HOST=http://api.example.com \
-e SOCKET_HOST=ws://socket.example.com \
-e KEYCLOAK_URL=http://auth.example.com \
fvt-dashboard
```

Open:

```
http://localhost:8080/fvt/
```

---

# Running with Docker Compose

Start services:

```bash
docker compose up
```

Stop services:

```bash
docker compose down
```

---

# Kubernetes Deployment

The repository includes Kubernetes manifests inside the `k8s/` directory.

Deploy the application:

```bash
kubectl apply -f k8s/
```

Check running pods:

```bash
kubectl get pods
```

Check services:

```bash
kubectl get svc
```

---

# Accessing the Application

If an **Ingress controller** is configured, the application will be available at:

```
https://<your-domain>/fvt/
```

For local testing you can use port forwarding:

```bash
kubectl port-forward svc/fvt 8080:80
```

Then open:

```
http://localhost:8080/fvt/
```

---

# Build Process

1. Builds the Angular application using Node
2. Copies the compiled files into an Nginx container
3. Injects runtime environment variables using `envsubst`
4. Serves the application under `/fvt/`

---

# Authentication

The application integrates with **Keycloak** for authentication.

Configuration is provided through the following environment variable:

```
KEYCLOAK_URL
```

---

## License

This project has received funding from the European Union's Horizon 2022 research and innovation programm, under Grant Agreement 101091996.

For more details about the licence, see the [LICENSE](LICENSE) file.

## Contributors

- Stella Markopoulou (<s.markopoulou@aegisresearch.eu>)
