namespace scrab{
	abstract class SrcabObj{
		greenFlag:CmdList[];
		keyPressed:ICmdListGroup;
		clicked:CmdList[];
		sceneStarts:ICmdListGroup;
		sensorGreaterThan:ICmdListGroup;
		iReceive:ICmdListGroup;
		constructor(){
			this.keyPressed={};
			this.sceneStarts={};
			this.sensorGreaterThan={};
			this.iReceive={};
		};
	}
	class Stage extends SrcabObj{
		constructor() {super();}
	}
	class Sprite extends SrcabObj{
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
	export function addSprite(sprite: string):void{
		if(this.hasOwnProperty(sprite))
			console.log("The name: "+sprite+" is already in use, please choise an other name");
		else
			this[sprite] = new Sprite();
	}
}
