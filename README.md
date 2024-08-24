Firebase User Roles

1. Anonymous

	•	Description: Users who can view events but have no interaction capabilities beyond that.
	•	Permissions:
	•	View events (read_events).

2. NamedUser

	•	Description: Users who can view events and set up their personal preferences.
	•	Permissions:
	•	View events (read_events).
	•	Set personal preferences (set_preferences).

3. RegionalOrganizer

	•	Description: Organizers who manage their own events, locations, and advertisements within their specific region. They are also responsible for processing payments related to their activities.
	•	Permissions:
	•	Create, read, update, and delete their events (crud_own_events).
	•	Manage locations within their region (manage_locations).
	•	Create advertisements for BasicUsers (create_ads).
	•	Make payments within their region (make_payments).

4. RegionalAdmin

	•	Description: Administrators who oversee RegionalOrganizers. They can manage all events and locations within their region, including appointing new RegionalOrganizers.
	•	Permissions:
	•	Create and manage RegionalOrganizers (create_regional_organizers).
	•	Manage all locations within the region (manage_regional_locations).
	•	Full CRUD operations on all events in their region (crud_all_regional_events).

5. SystemAdmin

	•	Description: High-level administrators with system-wide control. They manage all regions, locations, and events across the system.
	•	Permissions:
	•	Add and manage regions (add_regions).
	•	Merge locations and manage all event pointers (merge_locations).
	•	Full CRUD operations on all events system-wide (crud_all_events).

6. SystemOwner

	•	Description: The highest authority in the system, with full access to all system functionalities, including all the permissions of a SystemAdmin.
	•	Permissions:
	•	Full access to all features and functionalities (full_access).
