# AssetFlow

> A centralized ICT Equipment Borrowing and Asset Tracking System.

## Overview

AssetFlow is a web-based asset management solution designed to digitize and streamline the process of issuing, tracking, and managing ICT equipment within an organization.

Traditionally, equipment borrowing records are maintained in a physical logbook where staff members manually record details such as their name, department, borrowed item, and borrowing date. While functional, this approach makes it difficult to track assets efficiently, retrieve historical records, generate reports, and maintain accountability.

AssetFlow replaces the manual process with a centralized digital platform that provides real-time visibility into asset utilization, borrowing history, and equipment availability.

---

## Problem Statement

The ICT Department manages a variety of equipment and accessories that are frequently borrowed by staff members across different departments.

Examples include:

- Laptops
- Projectors
- Keyboards
- Mice
- Network Devices
- Power Adapters
- Extension Cables
- Testing Equipment
- Other ICT Assets

The current manual process presents several challenges:

- Difficulty locating historical records
- Limited visibility into borrowed assets
- Time-consuming report generation
- Risk of lost or damaged records
- Lack of audit trails
- Increased administrative workload

AssetFlow addresses these challenges through automation and centralized record management.

---

## Objectives

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

## Key Features

### Equipment Management

- Register ICT equipment
- Update equipment information
- Categorize assets
- Track equipment status
- Manage asset inventory

### Borrowing Management

- Record equipment issuance
- Capture borrower information
- Record borrowing purpose
- Automatically capture borrowing date and time
- Maintain borrowing history

### Return Management

- Record equipment returns
- Automatically update equipment availability
- Track return dates and times

### Reporting

- View borrowing history
- Filter records by:
  - Department
  - Equipment Type
  - Borrower
  - Date Range
- Generate downloadable reports

### User Management

- Secure authentication
- Role-based access control
- User activity tracking

### Audit Trail

- Track all system activities
- Maintain accountability
- Support compliance and auditing requirements

---

## User Roles

### ICT Administrator

Responsibilities:

- Manage equipment inventory
- Manage users
- Generate reports
- View audit logs
- Configure system settings

### ICT Officer

Responsibilities:

- Issue equipment
- Record returns
- Manage borrowing records
- Search equipment records
- View reports

### Staff Member *(Future Enhancement)*

Responsibilities:

- Submit borrowing requests
- View borrowing history
- Track request status

---

## Expected Benefits

### ICT Department

- Improved asset accountability
- Faster record retrieval
- Reduced paperwork
- Better inventory visibility
- Enhanced reporting capabilities

### Staff Members

- Faster equipment issuance process
- Improved service delivery
- Better visibility of available assets

### Management

- Accurate asset utilization reports
- Better decision-making
- Improved governance and accountability

---

## Proposed Technology Stack

### Frontend

- React
- Vite
- Tailwind CSS

### Backend

- Node.js
- Express.js

### Database

- MySQL

### Authentication

- JSON Web Tokens (JWT)

### Version Control

- Git
- GitHub

---

## Project Structure

```text
AssetFlow/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── src/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   └── package.json
│
├── database/
│   └── schema.sql
│
├── docs/
│   ├── Project-Overview.md
│   ├── Requirements.md
│   ├── User-Roles.md
│   ├── System-Workflow.md
│   ├── Database-Design.md
│   ├── API-Documentation.md
│   └── User-Manual.md
│
├── README.md
└── .gitignore
```

---

## Development Phases

### Phase 1 - Planning

- Requirements Gathering
- Process Analysis
- Documentation

### Phase 2 - System Design

- Database Design
- System Architecture
- User Interface Design

### Phase 3 - Development

- Backend Development
- Frontend Development
- API Integration

### Phase 4 - Testing

- Unit Testing
- Integration Testing
- User Acceptance Testing

### Phase 5 - Deployment

- Production Setup
- User Training
- System Launch

---

## Future Enhancements

- QR Code Asset Tracking
- Barcode Scanning
- Email Notifications
- Equipment Reservation System
- Mobile Application
- Asset Maintenance Tracking
- Dashboard Analytics
- Department Performance Reports

---

## Contributors

This project is being developed by the ICT Department to improve asset management, accountability, and operational efficiency within the organization.

---

## License

This project is intended for internal organizational use.

All rights reserved.
