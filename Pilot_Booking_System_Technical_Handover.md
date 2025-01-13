
# Technical Handover Document: Pilot Booking System

---

## 1. Database Configuration

### 1.1 Database Setup
- **Cluster and Namespace**:
  - The database (`db`) is hosted on **Pilot 4 Cluster**.
  - Namespace: `claendardb`.

- **Database YAML Template**:
  - The YAML template for creating the database is located at: `xxx`.

### 1.2 Database Service
- **Service YAML File**:
  - The YAML file for the service is located at: `xxxx`.
  - The service type specified in the YAML is `NodePort`.

### 1.3 Connecting to the Database
To connect to the database from external tools (e.g., pgAdmin or VSCode extensions):
1. **Identify the Node Hosting the DB Pod**:
   - Run `oc get pod -o wide` to locate the **node** assigned to the DB pod.
2. **Retrieve the External IP of the Node**:
   - Use `oc get node <node-name> -o wide` to obtain the **external IP** of the node.
3. **Obtain the Service Export Port**:
   - Run `oc get svc` to find the **export port** of the service.
4. **Use External Tools**:
   - Use the external IP (as the host) and the service port to connect to the database remotely.
   - Required credentials:
     - **Username and Password**: Defined in the database creation YAML file.
     - **Database Name**: As set during database creation.

### 1.4 Handling Database Passwords
- **Password Algorithm**:
  - OpenShift requires the database password to be stored as **SHA-256**.
  - **Resolution**:
    - Modify the `haproxy.conf` file in the DB pod to use the **SHA-256 algorithm**.
    - Reset the password in the database to ensure compatibility with the updated algorithm.

---

## 2. Authentication: OpenShift OAuth Client

### 2.1 OAuth Client Configuration
- **OAuth Client**:
  - The application uses **OpenShift OAuth Client** as the authenticator for user login.
  - The OAuth client is deployed on **Pilot 4 Cluster**.
  - **YAML Template**:
    - The YAML file for creating the OAuth client is located at: `xxx`.

### 2.2 OAuth Client Details
- The **OAuth client name** is the **client ID** used for authentication.
- The **redirect URL** points to the **frontend of the application**.

### 2.3 Authentication Flow
- The authentication link format used to collect the token is:
  ```
  https://<cluster-domain>/oauth/authorize?client_id=<oauth-client-name>&response_type=token&redirect_uri=<frontend-url>
  ```
  - Replace `<cluster-domain>` with your OpenShift cluster domain.
  - Replace `<oauth-client-name>` with the name of your OAuth client.
  - Replace `<frontend-url>` with your application frontend URL.
- Example:
  ```
  https://openshift.example.com/oauth/authorize?client_id=my-oauth-client&response_type=token&redirect_uri=https://myapp.example.com/callback
  ```

### 2.4 Redirect URL Callback
- The redirect URL will typically include a **callback path** appended to the frontend URL, such as:
  ```
  https://<frontend-url>/callback
  ```

---

## 3. Deployment of Application

### 3.1 Deployment Details
- **Cluster and Namespace**:
  - Both the frontend and backend applications are deployed on the **np1-gl cluster**.
  - Namespace: `calendar`.

- **Deployment Files**:
  - The YAML files for deploying both the frontend and backend are located at: `xxx`.

- **Container Images**:
  - The Docker images for the frontend and backend are stored at: `xxxx`.

- **Services**:
  - Two services are created upon deployment:
    1. **Backend Service**:
       - Used as an internal service.
       - Accessed by the frontend for API calls.
    2. **Frontend Service**:
       - Exposed to external users via a route and Load Balancer (BLB).
  - The YAML files for the **services** are located at: `xxxx`.

### 3.2 Frontend Exposure
- **Route and Certificate**:
  - The frontend is exposed externally using a **route**.
  - A **certificate** is assigned to the route for secure communication.
  - The YAML files for the **route** and **certificate** are located at: `xxxx`.

- **Backend Proxy Configuration**:
  - To address browser certificate issues, the backend service is proxied through the frontend using **Nginx**.
  - Nginx forwards traffic from the frontend to the backend and returns the response directly.
  - The configuration files, including the Nginx configuration, are included in the Dockerfile (see below).

### 3.3 Configuration and Updates
- **Cluster and Booking Name Modifications**:
  - These can be updated directly in the **database**.
  
- **Admin Role Management**:
  - Admin roles can be modified in the **database**.
  - Alternatively, you can extend the **admin mode** feature to include these capabilities for easier management.

### 3.4 Build Configuration
- **Dockerfiles**:
  - The Dockerfiles for building the **frontend** and **backend** (including Nginx configuration) are located at: `xxxx`.

---

