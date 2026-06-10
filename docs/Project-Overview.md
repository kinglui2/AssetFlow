# Project Overview

## Document Information

| Field | Detail |
|-------|--------|
| **Project Name** | AssetFlow |
| **Version** | 1.0 (Planning) |
| **Status** | Phase 1 — Planning |
| **Last Updated** | June 2026 |

---

## 1. Introduction

AssetFlow is a centralized ICT Equipment Borrowing and Asset Tracking System developed for internal organizational use. It digitizes the manual logbook process currently used by the ICT Department to record equipment issuance, returns, and borrowing history.

The system provides a web-based interface for ICT staff to manage equipment inventory, process borrowing transactions, and generate reports — with all data stored securely in a cloud-hosted Supabase backend.

---

## 2. Background

The ICT Department manages a wide range of equipment borrowed frequently by staff across departments, including laptops, projectors, peripherals, network devices, JBL,, PA system and testing equipment.

Records are currently maintained in a physical logbook. This approach is functional but creates operational challenges: slow record retrieval, limited visibility into asset availability, manual report generation, and no reliable audit trail.

AssetFlow replaces this process with a digital platform that offers real-time inventory visibility, structured borrowing records, and automated reporting.

---

## 3. Project Goals

### Main Objective

To develop a digital system that enables efficient tracking and management of ICT equipment borrowing activities.

### Specific Objectives

- Digitize equipment borrowing records
- Improve accountability of ICT assets
- Track asset availability in real time
- Maintain a complete borrowing history
- Generate reports for audits and management review
- Reduce paperwork and manual record keeping
- Improve operational efficiency within the ICT department

---

## 4. Scope

### In Scope

- Equipment registration and inventory management
- Equipment issuance (borrowing) and return processing
- Borrower information capture
- Borrowing history and search
- Report generation with filtering
- User authentication and role-based access control
- Audit logging of system activities
- Cloud-hosted database and backend via Supabase
- Web-based frontend accessible via browser

### Out of Scope (Initial Release)

- Staff self-service borrowing requests
- QR code / barcode asset tracking
- Email notifications
- Equipment reservation system
- Mobile application
- Asset maintenance tracking
- Dashboard analytics

These items are documented as future enhancements in the project roadmap.

---

## 5. Stakeholders

| Stakeholder | Interest |
|-------------|----------|
| **ICT Department** | Primary system operators; manage inventory and borrowing |
| **ICT Administrator** | System configuration, user management, audit oversight |
| **ICT Officer** | Day-to-day equipment issuance and returns |
| **Staff Members** | Equipment borrowers (indirect users in initial release) |
| **Management** | Reports on asset utilization and accountability |

---

## 6. System Architecture

AssetFlow follows a modern three-tier architecture:

```text
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
│              Vite + Tailwind CSS                         │
│         Deployed on static hosting (Vercel/Netlify)      │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS / Supabase Client SDK
┌────────────────────────▼────────────────────────────────┐
│                   Supabase Platform                      │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Supabase   │  │  PostgreSQL  │  │ Edge Functions│  │
│  │    Auth     │  │   Database   │  │  (optional)   │  │
│  └─────────────┘  └──────────────┘  └───────────────┘  │
│  ┌─────────────────────────────────────────────────────┐ │
│  │         Auto-generated REST API (PostgREST)        │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

- **Supabase as BaaS**: Eliminates the need for a self-hosted database or backend server, simplifying deployment and maintenance.
- **PostgreSQL**: Relational database suited for structured asset and borrowing records with referential integrity.
- **Row Level Security (RLS)**: Enforces role-based data access at the database level.
- **JWT Authentication**: Supabase Auth issues JWT tokens used by the frontend and validated by the API.

---

## 7. Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Supabase (REST API, Edge Functions) |
| Database | PostgreSQL (Supabase-hosted) |
| Authentication | Supabase Auth (JWT) |
| Migrations | Supabase SQL migrations |
| Version Control | Git, GitHub |
| Frontend Hosting | Vercel, Netlify, or similar |
| Backend Hosting | Supabase (cloud) |

---

## 8. Development Phases

| Phase | Activities |
|-------|------------|
| **Phase 1 — Planning** | Requirements gathering, process analysis, documentation |
| **Phase 2 — System Design** | Database design, system architecture, UI design |
| **Phase 3 — Development** | Supabase setup, frontend development, API integration |
| **Phase 4 — Testing** | Unit, integration, and user acceptance testing |
| **Phase 5 — Deployment** | Supabase production setup, frontend deployment, user training |

---

## 9. Expected Benefits

### ICT Department

- Improved asset accountability
- Faster record retrieval
- Reduced paperwork
- Better inventory visibility
- Enhanced reporting capabilities

### Staff Members

- Faster equipment issuance process
- Improved service delivery

### Management

- Accurate asset utilization reports
- Better decision-making
- Improved governance and accountability

---

## 10. Related Documentation

| Document | Description |
|----------|-------------|
| [Requirements.md](./Requirements.md) | Functional and non-functional requirements |
| [User-Roles.md](./User-Roles.md) | Role definitions and permissions |
| [System-Workflow.md](./System-Workflow.md) | Business process flows |
| [Database-Design.md](./Database-Design.md) | Database schema and entity design |
| [API-Documentation.md](./API-Documentation.md) | API endpoints and integration guide |
| [User-Manual.md](./User-Manual.md) | End-user operating guide |

---

## 11. Future Enhancements

- QR Code Asset Tracking
- Barcode Scanning
- Email Notifications
- Equipment Reservation System
- Mobile Application
- Asset Maintenance Tracking
- Dashboard Analytics
- Department Performance Reports
- Staff self-service borrowing portal
