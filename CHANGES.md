### Changes in Cate App 2.1.1 (in development)

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
