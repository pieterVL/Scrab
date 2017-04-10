namespace scrab{
	enum ScrabEvents{GreenFlag,KeyPressed,Clicked,SceneStarts,SensorGt,IReceive}
	abstract class SrcabObj{		
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
	class Stage extends SrcabObj{
		GreenFlag():			StageCmdList{return super.addCmdList(ScrabEvents.GreenFlag,new StageCmdList());};
		KeyPressed(key:string):	StageCmdList{return super.addCmdList(ScrabEvents.KeyPressed,new StageCmdList(),key);};
		Clicked():				StageCmdList{return super.addCmdList(ScrabEvents.Clicked,new StageCmdList());};
		SceneStarts(key:string):StageCmdList{return super.addCmdList(ScrabEvents.SceneStarts,new StageCmdList(),key);};
		IReceive(key:string):	StageCmdList{return super.addCmdList(ScrabEvents.IReceive,new StageCmdList(),key);};
		SensorGreaterThan(key:string,value:number):StageCmdList
											{return super.addCmdList(ScrabEvents.SensorGt,new StageCmdList(),key,value);};		
		constructor() {super();}

	}
	class Sprite extends SrcabObj{
		GreenFlag():			SpriteCmdList{return super.addCmdList(ScrabEvents.GreenFlag, new SpriteCmdList());}
		KeyPressed(key:string):	SpriteCmdList{return super.addCmdList(ScrabEvents.KeyPressed,new SpriteCmdList(),key);};
		Clicked():				SpriteCmdList{return super.addCmdList(ScrabEvents.Clicked,new SpriteCmdList());};
		SceneStarts(key:string):SpriteCmdList{return super.addCmdList(ScrabEvents.SceneStarts,new SpriteCmdList(),key);};
		IReceive(key:string):	SpriteCmdList{return super.addCmdList(ScrabEvents.IReceive,new SpriteCmdList(),key);};
		SensorGreaterThan(key:string,value:number):SpriteCmdList
											 {return super.addCmdList(ScrabEvents.SensorGt,new SpriteCmdList(),key,value);};
		
		constructor() {super();}
	}
	interface ICmdListGroup{[index: string]:CmdList[];}
	abstract class CmdList{
		private sensorvalue:number;//only for SensorGreaterThan Events
		constructor(){};
	}
	class SpriteCmdList extends CmdList{
		constructor() {super();}
	}
	class StageCmdList extends CmdList{
		constructor() {super();}
	}
	interface ISprites{[index: string]:Sprite;}
	export let sprites:ISprites={};
	export let stage:Stage= new Stage();
	export function addSprite(sprite: string):void{
		if(sprites.hasOwnProperty(sprite))
			console.log("The name: "+sprite+" is already in use, please choise an other name");
		else
			sprites[sprite]=new Sprite();
	}
}
