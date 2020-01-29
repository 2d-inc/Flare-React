import React, { createRef } from "react";
import { ActorLoader, Graphics, Dispatcher } from "flare";
import { vec2, mat2d } from "gl-matrix";

class Controller extends Dispatcher
{
	startRendering()
	{
		this.dispatch("startRendering");
	}

	initialize(artboard) {}
	setViewTransform(transform) {}
	advance(artboard, elapsed) { return false; }
}

export default class FlareComponent extends React.Component
{
	constructor(props)
	{
		super(props);
		this.state = { isLoading: false, hasActor: false };

		this._RuntimeGraphics = null;
		this._ActorArtboard = null;
		this._RuntimeActor = null;
		this._IsRendering = false;
		this._LastAdvanceTime = Date.now();
		this._RuntimeAnimationIndex = -1;
		this._AnimationTime = 0;
		this._LastPosition = -1;
		this._AdvanceSpeed = 0.0;
		this._TargetAdvanceSpeed = 0.0;
		this._ViewTransform = mat2d.create();
		this._LastViewTransform = mat2d.create();

		this.startRenderLoop = this.startRenderLoop.bind(this);

		this.canvasRef = createRef();
	}

	static get Controller()
	{
		return Controller;
	}

	get _Canvas()
	{
		return this.canvasRef.current;
	}

	//just testing out the load on a new file
	componentDidUpdate(prevProps) {
		if (this.props.file !== prevProps.file) {
			console.log(this.props.file);
			this.load(this.props.file);
		}
	  }
	/*
	** tried this to get the props to update, it was a no go too
	static getDerivedStateFromProps(nextProps, prevState){
		if(nextProps.file!==prevState.file){
		   return {file : nextProps.file};
		}
		else return null;
	  }
	componentDidUpdate(prevProps, prevState) {
		if (prevState.file !== this.state.file) {
			console.log(this.state.file);
		  this.load(this.state.file);
		}
	  }
	  */
	/*
	** updating to this.props.file didn't update
	componentDidUpdate(prevProps, prevState) {
		
		if (prevProps.isPaused !== this.props.isPaused)
		{
			if (
				!prevProps.isPaused &&
				this._RuntimeAnimation &&
				this._AnimationTime === this._RuntimeAnimation._Duration
			)
			{
				this._AnimationTime = 0.0;
			}
			this.startRenderLoop();
		}

		if (prevProps.file !== this.props.file)
		{
			console.log(this.props.file);
			this.load(this.props.file);
		}
		else if (prevProps.artboardName != this.props.artboardName)
		{
			this.initArtboard(this.props.artboardName);
		}
		if (prevProps.controller !== this.props.controller)
		{
			this.props.controller && this.props.controller.removeEventListener("startRendering", this.startRenderLoop);
			if (this.props.controller)
			{
				this.props.controller.addEventListener("startRendering", this.startRenderLoop);
				if (this._ActorArtboard)
				{
					this.props.controller.initialize(this._ActorArtboard);
				}
			}
		}
	  }*/

	/*UNSAFE_componentWillReceiveProps(nextProps)
	{
		if (nextProps.isPaused !== this.props.isPaused)
		{
			if (!nextProps.isPaused &&
				this._RuntimeAnimation &&
				this._AnimationTime === this._RuntimeAnimation._Duration)
			{
				this._AnimationTime = 0.0;
			}
			this.startRenderLoop();
		}

		if (nextProps.file !== this.props.file)
		{
			console.log(nextProps.file);
			this.load(nextProps.file);
		}
		else if (nextProps.artboardName != this.props.artboardName)
		{
			this.initArtboard(nextProps.artboardName);
		}
		if (nextProps.controller !== this.props.controller)
		{
			this.props.controller && this.props.controller.removeEventListener("startRendering", this.startRenderLoop);
			if (nextProps.controller)
			{
				nextProps.controller.addEventListener("startRendering", this.startRenderLoop);
				if (this._ActorArtboard)
				{
					nextProps.controller.initialize(this._ActorArtboard);
				}
			}
		}
	}*/

	componentDidMount()
	{
		if (!this._Canvas)
		{
			this.props.onError && this.props.onError(Error("Missing Canvas"));
			return;
		}
		this.props.controller && this.props.controller.removeEventListener("startRendering", this.startRenderLoop);
		this.props.controller && this.props.controller.addEventListener("startRendering", this.startRenderLoop);

		this.initRuntimeGraphics();
	}

	initRuntimeGraphics()
	{
		try
		{
			this._RuntimeGraphics = new Graphics(this._Canvas);
		}
		catch (err)
		{
			this.props.onError && this.props.onError(err);
			return;
		}

		this._RuntimeGraphics.initialize(() =>
		{
			this.onGraphicsReady();
		});
	}

	getCanvasSize()
	{
		const { props } = this;
		const { width, height } = props;
		const dpr = this.devicePixelRatio;

		return vec2.set(vec2.create(), width * dpr, height * dpr);
	}

	get devicePixelRatio()
	{
		return window.devicePixelRatio || 1.0;
	}

	load(file)
	{
		if (!file)
		{
			const graphics = this._RuntimeGraphics;
			if (this._ActorArtboard)
			{
				this._ActorArtboard.dispose(graphics);
				this._ActorArtboard = null;
			}

			if (this._RuntimeActor)
			{
				this._RuntimeActor.dispose(graphics);
				this._RuntimeActor = null;
			}

			if (graphics)
			{
				this.setState({ hasActor: false });
				graphics.clear([0, 0, 0, 0]);
				graphics.flush();
			}

			return;
		}

		const graphics = this._RuntimeGraphics;
		if (!graphics)
		{
			return;
		}

		new ActorLoader().load(file, actor =>
		{
			if (!actor)
			{
				this.props.onError && this.props.onError();
				return;
			}

			this.props.onLoad && this.props.onLoad();

			if (graphics !== this._RuntimeGraphics)
			{
				// Someone else is loading with this component now.
				return;
			}

			if (this._ActorArtboard)
			{
				this._ActorArtboard.dispose(this._RuntimeGraphics);
				this._ActorArtboard = null;
			}

			if (this._RuntimeActor)
			{
				this._RuntimeActor.dispose(this._RuntimeGraphics);
				this._RuntimeActor = null;
			}

			this._RuntimeActor = actor;
			actor.initialize(graphics);

			this.initArtboard(this.props.artboardName);
		});
	}

	onGraphicsReady()
	{
		const { props } = this;
		const { file } = props;
		this.setState({ isLoading: true });

		if (file)
		{
			this.load(file);
		}
	}

	initArtboard(artboardName)
	{
		const actor = this._RuntimeActor;
		const graphics = this._RuntimeGraphics;

		this._ActorArtboard = this._getActorArtboard(actor, artboardName);

		if (this._ActorArtboard)
		{
			const { controller } = this.props;
			if (controller)
			{
				controller.initialize(this._ActorArtboard);
			}
			this._ActorArtboard.initialize(graphics);

			let viewCenter = actor._ViewCenter;
			let viewWidth = actor._ViewWidth;
			let viewHeight = actor._ViewHeight;
			if (!viewCenter)
			{
				this._ActorArtboard.advance(0);

				const aabb = this._ActorArtboard.artboardAABB ?
					this._ActorArtboard.artboardAABB() :
					this._ActorArtboard.computeAABB();
				viewCenter = [(aabb[0] + aabb[2]) / 2, (aabb[1] + aabb[3]) / 2];
				viewWidth = aabb[2] - aabb[0];
				viewHeight = aabb[3] - aabb[1];
			}
			this._ViewCenter = viewCenter;
			this._ViewWidth = viewWidth;
			this._ViewHeight = viewHeight;
			this._RuntimeAnimationIndex = -1;
			this._RuntimeAnimation = null;
			this.props.onLoadedAnimations &&
				this.props.onLoadedAnimations(this._ActorArtboard._Animations);

			let size = this.getCanvasSize();

			graphics.setSize(size[0], size[1]);
			this.setState(
			{
				isLoading: false,
				hasActor: true,
			});
			this.startRenderLoop();
		}
	}

	updateSize()
	{
		let size = this.getCanvasSize();
		if (this._RuntimeGraphics)
		{
			this._RuntimeGraphics.setSize(size[0], size[1]);
		}
		this.startRenderLoop();
	}

	startRenderLoop()
	{
		if (this._IsRendering)
		{
			return;
		}

		if (!this._RuntimeGraphics)
		{
			this.initRuntimeGraphics();
			return;
		}

		this._LastAdvanceTime = Date.now();
		window.requestAnimationFrame(() => this.advance());
		this._IsRendering = true;
	}

	advance()
	{
		let
		{
			_RuntimeGraphics: graphics,
			_RuntimeActor: actor,
			_ActorArtboard: actorArtboard,
			_ViewTransform: vt,
			_LastViewTransform: lvt
		} = this;

		if (!graphics || !actorArtboard)
		{
			this._IsRendering = false;
			return;
		}

		let now = Date.now();
		let elapsed = (now - this._LastAdvanceTime) / 1000.0;
		this._LastAdvanceTime = now;

		this._TargetAdvanceSpeed = this.props.isPaused ? 0.0 : 1.0;
		if (this.props.smoothPause)
		{
			let diff = (this._TargetAdvanceSpeed - this._AdvanceSpeed) * Math.min(1.0, elapsed * 3.0);
			if (Math.abs(diff) < 0.001)
			{
				this._AdvanceSpeed = this._TargetAdvanceSpeed;
			}
			else
			{
				this._AdvanceSpeed += diff;
			}
		}
		else
		{
			this._AdvanceSpeed = this._TargetAdvanceSpeed;
		}

		let { _AdvanceSpeed: advanceSpeed } = this;

		let viewCenter = this._ViewCenter;
		let viewWidth = this._ViewWidth;
		let viewHeight = this._ViewHeight;

		const dpr = this.devicePixelRatio;
		let w = graphics.viewportWidth - (this.props.sidePanelWidth * dpr || 0);
		let h = graphics.viewportHeight;

		const padding = this.props.padding || {};

		const padded_w = w - ((padding.left || 0) + (padding.right || 0)) * dpr;
		const padded_h = h - ((padding.top || 0) + (padding.bottom || 0)) * dpr;

		let scale = Math.min(padded_w / viewWidth, padded_h / viewHeight);
		if (this.props.maxScale && scale > this.props.maxScale)
			if (this.props.maxScale && scale > this.props.maxScale * dpr)
			{
				scale = this.props.maxScale * dpr;
			}

		vt[0] = scale;
		vt[3] = scale;
		vt[4] = -viewCenter[0] * scale + w / 2 + (padding.left || 0) * dpr;
		vt[5] = -viewCenter[1] * scale + h - padded_h / 2 - (padding.top || 0) * dpr;

		let bg = this.props.background ||
			(actorArtboard && actorArtboard.color8) || [0, 0, 0];

		graphics.clear([
			bg[0] / 255,
			bg[1] / 255,
			bg[2] / 255,
			this.props.transparent ? 0.0 : 1.0,
		]);

		graphics.setView(vt);
		if (actorArtboard)
		{
			let animations = actorArtboard.animations;

			const { animationName, controller } = this.props;

			if (!mat2d.equals(vt, lvt))
			{
				mat2d.copy(lvt, vt);
				if (controller)
				{
					controller.setViewTransform(vt);
				}
			}

			let desiredAnimationIndex =
				animationName !== undefined ?
				animations.findIndex(animation => animation._Name === animationName) :
				-1;

			if (
				desiredAnimationIndex < actorArtboard.animations.length &&
				desiredAnimationIndex !== this._RuntimeAnimationIndex
			)
			{
				if (actorArtboard)
				{
					actorArtboard.dispose(graphics);
				}

				actorArtboard = this._ActorArtboard = this._getActorArtboard(
					actor,
					this.props.artboardName,
				);
				actorArtboard.initialize(graphics);

				this._RuntimeAnimationIndex = desiredAnimationIndex;
				this._RuntimeAnimation =
					desiredAnimationIndex !== -1 ?
					actorArtboard.animations[desiredAnimationIndex] :
					null;
				this._AnimationTime =
					(this.props.initialPosition || 0) * this._RuntimeAnimation._Duration;
				this._RuntimeAnimation.apply(this._AnimationTime, actorArtboard, 1.0);
			}

			let runtimeAnimation = this._RuntimeAnimation;
			if (runtimeAnimation)
			{
				const { toPosition, animateToPosition } = this.props;

				if (Number.isFinite(toPosition))
				{
					let toTime = toPosition * runtimeAnimation._Duration;
					const diff = Math.abs(toTime - this._AnimationTime);
					if (diff < 0.01)
					{
						// if we're close enough, just jump to the right time
						this._AnimationTime = toTime;
					}

					if (animateToPosition)
					{
						if (toTime == this._AnimationTime)
						{
							// nothing to do, we want to stay where we are
							// but let's assign for clarity
							this._AnimationTime = toTime;
						}
						else
						{
							// increment or decremenet by elapsed
							this._AnimationTime +=
								advanceSpeed *
								elapsed *
								(toTime < this._AnimationTime ? -1 : 1);
						}
					}
					else
					{
						// we want to set a position without animating
						this._AnimationTime = toTime;
					}
				}
				else
				{
					// otherwise, auto-play
					if (advanceSpeed > 0)
					{
						this._AnimationTime += advanceSpeed * elapsed;
						if (runtimeAnimation.loop)
						{
							// and loop with modulo
							this._AnimationTime %= runtimeAnimation._Duration;
						}
						else if (this._AnimationTime > runtimeAnimation._Duration)
						{
							// or just pause at the end
							this._AnimationTime = runtimeAnimation._Duration;
							this.props.onPaused && this.props.onPaused();
						}
					}
				}

				// given the calculated animation time, calculate position and notify subscriber
				let calculatedPosition =
					this._AnimationTime / runtimeAnimation._Duration;
				if (calculatedPosition !== this._LastPosition)
				{
					// cache position
					this._LastPosition = calculatedPosition;
					// notify
					this.props.onPositionChanged &&
						this.props.onPositionChanged(calculatedPosition);
				}

				// then update animation with the correct time
				runtimeAnimation.apply(this._AnimationTime, actorArtboard, 1.0);
			}
			if (controller)
			{
				if (!controller.advance(actorArtboard, elapsed))
				{
					advanceSpeed = 0;
				}
			}
			actorArtboard.advance(elapsed);
			actorArtboard.draw(graphics);
		}
		graphics.flush();

		if (advanceSpeed > 0)
		{
			this._IsRendering = true;
			window.requestAnimationFrame(() => this.advance());
		}
		else
		{
			this._IsRendering = false;
		}
	}

	_getActorArtboard(actor, artboardName)
	{
		if (artboardName)
		{
			return actor.getArtboard(artboardName).makeInstance();
		}
		else
		{
			return actor.makeInstance();
		}
	}

	componentDidUpdate()
	{
		this.updateSize();
	}

	render()
	{
		const { width, height } = this.props;
		const { hasActor } = this.state;
		return (
			<canvas
				ref={this.canvasRef}
				className={this.props.className}
				style={{
					width: width + "px",
					height: height + "px",
					display: hasActor ? null : "none",
				}}
			/>
		);
	}
}
