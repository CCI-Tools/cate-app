### Changes in v2.0.0-dev.5

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

### Changes in v2.0.0-dev.4

* Is now using the Cate Web API to handle user preferences
* Replaced CCI icons by simple round icons using GCOS ECV groupings as background color
* Adapted UI fonds to conform to ESA style guidelines

### Changes in v2.0.0-dev.3

* Fixed copy-to-clipboard actions.

### Changes in v2.0.0-dev.2

* Demo version for ESA
