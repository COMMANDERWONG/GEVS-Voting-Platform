# Steps for setting up the system:
1. cd into both /server and /client
2. run npm install in both /server and /client
3. cd into /client and run "npm start"
4. cd into /server and run "npm run init" to initialize database and start server. Use command "npm start" to start server without re-initializing the database.

# IMPORTANT:
* Do not edit the init.js file for that is the database creation file. 
* There's no database.sql file as all data is saved online on firebase realtime database.
* This system is created under these assumptions: 
* There are only 5 constituencies.
* There are 4 candidates in each constituency, 1 for each party.
* There are only 4 parties: Red, Blue, Yellow, Independent.
* Modifying the above while testing may lead to unexpected behaviors.
* This system uses a locally signed SSL certificate file cert.crt and private key private.key. Since there's no authenticated authority for these certs, browsers may prompt the localhost as unsafe. Proceed to the localhost when such error pops up. 
* This system uses localhost:3000 as the main URL, please test all requests using this URL. e.g. : GET "https://localhost:3000/gevs/results"
* All candidates information are automatically created when initializing the database. the vote count and results can also be reset when the database is re-initialized. 
* When the election is ended by the officer. It can't be started again until the database is refreshed. The winner will be declared automatically when the election stops. 
* This system uses cookies and camera. Please enable these permissions for the browser when testing.
* All candidates are randomly generated historical/mythical figures. Please treat them as fictional characters.