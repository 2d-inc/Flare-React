import React from 'react';
import './App.css';

import FlareComponent from 'flare-react';
import cactus from './Cactus_No_Joy.flr';
import flutter from './Flutter_Celebration.flr';
import ActorNodeSolo from '../node_modules/flare-react/dependencies/Flare-JS/source/ActorNodeSolo';
import ActorBone from 'flare-react/dependencies/Flare-JS/source/ActorBone.js';
import CustomProperty from 'flare-react/dependencies/Flare-JS/source/CustomProperty.js';
import soundfile from './huh_sound_cartoon.wav'; 
import HappySoundFile from './happy_sound_cartoon.wav'; 

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
    this.happySound = new Audio(HappySoundFile);
  }

  initialize(artboard)
  {
    if(artboard.name === "Scene"){
      this._Artboard = artboard;
      
    }
    
    this._MyNode = this._Artboard.getNode("Scale Node_Special Property");

    this._MyBone = this._Artboard.getNode("Bone");  

    this._ActorAnimator = this._Artboard.getAnimation("Mustache_New");
    this._ProgressTracker = this._Artboard.getAnimation("Mustache_New");
  }

  advance(artboard, elapsed)
  {
    this._AnimTime += elapsed *1;

    //let _animationEvents = [];

    
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
     
    }
    
   // let _currLayerAnim = this._SmileTime;

    this._SmileTime += elapsed * 1;
    if (this._SmileTime > this._ActorAnimator.duration)
    {
      this._CanPlay = false;
    }

    /*for (let props in this._MyNode._CustomProperties)
    {      
      switch (this._MyNode._CustomProperties[props]._Name)
      {
         
        case "happy_sound":
          ///play our sound when the custom property changes
          if (this._MyNode._CustomProperties[props]._Value === true){
            this.happySound.play();
          }
          break;
          default:
            break;
      
      }
     
    }*/
 
   
    /*this._ProgressTracker.triggerEvents(artboard._Components, _currLayerAnim, this._SmileTime, _animationEvents);
    
    for (let event in _animationEvents)
    {
      switch (_animationEvents[event].name)
      {
        case "Event":
          ///play our sound when the event happens
          this.sound.play(); 
          break;
          default:
            break;
      }
    }*/
    
    return true;
  }

  changeSoloNode = () =>
  {    
    this._SoloIdx ++;
    if (this._SoloIdx > 5){
      this._SoloIdx = 1;
    }
    console.log(this._SoloIdx);
  } 
}

export default class MyComponent extends React.Component
{
  constructor(props)
  {
    super(props);

    this.state = {
      myfile: cactus,
      myFlareController: new MyFlareController()
    }; 
    this.Update_Stache = this.Update_Stache.bind(this);
  }

  render()
  {    
    return (
      <div>
        <FlareComponent width={500} height={500} animationName="Idle" file={this.state.myfile} controller={this.state.myFlareController} />
        
        <button onClick={this.onChange.bind(this)}>Click Me!</button>
        </div>
    );
  }  
//<button onClick={this.Update_Stache}>Click Me!</button>
  onChange(e) {
    this.setState({[e.target.id]: e.target.value},
      () => {
        if (this.state.myfile === flutter) {
          this.setState({ myfile: cactus });
        } else {
          this.setState({ myfile: flutter });
        }
      }
    );
    console.log(this.state.myfile);
 }
  Update_Stache = () =>
  {
    
    //this.state.myFlareController.changeSoloNode();
    this.setState({ 
      
     myfile: flutter,
     });
    
     console.log("pressed");
  }
   
}
