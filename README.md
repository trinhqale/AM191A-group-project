# Gender Inequality in Transportation and Work-Life Balance among UCLA Female Faculty

## Table of Contents
* [Objective](#Objective)
* [Who is being empowered](#Who-is-being-empowered)
* [Technologies Used](#technologies-used)
* [How our project can be repurposed](#How-our-project-can-be-repurposed)
* [Features](#features)
* [Screenshots](#screenshots)
* [Acknowledgements](#acknowledgements)
* [Contact](#contact)
<!-- * [License](#license) -->


## Objective
The objective of our project is to provide a platform where female faculty at UCLA—both caregivers and single women—can anonymously share their experiences with their commute and work-life balance. There is a lot of focus on female faculty and staff gaining enriching experiences in schools like UCLA, but many have family responsibilities as well as economic, cultural, physical, and psychological obstacles that impact their work-life balance. Overall, our hope is that this project brings more female faculty and staff together in sharing their experiences with their commute and work-life balance in a way that can be shared with future generations of women coming to UCLA.

## Who is being empowered
Our mapplication is intended to empower female faculty at UCLA, including both caregivers with dependents and single women, as both groups will benefit from an increased awareness about the commutes of female faculty and their personal experiences with work-life balance. 

## Technologies Used
- Leaflet - version 1.7.1
- Papa Parse - version 5.3.0
- Turf.js - version 6.3.0

## How it can be repurposed
- Our project can be repurposed to gather data and insights about gender disparities in transportation and work-life balance among their female faculty and staff at other institutions other than UCLA. Adapting our project to other institutions can help create a broader understanding of the challenges faced by women in academia. In addition, partnering with organizations or initiatives that advocate for gender equality, work-life balance, or transportation accessibility can also repurpose our project. 

## Features
- Navigation Bar: The project includes a navigation bar at the top of the page. It consists of a logo, "Add Story" button, "About" link, and "Home" link. These elements allow users to access different sections of the website.
- Modal: The project includes a modal that displays additional information about the map experience when the user clicks on the "About" link. The modal contains an image, a title, and a description of the project.
- Popups: The project includes two popups triggered by hovering over the "Caregiver" and "Non-caregiver" text in the toggle container. These popups provide brief descriptions of caregivers and non-caregivers.
- Story Table: The project includes a hidden div that contains a table for displaying user responses. The table has sortable columns and displays information such as caregiver status, commute mode, work-life balance rating, impact of commute on work-life balance, impact of family responsibilities on commute, and additional comments.
- Map Display: The project uses Leaflet.js to display an interactive map. The map is displayed in the "the_map" div and allows users to interact with different regions by clicking on them.
- Caregiver and Non-caregiver Toggles: The project includes toggles for selecting caregiver and non-caregiver groups. These toggles are clickable and visually represent the number of positive, neutral, and negative responses for each group using progress bars.
- Progress Bars: The project includes progress bars that visually represent the distribution of positive, neutral, and negative responses for both caregiver and non-caregiver groups. The progress bars change color when hovered over and provide additional information when clicked.
- Story Bubbles: The project includes two containers for displaying caregiver and non-caregiver stories. These containers, represented by bubbles, are initially empty but are populated with stories when the user interacts with the map.
- Image Container: The project includes an image container that displays two images, one representing caregivers and another representing non-caregivers. These images are accompanied by the caregiver and non-caregiver story bubbles.
- Footer: The project includes a footer that displays the copyright information.
- JavaScript Files: The project includes external JavaScript files, such as "init.js" and "sortTable.js," which contain scripts for initializing the map and sorting the table, respectively.

## Screenshots
![Website usage demo](https://github.com/trinhqale/AM191A-group-project/blob/main/Project-demo.gif)
<!-- If you have screenshots you'd like to share, include them here. -->


## Acknowledgements
- Many thanks to Professor Albert Kochaphum who gave us guidance throughout the project
- This project was inspired by Madeline Brozen

