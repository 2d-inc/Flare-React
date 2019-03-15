import React from "react";
import {ActorLoader, Graphics} from "flare";
import {vec2, mat2d} from "gl-matrix";
import Logo from "./flare_logo.svg";

export class FlareComponent extends React.Component 
{
    constructor(props)
    {
        super(props);
		this.state = {hasError:false, isLoading:false, hasActor:false};

		this._RuntimeGraphics = null;
		this._ActorInstance = null;
		this._RuntimeActor = null;
		this._IsRendering = false;
		this._LastAdvanceTime = Date.now();
		this._RuntimeAnimationIndex = -1;
		this._AnimationTime = 0;
		this._OverrideAnimationPosition = null;
		this._LastReportedAnimationPosition = -1;
		this._AdvanceSpeed = 0.0;
		this._TargetAdvanceSpeed = 0.0;
        this._ViewTransform = mat2d.create();
        
        this.setCanvasRef = (ref) =>
        {
            this._Canvas = ref;
        };
    }

    componentWillReceiveProps(nextProps)
	{
		if(nextProps.isPaused !== this.props.isPaused)
		{
			if(!nextProps.isPaused && this._RuntimeAnimation && this._AnimationTime === this._RuntimeAnimation._Duration)
			{
				this._AnimationTime = 0.0;				
			}
			this.startRenderLoop();
        }
        
        if(nextProps.file !== this.props.file)
        {
            this.load(nextProps.file);
        }
	}

    componentDidMount()
    {
        const {_Canvas} = this;
        if(!_Canvas)
        {
            console.log("Missing canvas");
            return;
        }

		try
		{
            const runtimeGraphics = new Graphics(_Canvas);
            this._RuntimeGraphics = runtimeGraphics;
		}
		catch(err)
		{
			console.log("Error while init graphics", err);
			this.setState({hasError:true});
			return;
		}

        this._RuntimeGraphics.initialize(() =>
        {
            this.onGraphicsReady();
        });
    }

    getCanvasSize()
	{
        const {props} = this;
        const {width,height} = props;
        const dpr = this.devicePixelRatio;

        return vec2.set(vec2.create(), width*dpr, height*dpr);
    }

	get devicePixelRatio()
	{
		return window.devicePixelRatio || 1.0;
    }
    
    load(file)
    {
        if(!file)
        {
            const graphics = this._RuntimeGraphics;
            if(this._ActorInstance)
            {
                this._ActorInstance.dispose(graphics);
                this._ActorInstance = null;
            }
            if(this._RuntimeActor)
            {
                this._RuntimeActor.dispose(graphics);
                this._RuntimeActor = null;	
            }
            if(graphics)
            {
                this.setState({hasActor:false});
                graphics.clear([0, 0, 0, 0]);
                graphics.flush();
            }
            return;
        }
        const graphics = this._RuntimeGraphics;
        if(!graphics)
        {
            return;
        }
        const loader = new ActorLoader();
        loader.load(file, (actor) =>
		{
			if(!actor)
			{
				this.props.onError && this.props.onError();
				return;
			}

			if(graphics !== this._RuntimeGraphics)
			{
				// Someone else is loading with this component now.
				return;
			}

            if(this._ActorInstance)
            {
                this._ActorInstance.dispose(this._RuntimeGraphics);
                this._ActorInstance = null;
            }
            if(this._RuntimeActor)
            {
                this._RuntimeActor.dispose(this._RuntimeGraphics);
                this._RuntimeActor = null;	
            }

			this._RuntimeActor = actor;
			actor.initialize(graphics);
			this._ActorInstance = actor.makeInstance();
			if(this._ActorInstance)
			{
				this._ActorInstance.initialize(graphics);

				let viewCenter = actor._ViewCenter;
				let viewWidth = actor._ViewWidth;
				let viewHeight = actor._ViewHeight;
				if(!viewCenter)
				{
					this._ActorInstance.advance(0);
					
					const aabb = this._ActorInstance.artboardAABB ? this._ActorInstance.artboardAABB() : this._ActorInstance.computeAABB();
					viewCenter = [(aabb[0] + aabb[2])/2, (aabb[1] + aabb[3])/2];
					viewWidth = aabb[2] - aabb[0];
					viewHeight = aabb[3] - aabb[1];
				}
				this._ViewCenter = viewCenter;
				this._ViewWidth = viewWidth;
				this._ViewHeight = viewHeight;
				this._RuntimeAnimationIndex = -1;
				this._RuntimeAnimation = null;
				this.props.onLoadedAnimations && this.props.onLoadedAnimations(this._ActorInstance._Animations);

				let size = this.getCanvasSize();

				graphics.setSize(size[0], size[1]);	
				this.setState({isLoading:false, hasActor:true, hasError:false});
				this.isLoading = false;
				this.startRenderLoop();
			}
		});
    }

	onGraphicsReady()
	{
        const {props} = this;
        const {file} = props;
		this.isLoading = true;
		this.setState({isLoading:true});

		this.viewCenter = [0,0];
		this.viewWidth = 100;
        this.viewHeight = 100;
        
        if(file)
        {
            this.load(file);
        }
    }
    
    updateSize()
	{
		let size = this.getCanvasSize();
		if(this._RuntimeGraphics)
		{
			this._RuntimeGraphics.setSize(size[0], size[1]);	
		}
		this.startRenderLoop();
	}

	startRenderLoop()
	{
		if(this._IsRendering)
		{
			return;
		}

		if(!this._RuntimeGraphics)
		{
			this.initRuntime();
			return;
		}
		this._LastAdvanceTime = Date.now();
		window.requestAnimationFrame(() => this.advance());
		this._IsRendering = true;
    }

    advance()
	{
		let {_RuntimeGraphics:graphics, _RuntimeActor:actor, _ActorInstance:actorInstance, _ViewTransform:vt} = this;

		if(!graphics || !this._ActorInstance)
		{
			this._IsRendering = false;
			return;
		}

		let now = Date.now();
		let elapsed = (now - this._LastAdvanceTime)/1000.0;
		this._LastAdvanceTime = now;

		this._TargetAdvanceSpeed = this.props.isPaused ? 0.0 : 1.0;
		if(this.props.smoothPause)
		{
			let diff = (this._TargetAdvanceSpeed - this._AdvanceSpeed) * Math.min(1.0, elapsed*3.0);
			if(Math.abs(diff) < 0.001)
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

		const {_AdvanceSpeed:advanceSpeed} = this;

		let viewCenter = this._ViewCenter;
		let viewWidth = this._ViewWidth;
		let viewHeight = this._ViewHeight;
		
		const dpr = this.devicePixelRatio;
		let w = graphics.viewportWidth - (this.props.sidePanelWidth*dpr || 0);
		let h = graphics.viewportHeight;


		const padding = this.props.padding || {};
		
		const padded_w = w - ((padding.left || 0) + (padding.right || 0))*dpr;
		const padded_h = h - ((padding.top || 0) + (padding.bottom || 0))*dpr;


		let scale = Math.min(padded_w/viewWidth, padded_h/viewHeight);
		if(this.props.maxScale && scale > this.props.maxScale)
		if(this.props.maxScale && scale > this.props.maxScale*dpr)
		{
			scale = this.props.maxScale*dpr;
		}

		vt[0] = scale;
		vt[3] = scale;
		vt[4] = (-viewCenter[0] * scale + w/2 + (padding.left || 0)*dpr);
		vt[5] = (-viewCenter[1] * scale + h - padded_h/2 - (padding.top || 0)*dpr);

		let bg = this.props.background || (actorInstance && actorInstance.color8) || this._Metadata.background;

		graphics.clear([bg[0]/255, bg[1]/255, bg[2]/255, this.props.transparent ? 0.0 : 1.0]);
		graphics.setView(vt);
		if(actorInstance)
		{
            let animations = actor.animations;
            const {animationName} = this.props;
			let desiredAnimationIndex = animationName !== undefined ? animations.findIndex( animation => animation._Name === animationName ) : -1;
			if(desiredAnimationIndex < actorInstance.animations.length && desiredAnimationIndex !== this._RuntimeAnimationIndex)
			{
				if(actorInstance)
				{
					actorInstance.dispose(graphics);	
				}
				actorInstance = this._ActorInstance = actor.makeInstance();
				actorInstance.initialize(graphics);

				this._RuntimeAnimationIndex = desiredAnimationIndex;
				this._RuntimeAnimation = desiredAnimationIndex !== -1 ? actorInstance.animations[desiredAnimationIndex] : null;
				this._AnimationTime = 0;
			}

			let runtimeAnimation = this._RuntimeAnimation;
			if(runtimeAnimation)
			{
				let animationTime;
				if(this._OverrideAnimationPosition !== null)
				{
					animationTime = this._AnimationTime = this._OverrideAnimationPosition * runtimeAnimation._Duration;
				}
				else
				{
					if(advanceSpeed > 0)
					{
						this._AnimationTime += advanceSpeed * elapsed * (this.props.playbackSpeed || 1.0);
						if(runtimeAnimation.loop)
						{
							this._AnimationTime %= runtimeAnimation._Duration;
						}
						else if(this._AnimationTime > runtimeAnimation._Duration)
						{
							this._AnimationTime = runtimeAnimation._Duration;
							this.props.onPaused && this.props.onPaused();
						}
					}
					animationTime = this._AnimationTime;
				}
				let animationPosition = animationTime / runtimeAnimation._Duration;
				if(animationPosition !== this._LastReportedAnimationPosition)
				{
					this._LastReportedAnimationPosition = animationPosition;
					this.props.onPositionChanged && this.props.onPositionChanged(animationPosition);
				}
				runtimeAnimation.apply(animationTime, actorInstance, 1.0);
			}
			actorInstance.advance(elapsed);
			actorInstance.draw(graphics);
		}
		graphics.flush();

		if(advanceSpeed > 0)
		{
			this._IsRendering = true;
			window.requestAnimationFrame(() => this.advance());
		}
		else
		{
			this._IsRendering = false;
		}
	}
    
    componentDidUpdate()
    {
        this.updateSize();
    }

    render()
    {
        const {setCanvasRef, props, state} = this;
        const {width, height} = props;
        const {hasActor} = state;
        return <div style={{position:"absolute", width: width + "px", height: height + "px"}}>
            {hasActor ? null : <Logo width="100%" height="100%" style={{position:"absolute"}}/>}
            <canvas ref={setCanvasRef} style={{position:"absolute",width: width + "px", height: height + "px", display: hasActor ? null : "none"}}></canvas>
            </div>;
    }
}