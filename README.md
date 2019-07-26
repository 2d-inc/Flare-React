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

## Controllers

If you want to dynamically mix animations or move nodes (like an IK target) in response to events, inputs, etc, you'll need to use a controller. A controller gets initialized when the artboard becomes available. This is the appropriate moment to query for any animations, nodes, etc you expect to modify at runtime. The example controller below is for the Flare file here: https://www.2dimensions.com/a/JuanCarlos/files/flare/penguin/preview

```js
class PenguinController extends FlareComponent.Controller
{
	constructor()
	{
		super();
		this._MusicWalk = null;
		this._Walk = null;
		this._WalkTime = 0;
	}

	initialize(artboard)
	{
		this._MusicWalk = artboard.getAnimation("music_walk");
		this._Walk = artboard.getAnimation("walk");
	}

	advance(artboard, elapsed)
	{
        // advance the walk time
		this._WalkTime += elapsed;
		const { _MusicWalk: musicWalk, _Walk: walk, _WalkTime: walkTime } = this;

        // mix the two animations together by applying one and then the other (note that order matters).
        walk.apply(walkTime % walk.duration, artboard, 1.0);
        // if you want to slowly disable the head bobbing (musicWalk animation) you could ramp down the 
        // final argument (the mix argument) to 0.0 over some time. For now we're mixing at full strength.
		musicWalk.apply(walkTime % musicWalk.duration, artboard, 1.0);

		// keep rendering
		return true;
	}
}
```

You can now instance your PenguinController and tell your FlareComponent to use it:
```js
class MyComponent extends React.Component
{
	constructor()
	{
		this.state = { penguinController: new PenguinController() };
	}

	render()
	{
		return <FlareComponent controller={this.state.penguinController} /*... more properties here ...*/ />;
	}
}
```
## Support

Please [open an issue](https://github.com/2d-inc/flare-react/issues/new) for support.

## Contributing

### Github Flow
Please contribute using [Github Flow](https://guides.github.com/introduction/flow/). Create a branch, add commits, and [open a pull request](https://github.com/2d-inc/flare-react/compare/).

### Code Formatting
The codebase is formatted with [js-beautify](https://github.com/beautify-web/js-beautify). Please run any modifications through the formatter with the supplied [.jsbeautifyrc](.jsbeautifyrc) file.