# Project Intelligence & Launch Roadmap: Brain.md

This document serves as the project's strategic blueprint, auditing the current state of the **Luciq & Logicant AI Talent Platform** and outlining the path to a successful production launch.

---

## 1. Project Overview & Flow
The platform is a multi-tenant recruitment ecosystem powered by **Gemini 1.5 Flash**. It bridges the gap between high-volume candidate applications and recruiter efficiency through automated intelligence.

### **Core User Flows:**
- **Recruiters (Admin)**: Create Jobs → AI Generates Screening Questions → View Intelligent Matches → Manage Pipeline → Automated Billing.
- **Candidates**: Upload Resume (AI Parsed) → Profile Setup → AI Job Matching → Pre-screening Interview → Live Application Tracking.

---

## 2. Integrated Functionality (What's Done)
The following modules are fully functional and integrated:

### **🧠 AI Engine (`lib/ai.ts`)**
- **Resume Parser**: Extracts Name, Skills, Experience, and Logistics from documents.
- **Match Engine**: Scores candidates against vacancies with 4-dimensional reasoning (Skills, Exp, Location, Salary).
- **Outreach Generator**: Creates personalized Email/WhatsApp invitations.
- **Screening Evaluator**: Scores interview responses and detects AI-generated (ChatGPT) answers.
- **Question Generator**: Generates specific technical questions based on Job Descriptions.

### **👤 Candidate Experience**
- **Dynamic Dashboard**: Personalized greetings, top skills, and live application tracker.
- **Modular Account**: Separation of "My Profile" (Identity/Settings) and "My Resume" (Career/AI Scanning).
- **Interactive Settings**: Direct editing of personal details with premium glassmorphism UI.

### **💼 Admin/Recruiter Suite**
- **Talent Pipeline**: Drag-and-drop style status management for candidates.
- **Job Management**: Complete CRUD with AI-assisted requirement extraction.
- **Billing Service**: Basic invoice generation and placement tracking.

---

## 3. The "Missing" Pieces (Gaps)
To move from a "Ready" state to a "Live Product," the following must be addressed:

### **A. Production Infrastructure**
- [ ] **Document Storage**: Currently using simulated uploads. Integration with **Vercel Blob** or **AWS S3** is required for actual Resume/Salary Slip files.
- [ ] **Real Communications**: The `comm.service.ts` needs **SendGrid** (Email) and **Twilio** (WhatsApp) API keys to send actual invitations.

### **B. Financial Integration**
- [ ] **Payment Gateway**: Integration of **Stripe** or **Razorpay** within `billing.service.ts` to allow clients to pay invoices directly via the portal.

### **C. Public Job Board**
- [ ] **Public Discovery**: A SEO-optimized public job board (`/jobs`) where candidates can browse without logging in first.
- [ ] **Referral System**: Ability for users to share jobs with unique tracking links.

### **D. Security & Compliance**
- [ ] **Role-Based Access (RBAC)**: Stricter middleware checks for sensitive Admin routes.
- [ ] **Data Privacy**: Implementation of a GDPR/Data deletion tool (started in Settings but needs backend logic).

---

## 4. Launch Readiness Roadmap (Go-Live Plan)

### **Phase 1: Hardening (Weeks 1-2)**
- Connect **Vercel Blob** for file persistence.
- Implement **Global Error Boundaries** and Toast notifications for all API failures.
- Add **Input Validation (Zod)** to all forms to prevent database pollution.

### **Phase 2: Commercialization (Weeks 3-4)**
- Connect **Stripe** for automated recruiter billing.
- Set up **Postmark/SendGrid** for "Application Received" and "You've Been Matched" notifications.

### **Phase 3: Visibility (Week 5)**
- Optimize **SEO Meta Tags** for the landing page.
- Create a **"Contact Sales"** flow for enterprise clients.

---

## 5. Strategic Recommendation
The platform is currently **85% ready** for a soft launch. The UI/UX is premium and the AI engine is robust. The primary focus should now shift from **"adding features"** to **"operational reliability"** (Storage, Payments, and Notifications).
