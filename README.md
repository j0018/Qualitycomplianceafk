<h1>Time Tracking Website</h1>

## Project Overview

<p>This project provides a real-time tracking dashboard designed for small teams of 10–20 users to monitor the balance between active work and idle time. It features a live status board showing who is currently active or AFK (Away From Keyboard), alongside analytics that calculate average weekly performance metrics. By translating user activity data into clear insights, it helps teams optimize workflows, balance workloads, and keep accurate operational records without the overhead of heavy enterprise software.</p>
<br> 
<p>What began as a lightweight data-tracking spreadsheet has evolved into a fully responsive web application, with active development underway to expand into a multi-tenant client-server architecture featuring tailored Work and Study environments.</p>

<h2>Evolution and Roadmap</h2><br>

### Phase 1: The Origin (Spreadsheet Prototype)
* **Goal:** Create a lightweight, real-time availability and activity logging tool to help management balance workloads, track context switching (e.g., active vs. away states), and consolidate automated timesheets.
* **Implementation:** Built using Google Sheets, integrated Apps Script macros (interactive "AFK" and "Return" action buttons), automated timesheet tab generation, and cell-level permissions for supervisory reporting.
* **Key Limitations & Technical Pivot Points:**
  * **Data Integrity Hazards:** Even with sheet protection, cell protection in Google Sheets could be bypassed or broken by bulk copy-pasting, exposing logs to accidental tampering.
  * **State Synchronization Latency:** Using Google Apps Script buttons created execution delays (2–5 seconds per state change), causing race conditions when multiple users toggled status simultaneously.
  * **Audit Log Immutability:** Google Sheets lacked a true, immutable append-only audit trail; past time entries could not be securely locked down at scale without complex scripting.
  * **Scalability & UX Bottlenecks:** Spreadsheet UI could not dynamically adapt to user roles (e.g., hiding supervisory views cleanly from standard employees without maintaining separate workbooks).
<h3>Phase 2: Website  </h3>
<h3>Phase 3: Platform Architecture and Expansion </h3>


## 🛠️ Credits & Authors

* **Maica** ([@j0018](https://github.com/j0018)) - Core Developer & Project Creator
* **figma make** - UI/UX Design & Wireframing

<h1>Running the code</h1>
<br>
Run npm i to install the dependencies.
<br>
Run npm run dev to start the development server.
