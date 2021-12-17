### Changes 3.1.2 (in development)


### Changes 3.1.1

* Added hint in DATA SOURCES panel addressing the case
  where loading seems to take forever.

* Now displaying a warning dialog when there is not much 
  time left until the Cate backend service will automatically 
  shut down due to service inactivity. (#164)

* If connection is closed, there are now two different message boxes.
  depending on whether the server was automatically shutdown or
  the connection closed unexpectedly. 

* Outputting more information to investigate into 
  unintentionally closed WebSocket connections:
  - Allow toasts to stay longer for such errors (2 minutes).
  - Provide more details on the console. 

* No longer attempt to load in scratch workspaces at startup
  (avoid error message).
  

### Changes 3.1.0

* Adapted to Cate Web API 3.1.x which changed in an 
  incompatible way. Dataset descriptors now have a `data_type` 
  field instead of a `type_specifier` field in 3.0.x.
* Revert workaround from previous release that prevented user logins 
  once a certain server-side degree of capacity utilisation was 
  reached. (#156)  

### Changes 3.0.1

* Implemented a workaround for an issue that prevented user logins 
  once a certain server-side degree of capacity utilisation was 
  reached. (#156)

### Changes 3.0.0

* Cate App 3.0 now requires the Web API service of the `cate 3.0+` 
  Python package.

* In order to keep alive the connection to the Web API service,
  Cate App now sends a keepalive signal every 2.5 seconds. (#150)
  
* For faster opening of datasets, the value of the currently selected
  data store `data_store_id` is now passed to the `open_dataset` 
  operation.

* Fixed a bug with user preferences not being saved correctly. (#146)

* Optimisations in the DATA SOURCES panel (that have been enabled by 
  using [xcube](https://xcube.readthedocs.io/) in the backend):
  - Initialising the "CCI Open Data Portal" data store
    is now accelerated by a magnitude.
  - Local caching of remote data sources when opening datasets 
    is now much faster and more reliable.
  - Added new experimental store "CCI Zarr Store" that offers
    selected CCI datasets that have been converted to Zarr format 
    and are read from JASMIN object storage.
  - Ability to add more data stores has been greatly improved.
  - Enhanced the "Open Dataset" dialog by messages that tell
    why a certain constraint is not (yet) available.
  - Fixed icons and labels for some new CCI ECVs.
  - Cate now utilizes dataset capabilities such as the ability
    to create spatial or temporal subsets in the "Open Data Source"
    dialog. In case a dataset has no such capabilities, we compute
    them from the dataset's metadata, if possible.

* We now obtain Cate Hub's status information from a dedicated GitHub 
  repository [cate-status](https://github.com/CCI-Tools/cate-status).
  
* Adapted to changed cate-hub API. (An API response no longer has 
  `status` and `result` properties, instead a response _is_ the result,
  and the response status is represented by the HTTP response code.)

* Improved rendering of text in many places by making it user-selectable 
  and interpreting it as markdown:
    - Data source abstract in the DATA SOURCES details panel:
    - Operation description in OPERATIONS panel.

* Other:    
  * Simplified `Dockerfile` which now uses a 2-stage build.
  * No longer require `.env.production` and `.env.local` files
    because all settings now have reasonable defaults. 
  * Removed phrase "please check .cate/webapi.log" from some
    error messages, because users have no longer access to 
    log files.
  * Renamed "About" tab in Preferences Dialog into "System". 
    There we now also display the versions of Cate's core Python 
    package dependencies.

### Changes 2.2.3

* Fixed a problem that prevented using Matomo Analytics service.

### Changes 2.2.2

* Fixed various issues regarding user preferences:
  - Fixed a problem that prevented storing the last workspace path in 
    user preferences.
  - Fixed problem in preferences dialog that prevented applying the new 
    settings.
  - Removed some preferences settings that no longer apply
    in the Cate App web application.
* Added version tags for UI and API to main toolbox page and service
  selection page.
* The `read_zarr` operation is now using type "password" for its `key`,
  `secret`, and `token` parameters.
* The DATA SOURCES panel has been updated:
    - Fixed deferred effect of checkbox "Show identifiers".
    - Added checkbox "All data sources" that will display all ODP datasets.
    - Added warn icon to those datasets that cannot be opened from store.
      Such data sources disable the "Open" button and display a popup
      instead. The popup informs the user how to manually download and open
      the datasets.
    - The data Open Dialog no longer displays
        + the region constraint, if a dataset has no spatial coordinates;
        + the cached option, if a dataset cannot be cached.
    - Displaying a data source's data type, if given, in its list item.
    - Fixed crash on double-clicking a list item with no selection.
* Using term "sandboxed file system" instead of "user root" in about box.
* In help menu, 
  - we now provide a link to the Helpdesk of the 
    ESA Climate Office instead of the issue tracker.
  - new link to GitHub
* The endpoint URL of the Cate cloud service (CateHub) is now determined
  by the web page origin. It may be overridden by `REACT_APP_CATEHUB_ENDPOINT`
  in the `.env` file. 
* Fixed a bug where local file data sources could not be added, when the
  list was initially empty. (#132)
* Using clearer terminology in the data sources panel.
* Made app compliant to EU GDPR. (#131)
  * Added new Cookie banner 
  * Now using Matomo Analytics

### Changes 2.2.1

* Allow disabling Cate cloud service usage and display a maintenance 
  message instead. Can be activated by a new setting in `.env` (#128):
  ```
    REACT_APP_CATEHUB_MAINTENANCE=Sorry, the Cate cloud service is temporarily unavailable ... 
  ```
* Configured web server to no longer cache the app's `index.html` in browsers.
* The DATA SOURCES panel now indicates by a progress spinner that data sources are being fetched. (#126)
* Fixed a bug, where no data sources were shown right after start (#56)

### Changes 2.2.0

* Using Keycloak authentication and user management service 
  running in the project's JASMIN cloud tenant. (#121)
* Using a new Cate WebAPI cloud service provider
  running in the project's JASMIN cloud tenant. 
* Using web page routing to for CateApps main pages:
  - `${origin}/`  - the login screen
  - `${origin}/hub`  - main page that runs with Cate's cloud service provider 
  - `${origin}/sa?serviceUrl=${serviceUrl}` - to run the app with a stand-alone server at `${serviceUrl}`   
* Added simple resource throttling limiting the overall number of concurrent users.
* Added the app's terms & conditions to all main pages. (#109)
* Fixed tooltip flickering in VARIABLES panel (#97)

### Changes 2.1.2

* Fixed broken build process (due to a broken webpack loader). 
  No change in functionality.

### Changes 2.1.1

* Fixed app crash after changing polyline styles (#116) 
* Spatial points are now parsed from CSV files when using the `read_csv()` operation.
  This is an option which can be disabled. (#115)
* Fixed display of vector data from GeoJSON, Shapefiles, etc. (#113)
* Limited maximum z-levels of new base map layers, so error messages no longer
  appear in JS console. 
* Changed terminology used on the front page to be more consistent with the website.

### Changes from Cate Desktop 2.0 to Cate App 2.1

* Changed some confusing terminology used in the UI,
  e.g. "download" into "open", "local" into "cached" (#110) 
* Added feature to browse the remote file system (#84) 
  Cate now shares base maps with CCI Climate-From-Space App (#87)
* Added feature to change the base maps in the world view. 
  Cate now shares base maps with CCI Climate-From-Space App.
   Default map is now "Atmosphere". (#87, #101)
* Turned Cate Web UI into a Desktop Progressive Web Application (PWA) "Cate App".
  Users can now install Cate from browsers to their desktops. (#22, #62)
* The UI uses now web versions of native (electron) file and directory choosers. (#64)   
* The UI uses now web versions of native (electron) message boxes. (#47)
* User preferences are now stored and reloaded from Web API. (#5, #52, #63)
* By default, Cate App displays a page where users select the Web API provision mode.
  This page can now be skipped by setting respective environment variables in the 
  `.env` file.
* Various UI styling issues have been fixed (#12)
  - Flickering tooltips
  - Undersized icons in job failure dialogs
  - Vertical misalignment of widgets in operation step dialogs
  - Selectable Colormaps Popup not being scrollable
  - Alignment of Display Value Range within the styles setting
  - Wrapping of dataset labels so they stay in dialog boxes
  - Data Access Error text message alignment, so they stay in dialog boxes
  - Data Access Error text message alignment, so they stay in dialog boxes
  - Wrapping of "About" contents, so it stays in preferences dialog
  - Fix misalignment of checkboxes with labels in Layers panel
  - Increase width of data store selector in Data Sources panel
  - Align "Add tag" button with tags in Operations panel
  - Fix horizontal positioning in "Add file data source" dialog
  - Align icon and label in "Active view" control of View panel
  - Fix excessive cell heights in Layers panel items
  - Improve vertical positioning of checkboxes in Places list
  - Improve horizontal alignment of text field in "New workspace" dialog
  - Improve layout of operation step dialogs
* Drawing and selecting points and polygons now works again (#11, #10)
* Added Help menu.
* Is now using the Cate Web API to handle user preferences
* Replaced CCI icons by simple round icons using GCOS ECV groupings as background color (#39)
* Adapted UI fonds to conform to ESA style guidelines (#39)
* Fixed copy-to-clipboard actions. (#41)
