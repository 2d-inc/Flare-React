# Flare React

A React component to display and animate your [Flare](https://www.2dimensions.com/about-flare) files. Based off of [Flare-JS](https://github.com/2d-inc/Flare-JS)

## Installation

```sh
npm install flare-react
```

## Usage

Import FlareComponent from the installed package.

```js
import FlareComponent from 'flare-react';
```

Add the FlareComponent and reference the file and animation to play.
```js
<FlareComponent width={200} height={200} animationName="walk" file="penguin.flr"/>
```

## Support

Please [open an issue](https://github.com/2d-inc/flare-react/issues/new) for support.

## Contributing

### Github Flow
Please contribute using [Github Flow](https://guides.github.com/introduction/flow/). Create a branch, add commits, and [open a pull request](https://github.com/2d-inc/flare-react/compare/).

### Code Formatting
The codebase is formatted with [js-beautify](https://github.com/beautify-web/js-beautify). Please run any modifications through the formatter with the supplied [.jsbeautifyrc](.jsbeautifyrc) file.