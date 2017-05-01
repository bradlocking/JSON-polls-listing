# Polls Listing and Archive

Displays a list of interactive poll questions which can be answered and percentage of voters for each answer is displayed. Features an archive of expired poll questions that display in a dialog when clicked and includes back and forth navigation.

Poll submissions are sent to Firebase using device fingerprinting to record a unique reference for each visitor. It's also used to prevent multiple poll submissions if the localstorage has been removed from the visitors browser. 

## Setup 

* cd to root
* `gulp run` will fire up a webserver and watch the sass directory for changes. 
* `gulp watch` can be used on it's own to compile the SASS without a webserver.

### Note

Initially written under the knowledge that it would be hooked into Umbraco CMS. Firebase functionality implemented to _similate_ the database storing process of poll submissions, so currently has open read/write access for example purposes. 
