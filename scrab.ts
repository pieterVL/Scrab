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
		export function addBroadCastToQueue(broadCastCmdList:CmdList):void{
			queue.push(broadCastCmdList);
		}
		export function start():void{
			if(lastTime>0){
				previousScrabTime=now;
			}
			Events.fireGreenFlag();
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
				Events.update();
			}
			requestAnimation(loop);
		}
		let queue:CmdList[];
		function executeQueue():void{
			queue = nextQueue;
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
	module Events {
		export enum Type { GreenFlag, KeyPressed, Clicked, StageClicked, SceneStarts, SensorGt, Receive }
		
		const greenFlag: CmdList[] = [];
		const keyPressed: ICmdListGroup = {};
		const sceneStarts: ICmdListGroup = {};
		const clicked: CmdList[] = [];
		const stageClicked: CmdList[] = [];
		const sensorGreaterThan: ICmdListGroup = {};
		const receive: ICmdListGroup = {};
		
		export function fireGreenFlag() {
			for (let i = 0; i < greenFlag.length; ++i) {
				MainLoop.addToQueue(greenFlag[i]);
			}
		}
		
		let broadcastedCmdLists : {[key: string] : CmdList[]} = {};
		let broadCastKeys = [];
		let awaitingBroadcastKeys = [];
		export function update(){
			for (let i = 0; i < broadCastKeys.length; ++i) {
				broadCastKeys[i] = undefined;
			}
			broadCastKeys.length = 0;
		};
		export function awaitBroadcastCompleteCheck(key: string): ()=>boolean{
			let addedCmdLists: CmdList[] = broadcastedCmdLists[key];
				return function () {
					let len = addedCmdLists.length;
					while (len--)
					if (addedCmdLists[len].isOnHold()) {
						return false;
					}
					broadcastedCmdLists[key] = undefined;
					awaitingBroadcastKeys.slice(
						awaitingBroadcastKeys.indexOf(key),1
					)
					return true;
				}
		};
		export function fireBroadcast(key: string, awaiting?: boolean):void {
			if(broadcastedCmdLists[key]){
				if(awaiting){
					var index = broadCastKeys.indexOf(key);
					if(index > -1){
						broadCastKeys.splice(index, 1);
						awaitingBroadcastKeys.push(key);
						console.log('mag niet nu');...
					}
				}
				return;
			}

			if (awaiting) awaitingBroadcastKeys.push(key)
			else		  broadCastKeys.push(key);

			const addedBroadcastLists: CmdList[] = [];

			for (let i = 0; i < receive[key].length; ++i) {
				const cmdList: CmdList = receive[key][i];
				if (!cmdList.isLocked()) {
					MainLoop.addBroadCastToQueue(cmdList);
					addedBroadcastLists.push(cmdList);
				}
			}
			broadcastedCmdLists[key] = addedBroadcastLists;
		}

		export function registerHandler(eventType: Events.Type, cmdList: CmdList, key?: string, value?: number) {
			switch (eventType) {
				case Events.Type.GreenFlag:		greenFlag.push(cmdList); 		break;
				case Events.Type.KeyPressed:	keyPressed[key].push(cmdList);	break;
				case Events.Type.Clicked:		clicked.push(cmdList);			break;
				case Events.Type.StageClicked:	stageClicked.push(cmdList);		break;
				case Events.Type.SceneStarts:	sceneStarts[key].push(cmdList);	break;
				case Events.Type.Receive:
					receive[key] = receive[key] || [];
					receive[key].push(cmdList);
					break;
				case Events.Type.SensorGt:		sensorGreaterThan[key].push(cmdList);
					cmdList.sensorvalue = value;
					break;
				default: break;
			}
		}
	}

	abstract class ScrabObj{		
		constructor(costumeNumber:number=0){
			this.costumeNumber = new Variable();
			this.costumeNumber.set(costumeNumber);
		};

		public costumeNumber:Variable;
		
		protected addCmdList(eventType:Events.Type, cmdList: CmdList, key?:string, value?:number):CmdList{
			Events.registerHandler(eventType, cmdList, key, value);
			return cmdList;
		}
	}
	class Stage extends ScrabObj{
		GreenFlag():			StageCmdList{return super.addCmdList(Events.Type.GreenFlag,	new StageCmdList(true))}
		KeyPressed(key:string):	StageCmdList{return super.addCmdList(Events.Type.KeyPressed,new StageCmdList(true),key)}
		Clicked():				StageCmdList{return super.addCmdList(Events.Type.StageClicked,new StageCmdList(true))}
		SceneStarts(key:string):StageCmdList{return super.addCmdList(Events.Type.SceneStarts,new StageCmdList(true),key)}
		Receive(key:string):	StageCmdList{return super.addCmdList(Events.Type.Receive,	 new StageCmdList(true),key)}
		SensorGreaterThan(key:string,value:number):StageCmdList
											{return super.addCmdList(Events.Type.SensorGt,	new StageCmdList(true),key,value)}

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
		GreenFlag():			SpriteCmdList{return super.addCmdList(Events.Type.GreenFlag,  	new SpriteCmdList(this,true))		as SpriteCmdList}
		KeyPressed(key:string):	SpriteCmdList{return super.addCmdList(Events.Type.KeyPressed, 	new SpriteCmdList(this,true),key)	as SpriteCmdList}
		Clicked():				SpriteCmdList{return super.addCmdList(Events.Type.Clicked,		new SpriteCmdList(this,true))	as SpriteCmdList}
		SceneStarts(key:string):SpriteCmdList{return super.addCmdList(Events.Type.SceneStarts,	new SpriteCmdList(this,true),key)	as SpriteCmdList}
		Receive(key:string):	SpriteCmdList{return super.addCmdList(Events.Type.Receive,		new SpriteCmdList(this,true),key)	as SpriteCmdList}
		SensorGreaterThan(key:string,value:number):SpriteCmdList
											 {return super.addCmdList(Events.Type.SensorGt,new SpriteCmdList(this,true),key,value)	as SpriteCmdList}
		
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
		private locked:boolean=false;
		private hold:boolean=false;
		private index:number=0;
		constructor(private root = false) {};
		
		isLocked():boolean{
			return this.locked;
		}
		isOnHold():boolean{
			return this.hold;
		}
		
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
		setVar(variable:string, value:Getter):this
		{
			if(vars[variable] === undefined)
					vars[variable] = new Variable();
			this.addCmd(
					(function(variable:Variable,value:Getter){
						return function(){
							variable.set(value.get());
						}
					})(vars[variable], value)
			);
			
			return this;
		}
		repeat(cmdlistfn: (cmdList: this) => void):this
		{
			const parent = this;
			const cmdList:this = this.makeNewCmdList();
			cmdlistfn(cmdList);
			this.addCmd(
					function(){
						parent.hold = parent.locked = true;
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
							if(parent.locked){
								if(--repeatTimes>0){
									cmdList.execute()
								}else{
									parent.hold = parent.locked = false;
								}
							}
							else{
								parent.hold = parent.locked = true;
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
				(function(sec:Getter){
					let timeTillHold:number;
					return function(){
						if(parent.hold){
							if(timeTillHold<=MainLoop.getTimer()){
								parent.hold=false;
							}
						}
						else{
							parent.hold = true;
							timeTillHold = MainLoop.getTimer()+ sec.get()*1000;
						}
					};
				})(sec)
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
		broadCast(key: string): this {
			this.addCmd(
				(function (key: string) {
					return function () {
						Events.fireBroadcast(key);
					}
				})(key)
			)
			return this;
		}
		broadCastAndWait(key:string):this
		{
			const parent = this;
			let cleanIfDone: ()=>boolean;
			this.addCmd((function (key: string) {
				return function () {
					console.log(parent.locked)
					if (parent.locked) {
						if (cleanIfDone()) {
							parent.hold = parent.locked = false;
						}
					}
					else {
						parent.hold = parent.locked = true;
						Events.fireBroadcast(key, true);
						cleanIfDone = Events.awaitBroadcastCompleteCheck(key);
					}
				}
			})(key))
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
		setVar(variable:string, value:Getter){
			if(typeof this.sprite.vars[variable] === "undefined")
				return super.setVar(variable, value);

			this.addCmd(
				(function(variable:Variable,value:Getter){
					return function(){						
						variable.set(value.get());
					}
				})(this.sprite.vars[variable], value)
			);
			return this;
		}		
	}
	class StageCmdList extends CmdList {
		makeNewCmdList(root?: boolean): this {
			return <this>new StageCmdList(root);
		}
		constructor(root?) { super(root); }
	}
	export const start = MainLoop.start;
	export const sprites: Sprites = {};
	export const stage: Stage = new Stage();
	export const vars: ObjVariable = {};
	export function addSprite(sprite: string, props: SpriteProperties): Sprite {
		return sprites[sprite] = sprites[sprite] || new Sprite(props);
	}
}