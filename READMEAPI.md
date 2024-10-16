1. Categories API (serverCategories.js)

   • Base Path: /api/categories
   • GET /: Fetch all categories.

2. Locations API (serverLocations.js)

   • Base Path: /api/locations
   • GET /: Fetch all locations.
   • GET /:id: Fetch a location by its ID.
   • POST /: Create a new location.
   • PUT /:id: Update a location by its ID.

3. User Login API (serverUserLogin.js)

   • Base Path: /api/users
   • GET /firebase/:firebaseUserId: Fetch a user by Firebase User ID.
   • GET /:id: Fetch a user by standard MongoDB \_id.
   • POST /: Create a new user.
   • PUT /firebase/:firebaseUserId: Update a user by Firebase User ID.
   • PUT /:id: Update a user by standard MongoDB \_id.

4. Organizers API (serverOrganizers.js)

   • Base Path: /api/organizers
   • GET /: Fetch all organizers.
   • GET /:id: Fetch an organizer by ID.
   • PUT /:id: Update an organizer by ID.
   • POST /: Create a new organizer (requires organizerRegion to be passed to the API).

5. Regions API (serverRegions.js)

   • Base Path: /api/regions
   • GET /: Fetch all regions.
   • GET /active: Fetch only the active regions.
   • GET /activeDivisions: Fetch only the active divisions within regions.
   • GET /activeCities: Fetch only the active cities within divisions.
   • PUT /:id/active: Update the active flag of a region by its \_id.
   • PUT /:regionId/division/:divisionId/active: Update the active flag of a division by its \_id within a specific region.
   • PUT /:regionId/division/:divisionId/city/:cityId/active:
