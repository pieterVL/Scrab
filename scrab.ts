namespace scrab{
	module MainLoop{		
		let nextQueue:CmdList[]=[];	
		const fps:number=25,
			  fpsInterval:number=1000/fps;
		let	lastTime:number=0,
			now:number=0,
			elapsed:number;
		let previousScrabTime:number=0;			
		const requestAnimation:(callback: FrameRequestCallback) => number =
			window.requestAnimationFrame || 
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			function(f){return setTimeout(f, 1000/fps)};
		
		export function addToQueue(cmdList:CmdList):void{
			nextQueue.push(cmdList);
		}
		export function start():void{
			if(lastTime>0){
				previousScrabTime=now;
			}
			requestAnimation(loop);
		}		
		export function getTimer():number{
			return now-previousScrabTime;
		}
		function loop(timestamp:number) {
			elapsed = (now=timestamp) - lastTime;
			if (elapsed > fpsInterval) {
				lastTime = timestamp;
				executeQueue();
			}
			requestAnimation(loop);
		}
		function executeQueue():void{
			let queue = nextQueue;
			let a = nextQueue = [];
			for (let i = 0; i < queue.length; ++i) {
				queue[i].execute();
			}
		}
	}

	enum ScrabEvents{GreenFlag,KeyPressed,Clicked,SceneStarts,SensorGt,IReceive}
	abstract class ScrabObj{		
		protected greenFlag:CmdList[];
		protected keyPressed:ICmdListGroup;
		protected clicked:CmdList[];
		protected sceneStarts:ICmdListGroup;
		protected sensorGreaterThan:ICmdListGroup;
		protected iReceive:ICmdListGroup;
		constructor(){			
			this.greenFlag=[];
			this.keyPressed={};
			this.clicked=[];
			this.sceneStarts={};
			this.sensorGreaterThan={};
			this.iReceive={};
		};

		protected addCmdList(eventtype:ScrabEvents, cmdList: CmdList, key?:string, value?:number):CmdList{
			switch (eventtype) {
				case ScrabEvents.GreenFlag:		this.greenFlag.push(cmdList);		break;
				case ScrabEvents.KeyPressed:	this.keyPressed[key].push(cmdList);	break;
				case ScrabEvents.Clicked:		this.clicked.push(cmdList);			break;
				case ScrabEvents.SceneStarts:	this.sceneStarts[key].push(cmdList);break;
				case ScrabEvents.SensorGt: 		this.sensorGreaterThan[key].push(cmdList);
					cmdList.sensorvalue=value;
					break;
				case ScrabEvents.IReceive:		this.iReceive.push[key](cmdList);	break;		
				default:break;
			}
			return cmdList;
		}
	}
	class Stage extends ScrabObj{
		GreenFlag():			StageCmdList{return super.addCmdList(ScrabEvents.GreenFlag,new StageCmdList(this,true));};
		KeyPressed(key:string):	StageCmdList{return super.addCmdList(ScrabEvents.KeyPressed,new StageCmdList(this,true),key);};
		Clicked():				StageCmdList{return super.addCmdList(ScrabEvents.Clicked,new StageCmdList(this,true));};
		SceneStarts(key:string):StageCmdList{return super.addCmdList(ScrabEvents.SceneStarts,new StageCmdList(this,true),key);};
		IReceive(key:string):	StageCmdList{return super.addCmdList(ScrabEvents.IReceive,new StageCmdList(this,true),key);};
		SensorGreaterThan(key:string,value:number):StageCmdList
											{return super.addCmdList(ScrabEvents.SensorGt,new StageCmdList(this,true),key,value);};		
		constructor() {super();}

	}
	class Sprite extends ScrabObj{
		GreenFlag():			SpriteCmdList{return super.addCmdList(ScrabEvents.GreenFlag, new SpriteCmdList(this,true))as SpriteCmdList;}
		KeyPressed(key:string):	SpriteCmdList{return super.addCmdList(ScrabEvents.KeyPressed,new SpriteCmdList(this,true),key)as SpriteCmdList};
		Clicked():				SpriteCmdList{return super.addCmdList(ScrabEvents.Clicked,new SpriteCmdList(this,true))as SpriteCmdList};
		SceneStarts(key:string):SpriteCmdList{return super.addCmdList(ScrabEvents.SceneStarts,new SpriteCmdList(this,true),key)as SpriteCmdList};
		IReceive(key:string):	SpriteCmdList{return super.addCmdList(ScrabEvents.IReceive,new SpriteCmdList(this,true),key)as SpriteCmdList};
		SensorGreaterThan(key:string,value:number):SpriteCmdList
											 {return super.addCmdList(ScrabEvents.SensorGt,new SpriteCmdList(this,true),key,value)as SpriteCmdList};
		
		constructor() {super();}
	}
	type CmdFn = (...params)=>void;
	class Cmd{
		constructor(private fn:CmdFn){}
		execute():void{this.fn(this.fn.arguments)};
	}
	interface ICmdListGroup{[index: string]:CmdList[];}
	abstract class CmdList {
		private sensorvalue:number;//only for SensorGreaterThan Events
		private queue:Cmd[]=[];
		private inLoop:boolean=false;
		private hold:boolean=false;
		private index:number=0;
		constructor(protected scrabObjParent:ScrabObj, private root = false) {};
		abstract makeNewCmdList():this;
		protected addCmd(cmd:Cmd){this.queue.push(cmd)}
		execute(): void {
			if(!this.hold) {this.index = 0;}
			while(this.index < this.queue.length){
				const cmd = this.queue[this.index];
				cmd.execute();
				if(this.hold){
					if(this.root){
						MainLoop.addToQueue(this);				
					}
					break;
				}
				++this.index;
			}
		}
		//queue methods	
		repeat(cmdlistfn: (cmdList: this) => void):void
		//queue methods
		setVar(variable:String, value):this
		{
			return this;
		}
		{
			let parent = this;
			const cmdList:this = this.makeNewCmdList();
			cmdlistfn(cmdList);
			this.addCmd(
				new Cmd(
					function(){
						parent.hold = parent.inLoop = true;
						cmdList.execute()
					}
				)
			);
		}
		repeatTimes(times:number,cmdlistfn: (cmdList: this) => void):this
		{
			let parent = this;
			const cmdList:this = this.makeNewCmdList();
			cmdlistfn(cmdList);
			this.addCmd(
				new Cmd(
					(function(times:number){
						let repeatTimes:number;
						return function(){					
							if(parent.inLoop){
								if(--repeatTimes>0){
									cmdList.execute()									
								}else{
									parent.hold = parent.inLoop = false;
								}
							}
							else{
								parent.hold = parent.inLoop = true;
								repeatTimes = times;
								if(times>0)cmdList.execute()
							}
						};
					})(times)
				)
			);
			return this;
		}	
		ifThen(bool:boolean,
			   cmdlistfn: (cmdList: this) => void):this
		{
			const newCmdList:() => CmdList = this.makeNewCmdList;
			this.addCmd(
				new Cmd(
					(function(bool:boolean,cmdlistfn:(cmdList: CmdList) => void){
						return function(){
							if(bool){
								(function (cmdlistfn){
									let cmdList:CmdList = newCmdList();
									cmdlistfn(cmdList);
									return cmdList;
								})(cmdlistfn).execute();
							}
						};
					})(bool, cmdlistfn)
				)
			);
			return this;
		}
		ifThenElse(bool:boolean,
				   cmdlistTrue: (cmdList: this) => void,
				   cmdlistFalse:(cmdList: this) => void):this
		{
			const newCmdList:() => CmdList = this.makeNewCmdList;
			this.addCmd(
				new Cmd(
					(function(bool:boolean, cmdlistTruefn:(cmdList: CmdList) => void,
											cmdlistFalsefn:(cmdList: CmdList) => void){
						return function(){
							if(bool){
								(function (cmdlistfn){
									let cmdList:CmdList = newCmdList();
									cmdlistfn(cmdList);
									return cmdList;
								})(cmdlistTruefn).execute();
							}else{
								(function (cmdlistfn){
									let cmdList:CmdList = newCmdList();
									cmdlistfn(cmdList);
									return cmdList;
								})(cmdlistFalsefn).execute();
							}
						};
					})(bool, cmdlistTrue, cmdlistFalse)
				)
			);
			return this;			
		}
		wait(sec:number):this
		{
			let parent = this;
			this.addCmd(
				new Cmd(
					(function(sec:number){
						let timeTillHold:number;
						return function(){						
							if(parent.hold){
								if(timeTillHold<=MainLoop.getTimer()){
									parent.hold=false;
								}
							}
							else{
								parent.hold = true;
								timeTillHold = MainLoop.getTimer()+ sec*1000;
							}
						};
					})(sec)
				)
			);
			return this;
		}		
	}
	class SpriteCmdList extends CmdList{
		makeNewCmdList(root?:boolean): this {
			return <this>new SpriteCmdList(this.scrabObjParent as Sprite, root);
		}

		constructor(parent:Sprite, root?:boolean) {super(parent, root);}
		goto(x:number,y:number){
			this.addCmd(
				new Cmd(
					(function(x:number,y:number){
						return function(){console.log("Go to x:"+x+" Y: "+y);};
					})(x,y)
				)
			);
			return this;
		}		
	}
	class StageCmdList extends CmdList{
		makeNewCmdList(root?:boolean): this {
			return <this>new StageCmdList(this.scrabObjParent as Stage, root);
		}
		constructor(parent:Stage, root?) {super(parent, root);}
	}
	interface ISprites{[index: string]:Sprite;}
	export const start = MainLoop.start;
	export let sprites:ISprites={};
	export let stage:Stage= new Stage();
	export function addSprite(sprite: string):void{
		if(sprites.hasOwnProperty(sprite))
			console.log("The name: "+sprite+" is already in use, please choise an other name");
		else
			sprites[sprite]=new Sprite();
	}
}