import React from 'react';
import cactus from './Cactus_No_Joy.flr';
import './App.css';
import FlareComponent from 'flare-react';
import ActorNodeSolo from 'flare-react/dependencies/Flare-JS/source/ActorNodeSolo.js';
import ActorBone from 'flare-react/dependencies/Flare-JS/source/ActorBone.js';
import CustomProperty from 'flare-react/dependencies/Flare-JS/source/CustomProperty.js';
import soundfile from './huh_sound_cartoon.wav'; 


 
class MyFlareController extends FlareComponent.Controller
{
  constructor()
  {
    super();
    this._IdleAnim = null; 
    this._SoloIdx = 1;
    this._CurrSoloIdx = 1;
    this._ActorAnimator = null; 
    this._ProgressTracker = null;
    this._SoloNode = new ActorNodeSolo();  
    this._MyBone = new ActorBone();
    this._MyCP = new CustomProperty();
    this._MyNode = null; 

    this._CanPlay = false;
    this._SmileTime = 0;
    this._AnimTime = 0;

    this.sound = new Audio(soundfile); 
  }

  initialize(artboard)
  {
    if(artboard.name === "Scene"){
      this._Artboard = artboard;
      
    }
    
    this._MyNode = this._Artboard.getNode("Scale Node_Special Property");
    for (var props in this._MyNode._CustomProperties)
    {
      console.log(props.propertyType);
    }


    this._MyBone = artboard.getNode("Bone");  

    this._ActorAnimator = this._Artboard.getAnimation("Mustache_New");
    this._ProgressTracker = this._Artboard.getAnimation("Mustache_New");
  }

  advance(artboard, elapsed)
  {
    this._AnimTime += elapsed *1;

    var _animationEvents = [];

    
    if (this._CanPlay === true)
    {
       
      this._ActorAnimator.apply(this._AnimTime % this._ActorAnimator.duration, artboard, 1);
    }
    if (this._SoloIdx !== this._CurrSoloIdx)
    {
      this._SoloNode = artboard.getNode("Mustache_Solo");
      this._SoloNode.setActiveChildIndex(this._SoloIdx);

      this._CanPlay = true;
      this._SmileTime = 0;
      this._CurrSoloIdx = this._SoloIdx;

      this.sound.play();

      
     
    }
    
    var _currLayerAnim = this._SmileTime;

    this._SmileTime += elapsed * 1;
    if (this._SmileTime > this._ActorAnimator.duration)
    {
      this._CanPlay = false;
    }

    //console.log(artboard.components); 
    //this._ProgressTracker.triggerEvents(artboard.components, _currLayerAnim, this._SmileTime, _animationEvents);
    
    for (var event in _animationEvents)
    {
      switch (event.name)
      {
        case "Event":
          ///play our sound when the event happens
          this.sound.play();
          break;
        default:
          return;
      }
    }
    
    return true;
  }
 
  changeSoloNode = (Value) =>
  {    
    this._SoloIdx ++;
    if (this._SoloIdx > 5){
      this._SoloIdx = 1;
    }
  } 
}

export default class MyComponent extends React.Component
{
  constructor(props)
  {
    super(props);

    this.state = {
      
      myFlareController: new MyFlareController()
    }; 
    this.Update_Stache = this.Update_Stache.bind(this);
    //this.sound = new Audio(soundfile); 
  }

  render()
  {
     
    return (
      <div>
        <FlareComponent width={400} height={400} animationName="Idle" file={cactus} controller={this.state.myFlareController} />
        <button onClick={this.Update_Stache}>Click Me!</button>
        </div>
    );
  }  

  Update_Stache = () =>
  {
   // this.sound.play();

    this.state.myFlareController.changeSoloNode(2);

  }

 
} 
