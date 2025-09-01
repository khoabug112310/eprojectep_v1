Functional Requirements  
The Web application will be designed with a set of forms/pages with menus  
representing choice of activities to be performed.  
Following are the functional requirements of the application:

Home Page  
The home page of the CineBook will serve as the primary entry point for users, designed  
to be visually engaging, user-friendly. It will highlight featured movies, provide quick  
booking access, and display relevant offers to enhance user convenience.  
Key Features:  
â€¢ Featured & Trending Movies â€“ showcase currently running and upcoming  
films with posters and trailers.  
â€¢ Smart Search & Filters â€“ allow users to search by movie, theatre, city, or  
genre.  
â€¢ Promotions & Announcements â€“ display special offers, discounts, and festival  
updates.  
1.1 User Registration and Authentication  
â€¢ The system shall allow new users to register using email, phone number.  
â€¢ The system shall allow registered users to log in securely with password.  
â€¢ The system shall provide a password recovery/password change mechanism.  
â€¢ The system shall allow users to update their personal profile (name, age,  
preferred language, preferred city).

1.2 Movie Browsing and Search  
â€¢ The system shall display a list of currently running and upcoming movies.  
â€¢ Users shall be able to filter movies by:  
o City  
o Genre (Action, Drama, Comedy, etc.)  
o Language (Vietnamese, English, Korean, etc.)  
o Rating  
o Date (current & future showtimes).  
â€¢ The system shall provide a search bar to search movies by title, actor, or  
director.  
â€¢ Each movie detail page shall display:  
o Trailer  
o Synopsis  
o Cast & crew  
o Reviews & ratings (with sorting by latest or highest rated).

1.3 Ticket Booking  
â€¢ The system shall allow users to select:  
o Theater location  
o Movie  
o Show date & time  
o Seat category (Gold, Platinum, Box).  
â€¢ The system shall display a seat map with availability.  
â€¢ Users shall be able to select multiple seats in a single transaction.  
â€¢ Booking shall be confirmed only after successful payment (dummy).

1.4 E-Ticketing & Confirmation  
â€¢ After payment (dummy), the system shall generate an e-ticket.  
â€¢ E-ticket shall include:  
o Movie name, theater, showtime  
o Seat number & category  
o Booking ID.  
â€¢ Users shall be able to view past and upcoming bookings in their profile.

1.5 Reviews & Ratings  
â€¢ Registered users shall be able to rate movies (1â€“5 stars).  
â€¢ Users shall be able to write reviews.  
â€¢ The system shall display reviews sorted by latest, or highest rating.  
â€¢ Admin shall have the right to moderate/delete inappropriate reviews.

1.6 Admin Management  
â€¢ Admin shall log in to access.  
â€¢ Admin shall be able to perform CRUD operations:  
o Add, edit, delete theaters (with city, address, seating capacity).  
o Add, edit, delete movies (title, poster, genre, duration, trailer link).  
o Add, edit, delete showtimes (date, time, rates for seat classes).  
â€¢ Admin shall be able to set pricing dynamically based on:  
o Weekend vs weekday  
o Peak hours vs normal hours  
o Seat category.  
â€¢ Admin shall be able to generate reports on:  
o Daily/weekly/monthly ticket sales  
o Revenue per theater  
o Most popular movies  
o Registered users and active bookings.

1.7 Notifications  
â€¢ The system shall send notifications.  
â€¢ Users shall be notified of:  
o Booking success/failure  
o Upcoming show reminders (2 hours before showtime)  
o Promotional offers (e.g., holiday discounts).  
Non-Functional Requirements  
There are several non-functional requirements that should be fulfilled by the Web  
application.  
These include:  
Safe to use: The Web application should not result in any malicious downloads or  
unnecessary file downloads.  
Accessible: The Web application should have clear and legible fonts, user-interface  
elements, and navigation elements.  
User-friendly: The Web application should be easy to navigate with clear menus and  
other elements and easy to understand.  
Operability: The Web application should operate in a reliably efficient manner.  
Performance: The Web application should demonstrate high value of performance  
through speed and throughput. In simple terms, the Web application should be fast to  
load and page redirection should be smooth.  
Security: The Web application should implement adequate security measures such as  
authentication. For example, only registered users can access certain features.  
Availability: The Web application should be available 24/7 with minimum downtime.

Software  
Technologies to be used: \[Choose as per Course/Semester\]  
Frontend: ReactJS 18   
Backend: Laravel   
Database: MySQL 