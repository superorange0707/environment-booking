
# Pilot Environment Booking System - User Guide

Welcome to the **Pilot Environment Booking System**! This guide will help you navigate the system, understand user roles, and make the most of its features.

---

## Accessing the System

1. Visit the application URL: [Insert URL here].
2. Log in using your **OpenShift** credentials.

---

## User Roles

### Administrator Role
As an administrator, you can:
- **Manage bookings:** View, cancel, and manage existing bookings.
- **Environment status overview:** Monitor the real-time status of each cluster, including:
  - Current bookings.
  - Utilization rates.
  - Environment statuses (e.g., Ready, Maintenance).
- **Set environment status:** Mark environments as **Maintenance** or **Ready**.
- **Calendar access:** View bookings and manage them directly from the calendar.
- **Audit Logs:** 
  - Access all audit logs via the **Audit Logs** button at the top of the page.
  - Use filters to search logs by **environment**.
  - Alternatively, view specific audit logs for a booking directly from the calendar. Each booking event has two buttons: **Cancel Booking** and **View Audit Logs**.
- **Export logs:** Export audit logs to CSV for analysis or reporting.

---

### Standard User Role

As a standard user, you have access to:
- **Calendar View:**
  - Check booking events and details by clicking on a specific event.
  - Use filters to refine the calendar view by **environment**.
  - Make bookings directly from the booking form by selecting a start date, end date, and providing a purpose.
- **Cluster Status Panel:**
  - **Real-time Tab:** 
    - View each cluster’s current status, including whether it is Ready or Booked for today.
    - **For today’s bookings:**
      - If a cluster is currently booked, the environment card will display the status as **Currently Booked**.
      - A line at the bottom of the card will indicate the **Next Available Date**. 
      - Click the **Info Symbol (ℹ)** next to the Next Available Date to view the details of the current booking, including:
        - Booking owner.
        - Environment name.
        - Booking period.
        - Purpose.
    - Hover over an environment card to see any **upcoming bookings**.
    - **Clicking on an environment card will open the Booking Form** pre-filled with the selected environment.
  - **Planned Tab:**
    - Choose a desired date to check the **availability of clusters**.  

---

## Making a Booking

### From the Calendar
1. Navigate to the calendar view.
2. Click on the **Book Environment** button.
3. Select the desired cluster, start and end dates, and provide a purpose.
4. Submit the form to confirm your booking.

### From the Cluster Status Panel
1. Navigate to the **Real-time Tab**.
2. Click on an environment card to open the **Booking Form**.
3. Select the start and end dates (pre-filled environment), and provide a purpose.
4. Submit the form to confirm your booking.

---

### Note:  
This applies to **both booking methods**:  
- Clusters in **Maintenance** cannot be booked and will appear disabled.  
- Unavailable dates will be greyed out in the date picker.  

---

## Viewing Bookings and Details

- **Calendar View:**
  - Click on any booking event to see details such as the booking owner, environment, booking period, and purpose.
  - Use the **environment filter** to refine the view.
- **Cluster Status Panel:**
  - Hover over an environment card to view upcoming bookings.
  - For today’s bookings:
    - Check the **Info Symbol (ℹ)** next to the **Next Available Date** line on the card to view details of the current booking.

---

## Features Overview

- **Maintenance Mode:** Clusters in maintenance mode cannot be booked until the administrator marks them as Ready.
- **Real-Time Booking Insights:** Monitor booking statuses, including today’s bookings, next available dates, and upcoming bookings.
- **Planned Bookings:** Easily check future availability and plan accordingly.
- **Environment Filters:** Both in the calendar and logs, filters are available to focus on specific environments.
- **Comprehensive Logs:** Access and export audit logs for transparency and reporting.

---

For any technical issues or further assistance, please contact the system administrator at [Insert Contact Info].

---
