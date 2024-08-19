# Online-Store-Web-Application
This project is a web application designed to facilitate online product purchases. It is developed using Node.js and the Express framework, providing a robust and scalable backend. The application features user authentication via cookies and sessions, with product data stored and managed in a MongoDB database. Users can add products to their shopping cart, review them, and place orders. The application supports two user roles: admin and standard user, with admins having the ability to add new products to the database.

## Technologies Used
	### Backend: Node.js (v18.16.0), Express.js (v4.x)
	### Database: MongoDB
	### User Authentication: Cookies, Sessions
	### Key Features

## User Authentication
	### Implements cookies and sessions for secure user login and authentication.
	### Differentiates between admin and standard users, granting admin users privileged access to manage products.

## Product Management
	### Stores product information in a MongoDB database.
	### Allows admin users to add new products, which are then displayed to all users on the website.

## Shopping Cart Functionality
	### Users can add products to their shopping cart.
	### Enables users to review their shopping cart contents before placing an order, managed through cookies.

## Security Measures
	### Blocks access from an IP address that attempts to access non-existent server resources.
	### Limits the number of consecutive failed login attempts from the same username, denying access if the limit is exceeded within a short period.
	### Protects against injection attacks by sanitizing inputs and implementing security measures for the MongoDB database.

## To set up the project, follow these steps

	### Clone the repository:
		git clone https://github.com/yourusername/your-repo-name.git

	### Navigate to the project directory:
		cd your-repo-name

	### Install the necessary dependencies:
		npm install

	### Start the application using Nodemon:
		nodemon app.js

## Usage
## Register and log in to explore the product listings.
## Add products to your shopping cart and review them before placing an order.
## Admin users can add new products to the database.
## Experience secure login procedures and protection against unauthorized access and injection attacks.
## Participate in the quiz questionnaire and view the results.
