# Dashboard Architecture

## Overview
The Dashboard is an **Angular web application** that provides the user interface for interacting with the system.  
It communicates with the **Orchestrator** through a middleware layer and uses external services for authentication.

## Main Components

- **UI (Angular Application)**  
  The frontend interface where users interact with the system.

- **Middleware**  
  Handles requests from the UI and forwards them to the Orchestrator.

- **Authentication Services**  
  User authentication is handled through an external **UA service** and **Keycloak**.

- **Orchestrator**  
  Backend component responsible for executing and managing system flows.

## Architecture Diagram

```mermaid
flowchart LR

User --> UI[Angular Dashboard UI]

UI --> Middleware[Dashboard Middleware]

Middleware --> Orchestrator

User --> UA[External UA]
UA --> Keycloak
Keycloak --> UI