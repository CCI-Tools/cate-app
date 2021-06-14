[![Build status](https://ci.appveyor.com/api/projects/status/4g3vwk8oyotj1kqm?svg=true)](https://ci.appveyor.com/project/bcdev/cate-app)

# Cate App

A single page web application that provides a GUI for [Cate](https://github.com/CCI-Tools/cate).

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Development

In the project directory, you can run:

#### `yarn`

to initially install or update all project dependencies.

#### `yarn start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.
You will also see any lint errors in the console.

#### `yarn test`

Launches the test runner in the interactive watch mode.

See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) 
for more information.

#### `yarn build`

Builds the app for production to the `build` folder.
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified, and the filenames include the hashes.

Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) 
for more information.

## Release

To prepare a Cate App release, follow these steps:

- [ ] `package.json`: Make sure `version` field is higher than the last release
  and compatible with [SemVer](https://semver.org/).
- [ ] `Dockerfile`: Make sure `version` label is the same version.
- [ ] `src/serviceWorker.ts`: Make sure `CATE_PWA_VERSION` constant is the same version.
- [ ] `src/version.ts`: Make sure `CATE_APP_VERSION` constant is the same version.
- [ ] `appveyor.yml`: Make sure `version` label is the same version appended by `-{build}`.
- [ ] `CHANGES.md`: Make sure latest changes are up-to-date and refer to the same version.
