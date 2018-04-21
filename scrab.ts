namespace scrab{
	module MainLoop{
		let nextQueue:CmdList[] = [];
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
			function(f){return setTimeout(f, fpsInterval)};
		
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
			nextQueue = [];
			for (let i = 0; i < queue.length; ++i) {
				queue[i].execute();
			}
		}
	}
	interface Getter {get();}
	
	abstract class Condition implements Getter{
		get = this.isTrue;
		abstract isTrue():boolean;
	}

	export class Value implements Getter{
		constructor(protected value?:any) {};
		get() {
			return this.value;
		}	
	}
	class Variable extends Value{
		constructor(value?:any) {super(value)};
		set(value) {
			this.value = value;
		}
	}
	export class OperationPlus implements Getter {
		constructor(private operators:Getter[]) {};
		get() {
			let sum:number=0;
			let len = this.operators.length;
			while(len--){
				sum += <number>this.operators[len].get();
			}
			return sum;
		}
	}
	export class Equals extends Condition {
		constructor(private value1:Getter,private value2:Getter) {super()};
		isTrue(): boolean {
			return this.value1.get() == this.value2.get();
		}
	}
	export class LessThan extends Condition {
		constructor(private value1:Getter,private value2:Getter) {super()};
		isTrue(): boolean {
			return this.value1.get() < this.value2.get();
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
		constructor(costumeNumber:number=0){
			this.greenFlag=[];
			this.keyPressed={};
			this.clicked=[];
			this.sceneStarts={};
			this.sensorGreaterThan={};
			this.iReceive={};

			this.costumeNumber = new Variable();
			this.costumeNumber.set(costumeNumber);
		};

		public costumeNumber:Variable;
		
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
		GreenFlag():			StageCmdList{return super.addCmdList(ScrabEvents.GreenFlag,	new StageCmdList(true))}
		KeyPressed(key:string):	StageCmdList{return super.addCmdList(ScrabEvents.KeyPressed,new StageCmdList(true),key)}
		Clicked():				StageCmdList{return super.addCmdList(ScrabEvents.Clicked,	new StageCmdList(true))}
		SceneStarts(key:string):StageCmdList{return super.addCmdList(ScrabEvents.SceneStarts,new StageCmdList(true),key)}
		IReceive(key:string):	StageCmdList{return super.addCmdList(ScrabEvents.IReceive,	new StageCmdList(true),key)}
		SensorGreaterThan(key:string,value:number):StageCmdList
											{return super.addCmdList(ScrabEvents.SensorGt,	new StageCmdList(true),key,value)}

	}
	interface SpriteProperties{
		x? : number
		y? : number
		show? : boolean
		dragable? : boolean
		direction? : number
		rotationStyle? : number
		costumeNumber? : number
		vars? : [[string, any]]
	}
	class Sprite extends ScrabObj{
		GreenFlag():			SpriteCmdList{return super.addCmdList(ScrabEvents.GreenFlag,  	new SpriteCmdList(this,true))		as SpriteCmdList}
		KeyPressed(key:string):	SpriteCmdList{return super.addCmdList(ScrabEvents.KeyPressed, 	new SpriteCmdList(this,true),key)	as SpriteCmdList}
		Clicked():				SpriteCmdList{return super.addCmdList(ScrabEvents.Clicked,		new SpriteCmdList(this,true))		as SpriteCmdList}
		SceneStarts(key:string):SpriteCmdList{return super.addCmdList(ScrabEvents.SceneStarts,	new SpriteCmdList(this,true),key)	as SpriteCmdList}
		IReceive(key:string):	SpriteCmdList{return super.addCmdList(ScrabEvents.IReceive,		new SpriteCmdList(this,true),key)	as SpriteCmdList}
		SensorGreaterThan(key:string,value:number):SpriteCmdList
											 {return super.addCmdList(ScrabEvents.SensorGt,new SpriteCmdList(this,true),key,value)	as SpriteCmdList}
		
		public x:Variable;
		public y:Variable;
		public show:Variable;
		public dragable:Variable;
		public direction:Variable;
		public rotationStyle:Variable;

		public vars:ObjVariable;

		constructor(props:SpriteProperties={}){
			super(props.costumeNumber);
			this.x = new Variable();
			this.y = new Variable();
			this.show = new Variable();
			this.dragable = new Variable();
			this.direction = new Variable();
			this.rotationStyle = new Variable();

			this.x.set(props.x 							|| 0);
			this.y.set(props.y 							|| 0);
			this.show.set(props.show 					|| true);
			this.dragable.set(props.dragable 			|| false);
			this.direction.set(props.direction 			|| 90);
			this.rotationStyle.set(props.rotationStyle 	|| 0);

			if(! props.vars) return;
			this.vars = {};

			for(let i = props.vars.length-1; i>=0; --i){
				const variable     = new Variable(),
					  identifier   = props.vars[i][0],
					  defaultValue = props.vars[i][1];

				this.vars[identifier] = variable;
				variable.set(defaultValue);
			}
		}
	}
	type CmdFn = (...params)=>void;
	type Sprites = {[index: string]:Sprite;}
	type ObjVariable = {[index: string]:Variable;}
	type ICmdListGroup = {[index: string]:CmdList[];}

	class Cmd{
		constructor(private fn:CmdFn){}
		execute():void{this.fn(this.fn.arguments)};
	}
	abstract class CmdList {
		private sensorvalue:number;//only for SensorGreaterThan Events
		private queue:Cmd[]=[];
		private inLoop:boolean=false;
		private hold:boolean=false;
		private index:number=0;
		constructor(private root = false) {};

		abstract makeNewCmdList():this;
		protected addCmd(fn:CmdFn){this.queue.push(new Cmd(fn))}
		
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
		setVar(variable:string, value:any):this
		{
			if(vars[variable] === undefined)
				vars[variable] = new Variable();
			vars[variable].set(value);
			return this;
		}
		repeat(cmdlistfn: (cmdList: this) => void):this
		{
			const parent = this;
			const cmdList:this = this.makeNewCmdList();
			cmdlistfn(cmdList);
			this.addCmd(
					function(){
						parent.hold = parent.inLoop = true;
						cmdList.execute()
					}
			);
			return this;
		}
		repeatTimes(times:Getter,cmdlistfn: (cmdList: this) => void):this
		{
			const parent = this;
			const cmdList:this = this.makeNewCmdList();
			cmdlistfn(cmdList);
			this.addCmd(
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
					})(times.get())
			);
			return this;
		}
		ifThen(condition:Condition,
			   cmdlistfn: (cmdList: this) => void):this
		{
			const newCmdList:() => CmdList = this.makeNewCmdList;
			this.addCmd(
					(function(condition:Condition,cmdlistfn:(cmdList: CmdList) => void){
						return function(){
							if(condition.isTrue()){
								(function (cmdlistfn){
									let cmdList:CmdList = newCmdList();
									cmdlistfn(cmdList);
									return cmdList;
								})(cmdlistfn).execute();
							}
						};
					})(condition, cmdlistfn)
				
			);
			return this;
		}
		ifThenElse(condition:Condition,
				   cmdlistTrue: (cmdList: this) => void,
				   cmdlistFalse:(cmdList: this) => void):this
		{
			const newCmdList:() => CmdList = this.makeNewCmdList;
			this.addCmd(
				
					(function(condition:Condition, cmdlistTruefn: (cmdList: CmdList) => void,
												   cmdlistFalsefn:(cmdList: CmdList) => void){
						return function(){
							if(condition.isTrue()){
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
					})(condition, cmdlistTrue, cmdlistFalse)
				
			);
			return this;			
		}
		wait(sec:Getter):this
		{
			const parent = this;
			this.addCmd(
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
					})(sec.get())
				
			);
			return this;
		}
		waitUntil(condition:Condition):this
		{
			const parent = this;
			this.addCmd(
					(function(condition:Condition){
						return function(){
							if(parent.hold){
								if(condition.isTrue()){
									parent.hold=false;
								}
							}
							else{
								parent.hold = true;
							}
						};
					})(condition)
				
			);
			return this;
		}	
	}
	class SpriteCmdList extends CmdList{
		makeNewCmdList(root?:boolean): this {
			return <this>new SpriteCmdList(<Sprite>this.sprite, root);
		}

		constructor(private sprite:Sprite, root?:boolean) {super(root);}
		//queue methods		
		goto(x:Getter,y:Getter){
			const parent = this;
			this.addCmd(
					(function(x:Getter,y:Getter){
						return function(){
							parent.sprite.x.set(x.get());
							parent.sprite.y.set(y.get());
						}
					})(x,y)
				
			);
			return this;
		}
		setVar(variable:string, value){
			if(typeof this.sprite.vars[variable] === "undefined")
				return super.setVar(variable, value);

			this.sprite.vars[variable].set(value);
			return this;
		}		
	}
	class StageCmdList extends CmdList{
		makeNewCmdList(root?:boolean): this {
			return <this>new StageCmdList(root);
		}
		constructor(root?) {super(root);}
	}
	export const start = MainLoop.start;
	export const sprites:Sprites={};
	export const stage:Stage= new Stage();
	export const vars:ObjVariable={};
	export function addSprite(sprite: string, props: SpriteProperties):Sprite{
		return sprites[sprite] = sprites[sprite] || new Sprite(props);
	}
}