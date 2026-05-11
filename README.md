# 🚀 LiveSync - Task Management App

LiveSync is a simple and modern task management App  built using **Node.js, Express, MongoDB, Socket.io and Vanilla JS**.

---

## ✨ Features

-  User Authentication (Login / Register)
-  Role-based Access (User / Admin)
-  Create, Edit, Delete Tasks
-  Move Tasks (Backlog → To Do → In Progress → Completed)
-  Assign Users to Tasks 
-  Admin & Creator Permissions
-  Toast Notifications
-  Clean UI (Bootstrap + Custom CSS)
-  Live Synchronization using socket.io

---

##  Roles & Permissions

| Action        | User | Admin | Creator |
|--------------|------|-------|--------|
| Create Task  | ✅   | ✅    | ✅     |
| Edit Task    | ❌   | ✅    | ✅     |
| Delete Task  | ❌   | ✅    | ✅     |
| Assign Users | ❌   | ✅    | ✅     |
| Move Task    | ✅ (if user assigned) | ✅ | ✅ |

---

## 🛠 Tech Stack

**Frontend**
- HTML, CSS, JavaScript
- Bootstrap 5
- Bootstrap Icons

**Backend**
- Node.js
- Express.js
- MongoDB (Mongoose)
- socket.io
- JWT Authentication
- bcryptjs


---

## ⚙️ Installation

- git clone <repo-link>
- cd LiveSync-TakManager
- npm install

---

## 🔑 Environment Variables

- Create .env file in root:

- MONGO_URI=your_mongodb_connection
- JWT_SECRET=secret_key
- PORT=5000

---

## ▶️ Run Project

- npm run dev
- Server runs on:http://localhost:5000


---

## 📁 Project Structure

 /client
   ├── index.html
   ├── register.html
   ├── dashboard.html
   ├── /Js
   ├── /css

/server
   ├── models
   ├── controllers
   ├── routes
   ├── middleware
   ├── server.js

---

## 🔐 Authentication Flow

- Register user
- Login → JWT token stored in localStorage
- Protected routes use token
- Role & ownership control access

---

## Github
 - [https://github.com/sonu101994/LiveSync-TaskManager]

## Live Link
 - https://livesync-taskmanager.onrender.com

## 👨‍💻 Author

- Bhawani Singh
- Github:https://github.com/sonu101994/