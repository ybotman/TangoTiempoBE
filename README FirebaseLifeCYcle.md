Here’s a typical lifecycle for adding a new Firebase authenticated user from your frontend (FE) and interacting with your backend (BE) to manage user data in the UserLogin table.

1. User Initiates Login

	•	The frontend (FE) prompts the user to log in using their preferred authentication method (e.g., Google, Facebook, Email, etc.).
	•	Use Firebase Authentication to handle this process.

2. Firebase Authentication

	•	The user completes the login process, and Firebase returns a token (ID token) and user information (e.g., uid, email, etc.).
	•	Firebase also manages the user’s authentication state, so the FE can detect if the user is logged in.

3. Check for Existing User

	•	The FE sends the Firebase user information (particularly the uid) to your backend (BE) to check if the user already exists in the UserLogin table.
	•	The BE API (/userLogin/api/check) checks the UserLogin collection for an entry with the firebaseUserId matching the user’s uid.

4. Insert or Update User in UserLogin

	•	New User:
	•	If the user does not exist, the BE will create a new entry in the UserLogin table with the relevant details (e.g., firebaseUserId, authType, etc.).
	•	API Endpoint: POST /userLogin/api/add
	•	Existing User:
	•	If the user exists, you may update their information, such as last login time or any other relevant details.
	•	API Endpoint: PUT /userLogin/api/update

5. Return User Data to Frontend

	•	The BE returns user details and any roles or permissions to the FE after the check or insert/update.
	•	The FE can now store this information locally (e.g., in state) and manage the user’s session and permissions accordingly.

6. User Interaction

	•	The user can now interact with the application according to their role. This role might be managed in real-time via Firebase or by looking it up in the UserLogin table.

7. User Log Out

	•	When the user logs out, the FE should clear any stored user session information and call Firebase to sign out the user.


This lifecycle ensures that your application keeps track of users in the UserLogin table while leveraging Firebase’s robust authentication system to manage user sessions and roles.