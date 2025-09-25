FPT ACADEMY INTERNATIONAL
FPT – APTECH COMPUTER EDUCATION
Centre Name: ACE-HCMC-2-FPT.
Address: 21Bis Hau Giang, Ward 4, District Tan Binh, HCM City, Viet Nam.
MediConnect Group
Doctor Appointment Booking Platform
Supervisor: Mrs. Pham Thi Lanh
Term: 1
Batch No: T3.2503.E1
Group No: 4
Order: Full name Roll No.
1. Mai Tran Thuy Dan T3S2503002
2. Le Thi Kieu Duyen T3S2502004
3. Luu Anh Thuan T3S2503005
4. Tran Quoc Toan T1S2502001
Month 9 Year 2025

---

## Project Semester 1 Group 4: MediConnect Group
### Certificate of Completion
This is to certify that
—-------------------—-------------------
Mr./Ms. __________________________
Has successfully Designed & Developed
Submitted by: __________________________
Date of Issue: __________________________
Authorized Signature: ___________________

---

## Project Semester 1 Group 4: MediConnect Group
### ACKNOWLEDGEMENT
We would like to express our deepest gratitude to all those who have supported us during the
development of our MediConnect project. This achievement is the result of combined efforts,
guidance, and encouragement from many individuals and groups who played vital roles
throughout the journey.
First and foremost, our sincere thanks go to our instructor, Mrs. Pham Thi Lanh, for her
dedicated guidance and mentorship. She not only gave us constructive feedback and clear
direction but also provided continuous encouragement that helped us overcome both technical
obstacles and psychological challenges. Her commitment, patience, and insights have been
invaluable in shaping our learning process and in ensuring that our project reached a higher
standard of quality.
We are equally grateful to the eProjects Team at Aptech, who offered us the opportunity to
apply our classroom knowledge into a real-world project environment. Their constant support,
mentorship, and timely advice provided the right balance between academic learning and
practical application. This collaboration has greatly enriched our understanding of how to
transform theoretical concepts into functioning solutions.
Our special thanks also go to all the staff members of the center, who contributed by offering
encouragement, cooperation, and logistical support. Their willingness to assist and provide a
conducive environment allowed us to focus on completing the project effectively and on time.
We also extend our heartfelt appreciation to our classmates and fellow team members, who
shared ideas, supported one another, and worked tirelessly as a unit. The brainstorming
sessions, coding marathons, and mutual encouragement turned this project into not only a
technical accomplishment but also a memorable collective experience.
This project has been a valuable milestone in our academic journey. The skills, lessons, and
spirit of collaboration gained here will continue to guide and inspire us in our future
professional endeavors.

---

## Project Semester 1 Group 4: MediConnect Group
### SYNOPSIS
The project MediConnect is developed to address a common challenge in healthcare: patients
often need to physically visit clinics and spend long hours in queues just to book or
reschedule appointments. This process not only causes inconvenience but also reduces the
efficiency of healthcare delivery.
The primary objective of MediConnect is to create a centralized and user-friendly platform
that bridges the gap between patients and doctors. Through this system, patients can easily
search for specialist doctors, view their profiles, and manage appointments online. Doctors, in
turn, can organize their schedules, update their availability, and interact more effectively with
patients. Administrators are also empowered to oversee records and publish reliable
healthcare information for the community.
The system is designed not only to simplify appointment booking but also to enhance
accessibility to healthcare resources. By integrating information on diseases, prevention
methods, cures, and the latest medical news, MediConnect aims to become a reliable
companion for both patients and medical professionals.
The expected outcome is a robust and accessible healthcare appointment management
solution that reduces waiting time, improves efficiency, and fosters better communication
between doctors and patients. Ultimately, MediConnect demonstrates the potential of
technology to make healthcare more convenient, reliable, and community-oriented.

---

## Project Semester 1 Group 4: MediConnect Group
### TABLE OF CONTENTS AND FIGURE CATEGORIES
Chapter 1. PROBLEM DEFINITION..................................................................................................7
Chapter 2. CUSTOMER'S REQUIREMENTS SPECIFICATIONS(CRS)......................................8
2.1 Business/Project Objective...........................................................................................................8
2.2 Hardware/Software Requirements............................................................................................... 8
Hardware Requirements:............................................................................................................. 8
Software Requirements:...............................................................................................................9
2.3 Scope of Work (SOW)..................................................................................................................9
Chapter 3: ARCHITECTURE AND DESIGN OF THE PROJECT...............................................11
Chapter 4. FLOW CHART................................................................C................................................13
4.1. Guests User................................................................................................................................13
4.2. Patient........................................................................................................................................14
4.3. Doctor........................................................................................................................................15
4.4. Admin........................................................................................................................................16
Chapter 5. DFD DIAGRAMS..............................................................................................................23
5.1. DFD Level 0..............................................................................................................................23
5.2. DFD Level 1..............................................................................................................................24
Chapter 6. DATABASE DESIGN........................................................................................................28
6.1. Entity Relationship (ER) Diagram............................................................................................28
6.2. Data description of tables..........................................................................................................28
Chapter 7. INTERFACE OF APPLICATION...................................................................................33
7.1. Login, Logout............................................................................................................................33
7.2. Register......................................................................................................................................33
7.3. Forgot password........................................................................................................................ 34
7.4. Home page.................................................................................................................................34
7.5. Category Page............................................................................................................................37
7.6. Content Detail............................................................................................................................37
8.1. Patient Dashboard......................................................................................................................38
8.2. Patient Profile............................................................................................................................39
8.3. Doctor List.................................................................................................................................40
8.4. Detail Doctor & Booking Doctor..............................................................................................40
8.5. Patient Appointment..................................................................................................................41
9.1. Doctor Dashboard......................................................................................................................45
9.2. Doctor Profile............................................................................................................................45
9.3. Doctor Availability Scheduling.................................................................................................45
9.4. Doctor Appointments................................................................................................................46
9.5. Doctor Appointment Management............................................................................................47
10.1. Admin Dashboard....................................................................................................................47
10.2. User Management....................................................................................................................48
10.3. Patient Management................................................................................................................48
10.4. Doctor Management................................................................................................................49

---

## Project Semester 1 Group 4: MediConnect Group
10.5. City Management....................................................................................................................49
10.6. Content Management.............................................................................................................. 50
10.7. Contact Message Management................................................................................................50
Chapter 8: TASKS SHEET..................................................................................................................51
Chapter 9: CHECKLIST OF VALIDATIONS.................................................................................. 53
Chapter 10: SUBMISSION CHECKLIST.........................................................................................53
Chapter 11: USER GUIDE.................................................................................................................. 54
11.1. System Requirements..............................................................................................................54
11.2. Install and Run Application.....................................................................................................54
11.3. Default Accounts (Seeded Data)............................................................................................. 55

---

## Project Semester 1 Group 4: MediConnect Group
### Chapter 1. PROBLEM DEFINITION
MediConnect is a web-based application developed with the mission of improving the
accessibility and efficiency of healthcare services for patients and doctors. To meet the needs
of modern medical appointment management, MediConnect has been built using React for the
frontend and Laravel for the backend, integrated with a powerful database system to ensure
accuracy, security, and performance.
Attractive and user-friendly interface: The application is designed with a professional and
intuitive interface, ensuring easy navigation for patients, doctors, and administrators. Clear
layouts and logical arrangements allow users to quickly interact with system features in a
natural way.
Efficient Healthcare Service Management: MediConnect enables comprehensive
management of medical services, including patient registration, doctor scheduling,
appointment booking, rescheduling, and cancellations. Categorizing services by specialization
and location ensures better organization and ease of access for users.
Centralized and Secure Database: A robust database system is integrated to manage doctor
and patient records securely and efficiently. This guarantees data consistency, reliability, and
quick retrieval of information when required.
Appointment Management and Notifications: The system provides advanced features for
real-time appointment booking and management. Patients receive timely confirmations and
reminders, while doctors are instantly notified of new bookings or changes, ensuring smooth
coordination.
Community and Information Hub: Beyond appointments, MediConnect offers a platform
for sharing valuable healthcare knowledge, including information on common diseases,
prevention methods, cures, and the latest medical news. This strengthens its role as both a
service and a trusted community resource.
With these features, MediConnect not only solves the traditional issues of long queues and
manual scheduling but also demonstrates how technology can modernize healthcare, improve
efficiency, and enhance the patient–doctor experience.

---

## Project Semester 1 Group 4: MediConnect Group
### Chapter 2. CUSTOMER'S REQUIREMENTS
SPECIFICATIONS(CRS)
The main objective of the MediConnect project is to provide a centralized, accessible, and
user-friendly healthcare web application that addresses challenges faced by patients and
doctors:
● Enable patients to search specialist doctors by city and specialization.
● Provide online appointment booking, rescheduling, and cancellation to minimize
physical visits and waiting times.
● Maintain comprehensive digital records of doctors and patients for streamlined access.
● Offer a knowledge base including diseases, cures, prevention tips, and latest medical
news.
● Enhance overall healthcare accessibility, operational efficiency, and modernization of
medical services.
This project bridges the gap between healthcare providers and patients by using technology to
deliver convenient, secure, and efficient medical service management
### 2.2 Hardware/Software Requirements
#### Hardware Requirements:
● Intel Core i5/i7 processor (or higher).
● 8 GB RAM or above.
● 500 GB Hard Disk space.
● Color SVGA display.
Standard input devices (mouse, keyboard).
#### Software Requirements:

---

## Project Semester 1 Group 4: MediConnect Group
● Frontend: HTML5, CSS3, Bootstrap, ReactJS 18+ (or AngularJS/Angular 9+),
JavaScript, jQuery, XML.
● Backend:
○ Java 16+ (with Apache NetBeans or Eclipse), Java EE 7+/Jakarta EE 9+, OR
○ C# 7.2 with ASP.NET MVC/Core (Visual Studio 2019+), OR
○ PHP 7.2+ with Laravel Framework, OR
○ Python 3.0+ with Flask or Django.
● Database: MySQL 8.0+ or SQL Server 2019+.
These configurations ensure scalability, security, and compatibility with modern web
standards
### 2.3 Scope of Work (SOW)
The scope of the MediConnect project covers the complete design, development, and
integration of a web-based doctor appointment booking platform. The main activities include:
1. System Analysis & Design
○ Creation of the Entity Relationship (ER) Diagram.
○ Development of Flow Charts and Data Flow Diagrams (DFD).
○ Preparation and documentation of the full project report.
2. User Functionality Development (Frontend & Backend)
○ Implementation of user authentication: Login, Logout, Registration, and Forgot
Password.
○ Development of the main interface: Home Page, Category Page, Content
Detail, Global Search, and Contact Form.
○ Patient features: Dashboard, Profile Management, Doctor List, Doctor Detail,
Appointment Booking, and Appointment Management.
3. Doctor Functionality Development

---

## Project Semester 1 Group 4: MediConnect Group
○ Doctor Dashboard and Profile Management.
○ Availability Scheduling for consultations.
○ Management of patient appointments and appointment details.
4. Admin Functionality Development
○ Admin Dashboard and User Management.
○ Patient Management and Doctor Management.
○ Content Management and Contact Message Management.
○ City Management.

---

## Project Semester 1 Group 4: MediConnect Group
### Chapter 8: TASKS SHEET
### Chapter 9: CHECKLIST OF VALIDATIONS
### Chapter 10: SUBMISSION CHECKLIST
### Chapter 11: USER GUIDE
#### 11.1. System Requirements
#### 11.2. Install and Run Application
#### 11.3. Default Accounts (Seeded Data)




---

## Project Semester 1 Group 4: MediConnect Group
### Chapter 3: ARCHITECTURE AND DESIGN OF THE PROJECT
The MediConnect web application follows a multi-tier client–server architecture:
1. Presentation Layer (Frontend):
○ Implemented using ReactJS/AngularJS, Bootstrap, and responsive web design.
○ Provides intuitive interfaces for patients, doctors, and administrators.
○ Features include dashboards, appointment scheduling forms, profile pages, and
medical content display.
2. Application Layer (Backend):
○ Built on frameworks such as Laravel, ASP.NET, or Django.
○ Handles business logic: user authentication, profile management, scheduling,
notifications, and content updates.
○ Ensures security through credential validation and role-based access control.
3. Data Layer (Database):
○ MySQL or SQL Server stores structured records of patients, doctors,
appointments, and knowledge base content.
○ Provides reliable, consistent, and secure data access.
4. System Integration & Features:
○ Email/SMS notifications for appointment confirmations and reminders.
○ Administrative management of users, cities, and content.
○ Sitemap for navigation flow.
○ High availability and performance optimization for 24/7 operations.
This design ensures separation of concerns, scalability, and maintainability, while providing a
seamless experience across different user roles

---

## Project Semester 1 Group 4: MediConnect Group
### Chapter 4. FLOW CHART
#### 4.1. Guests User

---

## Project Semester 1 Group 4: MediConnect Group
#### 4.2. Patient

---

## Project Semester 1 Group 4: MediConnect Group
#### 4.3. Doctor

---

## Project Semester 1 Group 4: MediConnect Group
#### 4.4. Admin

---

## Project Semester 1 Group 4: MediConnect Group
### Guest User:
No. Functions Describe
1 Search Global The system allows users to perform a
global search directly from the Home
Page. The results display relevant articles,
medical news, and related content.
2 Browse Categories Users can browse categories from the
Home Page, including About Us and
Doctor & Booking sections, enabling
them to explore different types of
information and services.
3 View Articles / Medical News Through the Search Content function and
by browsing topics and categories on the
Home Page, users are able to view and
read articles and medical news for
informational purposes.
4 Submit Contact Form The system provides a Contact Us Form,
allowing users to submit inquiries,
feedback, or requests for support directly
to the system administrators.
5 Booking Now From the Doctor & Booking section,
users can make an appointment. If the
user is not registered, the system redirects
to Registration followed by Login; if
already registered, the user proceeds
directly to Login → Role → Search
Doctors & Booking to complete the
process.
### Patient:
No. Functions Describe
1 Login, Register, and Logout New patients create an account by
providing: full name, address, phone
number, email, and password.
After successful registration, patients log
in with their credentials to access the
system’s features.
Logout functionality terminates the active
session securely, ensuring data protection.
2 Forgot/Reset Password Patients who forget their password initiate
a reset request via the login page.
They enter their registered email address
into the reset form.
The system sends a secure reset link to the
patient’s email.
Patients define a new password and regain
access to the system.
3 Update Profile Patients may update their personal details
such as phone number, address, and
email.
They can upload or update their profile
picture.
All changes are saved immediately to
keep records accurate and consistent.
4 Search Doctors Patients can search for doctors by city,
specialization.
The system filters and displays a list of
doctors matching the search criteria.
5 View Doctor Profile From the search results, patients open a
doctor’s profile page.
Doctor details include qualifications,
specialization, consultation schedule, and
availability.
This enables patients to make informed
booking decisions.

---

## Project Semester 1 Group 4: MediConnect Group
6 Book Appointment Patients select a doctor and choose a
preferred date and time slot from the
schedule.
The system validates slot availability in
real time to prevent conflicts.
Once confirmed, the appointment is
recorded in the database.
A confirmation email is sent, and navigate
to the patient appointment management
page to track status.
7 Manage Appointments Patients view all scheduled appointments
in their dashboard.
They can reschedule appointments to
another available slot.
They can cancel appointments if
necessary.
All updates are instantly reflected in the
system.
Notifications are automatically sent to
doctor for any changes.
### Doctor:
No. Functions Describe
1 Login and logout Doctors log in with secure credentials to
access their personalized dashboard.
Logout ensures that the active session is
properly terminated, maintaining account
security.
2 View Overview Doctors access the main dashboard which
provides an overview of their activities.
The dashboard displays the number of
scheduled appointments, the number of
patients, and available slots, along with
upcoming appointment and notifications
3 Update Profile Doctors can update their personal details
such as specialization, qualifications, and
contact information.
Keeping the profile updated ensures that
patients see accurate and trustworthy
information before booking.
4 Manage Availability Doctors set or modify their consultation
schedule, specifying available days, time
slots, or periods.
This schedule is visible to patients during
the booking process and prevents
overlapping appointments.
5 Manage Appointment Doctors view all scheduled patient
appointments in their dashboard.
They can review appointment requests
and confirm availability.
6 Manage Appointment Details Doctors access detailed patient
information linked to each appointment.
They can also view notifications related to
booking confirmations, reschedules, or
cancellations.
This ensures that doctors remain informed
of any changes in real time.
### Admin
No. Functions Describe
1 Login and logout Admins log in with secure credentials to
access the administration dashboard.
Logout functionality terminates the




session securely to ensure system
protection.
2 View Overview The admin dashboard provides a
consolidated overview of the system.
It highlights the number of registered
users, doctors, and patients, as well as the
number of appointments, recent activities
quick access.
3 Manage Users Admins create, update, or deactivate user
accounts.
This ensures proper access control and
prevents unauthorized use of the system.
4 Manage Doctors Admins add, update, or delete doctor
details such as name, specialization,
qualifications, and contact information.
Keeping doctor records accurate ensures
patients can book with up-to-date profiles.
5 Manage Patients Admins maintain patient records by
adding, updating, or removing details
when necessary.
This function ensures that the system
database remains clean and accurate.
6 Manage Cities Admins manage the master list of cities
available in the system.
They can add new cities, update existing
ones, or remove inactive records.
Accurate city records ensure patients can
search doctors correctly by location.
7 Manage Content Admins publish, update, or remove
informational content such as disease
prevention, cures, and medical news.
This keeps the website knowledge base
current and valuable for patients.

---

## Project Semester 1 Group 4: MediConnect Group
### 8 Manage Contact Messages Admins view messages submitted via the
“Contact Us” form, including patient
name, email, phone, and message content.
They can track, respond to, and resolve
inquiries to improve user support and
satisfaction.

---

## Project Semester 1 Group 4: MediConnect Group
### Chapter 5. DFD DIAGRAMS.
#### 5.1. DFD Level 0

---

## Project Semester 1 Group 4: MediConnect Group
#### 5.2. DFD Level 1
Guest Level 1

---

## Project Semester 1 Group 4: MediConnect Group
Patient Level 1

---

## Project Semester 1 Group 4: MediConnect Group
Doctor Level 1

---

## Project Semester 1 Group 4: MediConnect Group
Admin Level 1

---

## Project Semester 1 Group 4: MediConnect Group
### Chapter 6. DATABASE DESIGN
#### 6.1. Entity Relationship (ER) Diagram
#### 6.2. Data description of tables
Table: Roles
Field name Data Type Null Key Describe Notes
role_id int Not
role_name varchar Not
Table: Medi_Users
Field name Data Type Null Key Describe Notes
user_id int Not PK
username varchar Not UK
password varchar Not

---

## Project Semester 1 Group 4: MediConnect Group
login_attempts int Not
locked_until timestamp Yes
role_id int Not FK
Table: Categories
Field name Data Type Null Key Describe Notes
category_id int Not PK
Category_ varchar Not
name
Table: Content
Field name Data Type Null Key Describe Notes
content_id int Not PK
category_id int Not FK
created_by int Not FK
title varchar Not
description text Not
image varchar Yes
name text Not
Table: City
Field name Data Type Null Key Describe Notes
city_id int Not PK
city_name varchar Not

---

## Project Semester 1 Group 4: MediConnect Group
Table: Contact_Messages
Field name Data Type Null Key Describe Notes
message_id int Not PK
city_name varchar Not
name varchar Not
email varchar Not
phone varchar Not
message text Not
status enum Not
created_at timestamp Not
Table: Patients
Field name Data Type Null Key Describe Notes
patient_id int Not PK
name varchar Not
address varchar Not
phone varchar Not UK
dob date Yes
email varchar Not UK
gender enum Yes
image varchar Yes
user_id int Not FK, UK




---

## Project Semester 1 Group 4: MediConnect Group
### Table: Doctors
Field name Data Type Null Key Describe Notes
doctor_id int Not PK
name varchar Not
qualification varchar Not
experience int Not
phone varchar Not UK
email varchar Not UK
specialization varchar Not
gender enum Not
dob date Not
image varchar Yes
city_id int Not FK
user_id int Not FK, UK
description text Yes
### Table: Availability Scheduling
Field name Data Type Null Key Describe Notes
availability_id int Not PK
doctor_id int Not FK
available_date date Not
available_time time Not
status enum Not

---

## Project Semester 1 Group 4: MediConnect Group
### Table: Appointment
Field name Data Type Null Key Describe Notes
appointment_id int Not PK
patient_id int Not FK
availability_id int Not FK
status enum Not
created_at timestamp Yes
updated_at timestamp Yes
### Table: Notifications
Field name Data Type Null Key Describe Notes
id int PK
doctor_id int FK
patient_id int Yes FK
appointment_id int Yes FK
type enum
message text Yes
is_read tinyint
created_at timestamp Yes
updated_at timestamp Yes

---

## Project Semester 1 Group 4: MediConnect Group
### Chapter 7. INTERFACE OF APPLICATION
#### 7.1. Login, Logout
#### 7.2. Register

---

## Project Semester 1 Group 4: MediConnect Group
#### 7.3. Forgot password
#### 7.4. Home page

---

## Project Semester 1 Group 4: MediConnect Group

---

## Project Semester 1 Group 4: MediConnect Group

---

## Project Semester 1 Group 4: MediConnect Group
#### 7.5. Category Page
#### 7.6. Content Detail

---

## Project Semester 1 Group 4: MediConnect Group
#### 8.1. Patient Dashboard

---

## Project Semester 1 Group 4: MediConnect Group
#### 8.2. Patient Profile

---

## Project Semester 1 Group 4: MediConnect Group
#### 8.3. Doctor List
#### 8.4. Detail Doctor & Booking Doctor




---

## Project Semester 1 Group 4: MediConnect Group
#### 8.5. Patient Appointment
##### 8.5.1 Pending
##### 8.5.2 Confirmed

---

## Project Semester 1 Group 4: MediConnect Group
##### 8.5.3 Rescheduled
##### 8.5.4 Cancelled By Patient

---

## Project Semester 1 Group 4: MediConnect Group
##### 8.5.5 Cancelled By Doctor
##### 8.5.6 Completed

---

## Project Semester 1 Group 4: MediConnect Group
##### 8.5.6 No Show

---

## Project Semester 1 Group 4: MediConnect Group
#### 9.1. Doctor Dashboard
#### 9.2. Doctor Profile
#### 9.3. Doctor Availability Scheduling

---

## Project Semester 1 Group 4: MediConnect Group
#### 9.4. Doctor Appointments

---

## Project Semester 1 Group 4: MediConnect Group
#### 9.5. Doctor Appointment Management
#### 10.1. Admin Dashboard

---

## Project Semester 1 Group 4: MediConnect Group
#### 10.2. User Management
#### 10.3. Patient Management

---

## Project Semester 1 Group 4: MediConnect Group
#### 10.4. Doctor Management
#### 10.5. City Management

---

## Project Semester 1 Group 4: MediConnect Group
#### 10.6. Content Management
#### 10.7. Contact Message Management




---

## Project Semester 1 Group 4: MediConnect Group
### Chapter 8: TASKS SHEET
Project
Date of Preparation of Activity Plan:
Ref.No.: Activity
Project Plan
Title: Prepared Actual
Sr. Actual Teammate
Task By: Start Status
No. Days Names
Date
1 Entity Relationship 23/8 1 Main: ✅
(ER) Diagram Toan
Asst:
Duyen &
Thuan
2 Flow Chart 23/8 1 Dan ✅
3 DFD 23/8 1 Dan ✅
4 Document 13/9 3 Main: ✅
Dan
Asst:
Duyen
5 Video 24/9 1 Duyen ✅
6 - Login, Logout Đan 28/8 10 Main: ✅
Medi
- Register Toan
Connect
- Forgot password
- Home page Asst: Dan
- Category Page & Duyen
- Content Detail & Thuan
- Global Search
- Contact Form
7 - Patient Dashboard 28/8 10 Duyen ✅
- Patient Profile
- Doctor List
- Detail Doctor
- Booking Doctor
- Patient Appointment
8 - Doctor Dashboard 28/8 10 Dan ✅
- Doctor Profile
- Doctor Availability
Scheduling
- Doctor Appointment

---

## Project Semester 1 Group 4: MediConnect Group
-Doctor Appointment
Management
9 - Admin Dashboard 28/8 10 Thuan ✅
- User Management
- Patient Management
- Doctor Management
- City Management
- Content Management
- Contact Message
Management
10 - Code Merge & 12/9 6 Dan - ✅
Integration Duyen -
Thuan

---

## Project Semester 1 Group 4: MediConnect Group
### Chapter 9: CHECKLIST OF VALIDATIONS
Option Validated
Do all numeric variables have a default value of zero? Yes
Does the administrator have all the rights to create and Yes
delete the records?
Are all the records properly fed into the appropriate Yes
database?
Have all the modules been properly integrated and are Yes
completely functional?
Have all the Design and Coding Standards been Yes
followed and implemented?
Is the GUI design consistent all over? Yes
Is the navigation sequence correct through all the Yes
forms/ screens in the application?
Is exception handling mechanism implemented in all Yes
the screens? Yes
Are all the program codes working? Yes
Is the Budget plan sufficient and verified? Yes
### Chapter 10: SUBMISSION CHECKLIST
No Particulars Yes No NA Comment
1 Are all users able to search for a Yes
particular record?
2 Are all old records properly saved and Yes
retrieved when required?
3 Have all modules been properly Yes
integrated and are completely functional?
4 Are GUI contents devoid of spelling Yes
mistakes?
5 Is the application user-friendly? Yes
6 Is the project published properly into a NA
setup file?

---

## Project Semester 1 Group 4: MediConnect Group
### Chapter 11: USER GUIDE
#### 11.1. System Requirements
No. Items Description
1 Operating Microsoft Windows 8.1, 10, or higher
System
2 Database MySQL 8.0+ or SQL Server 2019+
3 Software Visual Studio Code / Visual Studio 2019+ (with Laravel/ReactJS
support)
4 Backend PHP 7.2+ with Laravel Framework
5 Frontend ReactJS 18+ with Node.js 16+
6 Browser Google Chrome / Microsoft Edge (latest version)
#### 11.2. Install and Run Application
Step 1: Install MySQL 8.0+ (or SQL Server 2019+) on the local system.
Step 2: Clone the project source code and configure the .env file with database credentials.
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=mediconnect_db
DB_USERNAME=root
DB_PASSWORD=
Then generate the application key:
php artisan key:generate

---

## Project Semester 1 Group 4: MediConnect Group
Step 3: Install dependencies and run migration with seed:
composer install
php artisan migrate:fresh --seed
Step 4: Start the Laravel backend server:
php artisan serve
Step 5: Install frontend dependencies and start ReactJS server:
npm install
npm start
Step 6: Open browser and navigate to http://localhost:3000 to access MediConnect.
#### 11.3. Default Accounts (Seeded Data)
Role Email Phone Password
Admin admin@mediconnect.com admin@1234
Doctor doctor@mediconnect.com 0357892346 doctor@1234
Patient patient@gmail.com 0369692823 patient@1234


