namespace scrab{
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
		abstract GreenFlag():CmdList;
	}
	class Stage extends SrcabObj{
		GreenFlag():StageCmdList{
			let cmdList:StageCmdList = new StageCmdList();
			this.greenFlag.push(cmdList);
			return cmdList;
		};
		constructor() {super();}

	}
	class Sprite extends SrcabObj{
		GreenFlag(): SpriteCmdList{
			let cmdList:SpriteCmdList = new SpriteCmdList();
			this.greenFlag.push(cmdList);
			return cmdList;
		}
		constructor() {super();}
	}
	interface ICmdListGroup{[index: string]:CmdList[];}
	abstract class CmdList{
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
		if(this.hasOwnProperty(sprite))
			console.log("The name: "+sprite+" is already in use, please choise an other name");
		else
			sprites[sprite]=new Sprite();
	}
}
