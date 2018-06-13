var requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || window.mozRequestAnimationFrame;

var forceIsApp = false;

var _isApp = null;
var _isAndroid = null;

var _isMobile = false;

var Game;
var GPlay;

var app = {
    // Application Constructor
    initialize: function() {
		Game = new SoaringSheepGame();

        //Init Event Listeners
        this.bindEvents();
    },

    bindEvents: function() {
        if(MobileAndTabletCheck()){
            window.addEventListener('touchmove', function(e) {
                // Prevent scrolling
                e.preventDefault();
            }, false);

			_isMobile = true;
            console.log("Mobile device detected");
        }

        window.addEventListener('online', this.connectionChange.bind(this) );
        window.addEventListener('offline', this.connectionChange.bind(this) );

        if(isApp()) window.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
        else window.addEventListener('DOMContentLoaded', this.onDeviceReady.bind(this), false);
    },

    onDeviceReady: function() {
        console.log((isApp())?"Device Ready!":"DOM Loaded...");

        //GPlay = new GooglePlayServices();

        FastClick.attach(document.body);
		Game.initStage();
    },

    connectionChange: function(e){
        if(event.type == "offline"){
            console.log("Oh no, you lost connection.");

            //GPlay.noConnection = true;
            Game.isOnline = false;
        }
        else if(event.type == "online"){
            console.log("Yay you are now back online!");

            //GPlay.noConnection = false;
            Game.isOnline = true;

            //if(game._gameStarted) GPlay.init();
        }
    }
};

var SoaringSheepGame = function(){
	var self = this;

    this.isOnline = navigator.onLine;

	this._gameStarted = false;
	this._jumpToStartGame = false;

	this.hwratio = 9/16; //most screens are of game resolution
	this.canvasWidth = 1600;
	this.canvasHeight = 900;

	this.controls = {
		"jump":{
			"keys":[32,38], //Space, Up-Arrow
			"callback":"heroJump"
		},
		"pause":{
			"keys":["P".charCodeAt(),27], //P, Esc
			"callback":"togglePause"
		},
		"muteMain":{
			"keys":["M".charCodeAt()], //M
			"callback":"toggleMuteMain"
		},
		"muteFX":{
			"keys":["M".charCodeAt()], //M
			"callback":"toggleMuteFX"
		},
		"info":{
			"keys":["I".charCodeAt()], //M
			"callback":"showInfo"
		}
	}

	this.hero = null;
    this.heroShield = null;

    this.shieldTimer;
    this.shieldTimeInc = 500; //ms
    this.shieldFadeInc = 0.1;

	this.preventHeroJump = 0;

	this.defOptions = {
		"muteFX":false,
		"muteMain":false
	};

	this.score = 0;
	this.highscore = 0;

	this.scoreText = null;
	this.overSym = null;
	this.highscoreText = null;

	this.speedInc = 0.985; //anything below 0.95 is a problem
    this.minSpeed = 6.5;
	this.maxSpeed = 11.5;

	this._paused = false;
	this._musicMuted = false;
	this._FXMuted = false;

	this.startScreen = null;
	this.loadingBar = null;

    this.fadeObjects = null;
	this.fadeInTimer = null;

	this.animations = {
		"jumping":{
			"frames":[],
			"totalFrames":7
		}
	};

	this.sprites = {

	};

	this.audioLib = ["main_music","jump","bounce","die","shield"];
	this.audioVol = [0.4,0.15,0.1,0.8,0.8];
	this.audio = {

	}

	this.iconNames = ["pause","play","music_on","music_off","fx_on","fx_off","games","info","web","logout","leaderboard","achievements","settings"];

	this.pauseButton;
	this.muteMusicButton;
	this.muteFXButton;

	this.gamesButton;
    this.webButton;

    this.infoButton;
    this.infoOverlay;

	this.fonts = {};
	this.totalFonts;
	this.totalFontsFailed = 0;
	this.totalFontsLoaded = 0;

	this.obstacles;
	this.obstacleTimer;
	this.obstacleSpawnTime = 1000; //in ms

	this.obstacleSections;
	this.obstacleSectionActive = [];
	this.nObstacleSections = 3;

    this.powerupNames = ["shield","plusOne"];
    this.powerups;
    this.powerupChance = 0.4;

	this.pauseTime;
	this.pauseTimer;
	this.pauseOverlay;

    //Google Play
    this.isLoggedIn = false;
    this.playGamesMenu;
    this.leaderboardID = "CgkI8sq82fwOEAIQAg";
    this.leaderboard = {
        "id":"CgkI8sq82fwOEAIQAg", //GPlay leaderboardID
        "maxResults": 10,
        "self":{
            "rank":{},
            "name":{},
            "score":{}
        },
        "others":[]
    }

    //For generating achievements object:
    /*
    var x = document.querySelectorAll("table.GAK3QBB-ad-y tbody td div")
    for(i=2;i<x.length;i+=7){
        y = {};
        y.id = x[i+1].innerHTML;
        y.name = x[i].getElementsByTagName("a")[0].innerHTML;
        y.points = parseInt(x[i+2].innerHTML);
        y.complete = false;
        y.synced = false;
        out = '{\n';
        for(j in y){
            if(!y.hasOwnProperty(j)) continue;
            out+="\t'"+j.toString()+"': '"+y[j]+"'\n";
        }
        out+="}"
        console.log(out);
    }
    */

    this.achievements = {
        "single":{
            "support":[{
            	'id': 'CgkI8sq82fwOEAIQBg',
            	'name': 'Supportive Sheep',
            	'points': 5,
                'complete': false,
                'synced': false
            }],
            "curiosity":[{
            	'id': 'CgkI8sq82fwOEAIQBw',
            	'name': 'Curiosity slayed the lamb',
            	'points': 5
            }],
            "score":[{
            	'id': 'CgkI8sq82fwOEAIQDQ',
            	'name': 'Soaring beyond limits 1',
            	'points': 10,
            	'complete': false,
            	'synced': false
            }, {
            	'id': 'CgkI8sq82fwOEAIQDg',
            	'name': 'Soaring Beyond Limits 2',
            	'points': 20,
            	'complete': false,
            	'synced': false
            }, {
            	'id': 'CgkI8sq82fwOEAIQDw',
            	'name': 'Soaring Beyond Limits 3',
            	'points': 50,
            	'complete': false,
            	'synced': false
            }, {
            	'id': 'CgkI8sq82fwOEAIQEA',
            	'name': 'Soaring Beyond Limits - Crazy',
            	'points': 100,
            	'complete': false,
            	'synced': false
            }],
            "addicted":[{
            	'id': 'CgkI8sq82fwOEAIQGw',
            	'name': 'Clearly Addicted',
            	'points': 50,
            	'complete': false,
            	'synced': false
            }]
        },
        "incremental":{
            "die":[{
            	'id': 'CgkI8sq82fwOEAIQCQ',
            	'name': 'Sacrificial Lamb 1',
            	'points': 5,
                'completedSteps': 0,
                'totalSteps': 0,
                'complete': false,
                'synced': false
            }, {
            	'id': 'CgkI8sq82fwOEAIQCA',
            	'name': 'Sacrificial Lamb 2',
            	'points': 10,
                'completedSteps': 0,
                'totalSteps': 0,
                'complete': false,
                'synced': false
            }, {
            	'id': 'CgkI8sq82fwOEAIQCg',
            	'name': 'Sacrificial Lamb 3',
            	'points': 15,
                'completedSteps': 0,
                'totalSteps': 0,
                'complete': false,
                'synced': false
            }, {
            	'id': 'CgkI8sq82fwOEAIQCw',
            	'name': 'Sacrificial Lamb 4',
            	'points': 25,
                'completedSteps': 0,
                'totalSteps': 0,
                'complete': false,
                'synced': false
            }, {
            	'id': 'CgkI8sq82fwOEAIQDA',
            	'name': 'Sacrificial Lamb -  Extreme',
            	'points': 50,
                'completedSteps': 0,
                'totalSteps': 0,
                'complete': false,
                'synced': false
            }, {
            	'id': 'CgkI8sq82fwOEAIQFQ',
            	'name': 'Sacrificial Lamb - Clearly addicted',
            	'points': 100,
                'completedSteps': 0,
                'totalSteps': 0,
                'complete': false,
                'synced': false
            }],
            "score_times":[{
            	'id': 'CgkI8sq82fwOEAIQEQ',
            	'name': 'Gliding Along 1',
            	'points': 15,
                'completedSteps': 0,
                'totalSteps': 0,
            	'complete': false,
            	'synced': false
            }, {
            	'id': 'CgkI8sq82fwOEAIQEg',
            	'name': 'Gliding Along 2',
            	'points': 25,
                'completedSteps': 0,
                'totalSteps': 0,
            	'complete': false,
            	'synced': false
            }, {
            	'id': 'CgkI8sq82fwOEAIQEw',
            	'name': 'Gliding Along 3',
            	'points': 40,
                'completedSteps': 0,
                'totalSteps': 0,
            	'complete': false,
            	'synced': false
            }, {
            	'id': 'CgkI8sq82fwOEAIQFA',
            	'name': 'Soaring Along!',
            	'points': 100,
                'completedSteps': 0,
                'totalSteps': 0,
            	'complete': false,
            	'synced': false
            }, {
            	'id': 'CgkI8sq82fwOEAIQFg',
            	'name': 'Soaring Along - Clearly Addicted!',
            	'points': 200,
                'completedSteps': 0,
                'totalSteps': 0,
            	'complete': false,
            	'synced': false
            }],
            "shield":[{
            	'id': 'CgkI8sq82fwOEAIQFw',
            	'name': 'Shielded Sheep 1',
            	'points': 5,
                'completedSteps': 0,
                'totalSteps': 0,
            	'complete': false,
            	'synced': false
            }, {
            	'id': 'CgkI8sq82fwOEAIQGA',
            	'name': 'Shielded Sheep 2',
            	'points': 10,
                'completedSteps': 0,
                'totalSteps': 0,
            	'complete': false,
            	'synced': false
            }, {
            	'id': 'CgkI8sq82fwOEAIQGQ',
            	'name': 'Shielded Sheep 3',
            	'points': 20,
                'completedSteps': 0,
                'totalSteps': 0,
            	'complete': false,
            	'synced': false
            }, {
            	'id': 'CgkI8sq82fwOEAIQGg',
            	'name': 'Shielded Sheep - Clearly Addicted',
            	'points': 50,
                'completedSteps': 0,
                'totalSteps': 0,
            	'complete': false,
            	'synced': false
            }]
        },
        "totalSteps":{} //Dynamically generated based on this.achievements data
    }

    var ii,jj,_achInc = this.achievements.incremental;
    for(ii in _achInc){
        this.achievements.totalSteps[ii] = [];
        for(jj=0;jj<_achInc[ii].length;jj++){
            this.achievements.totalSteps[ii].push(_achInc[ii][jj].totalSteps);
        }
    }

    //Ads
    this.totalGamesPlayed = 0;


    //Functions
	this.initStage = function(){
		//CHECK MOBILE
		_isMobile = MobileAndTabletCheck();

		//INIT RENDERER
		var rendererOptions = {
			width: this.canvasWidth,
			height: this.canvasHeight,
			antialias: false,
			transparent: false,
			resolution: window.devicePixelRatio,
			autoResize: true,
			backgroundColor: 0x90a4ae
		}

		renderer = PIXI.autoDetectRenderer(rendererOptions);

		//INIT STAGE AND RESIZE TO FIT SCREEN
		stage = new PIXI.Container();
		this.resizeCanvas();

		document.getElementById("canvas_container").appendChild(renderer.view);

		//ADD EVENT LISTENERS
		//NOTE: Reason for adding event listeners here instead of new game is that the event listeners cannot seem to be removed upon gameover, causing a bug where more than one event listeners are added upon gameover.

		window.addEventListener("resize", this.resizeCanvas.bind(this), false);
		window.addEventListener("keyup", this.keyEvent.bind(this), false);

        window.addEventListener("focus", this.appFocus.bind(this), false);
		window.addEventListener("blur", this.appBlur.bind(this), false);

        document.addEventListener("resume", this.appFocus.bind(this), false);
		document.addEventListener("pause", this.appBlur.bind(this), false);

		renderer.view.addEventListener((_isMobile)?"touchend":"mouseup", this.heroJump.bind(this), false);

		//LOAD IMAGES, FONTS AND MUSIC
		this.loadFonts(); //(load fonts first to make sure start screen has proper fonts)
		//--> this.initPreload();
	}

	this.initPreload = function(){
		var i;

		//PRELOADING OF IMAGES INTO PIXI LOADER
		this.loader = new PIXI.loaders.Loader();
		this.loader.add("sprite_background","img/background.png");
		this.loader.add("sprite_spike","img/spike.png");

        for(i=0;i<this.powerupNames.length;i++){
            this.loader.add("powerup_"+this.powerupNames[i].toString(),"img/powerups/"+this.powerupNames[i]+".png");
        }

		for(i=0;i<this.iconNames.length;i++){
			this.loader.add("icon_"+this.iconNames[i].toString(),"img/icons/"+this.iconNames[i]+".png");
		}

		for(i=0;i<this.animations.jumping.totalFrames;i++){
			this.loader.add("sheep_"+i,"img/jumpingAnimation/"+i+".png");
		}

		//PRELOADING OF AUDIO
		for(i=0;i<this.audioLib.length;i++){
			this.loader.add("audio_"+this.audioLib[i],"audio/"+this.audioLib[i]+".mp3");
		}

		//LOADING BAR AND START SCREEN
		this.buildStartScreen();

		this.loader.on('progress', (loader,resource) => {
			this.loadingBar.progressText.text = Math.round(loader.progress)+"%";

			var _width = Math.round(loader.progress/100)*this.loadingBar.progressBar.maxWidth;
			this.loadingBar.progressBar.beginFill(0xcfd8dc)
				.drawRect(-this.loadingBar.progressBar.maxWidth/2,0,_width,this.loadingBar.progressBar.maxHeight)
			.endFill();

			//console.log('Progress: ' + loader.progress + '%');
			//console.log('Loading: ' + resource.name.split("_").join(" ").toUpperCase());
		});

		renderer.render(stage);

		this.loader.load((loader, resources) => {
		    //NOTE: "resources" is an object where the key is the name of the resource loaded and the value is the resource object.

			//SPRITES
			//-Background
		    this.sprites.background = new PIXI.extras.TilingSprite(
				resources["sprite_background"].texture,
				this.canvasWidth+1, //FIX: fixes weird pixel bug
				this.canvasHeight
			);
			//this.sprites.background.tint = 0xeceff1;

			this.sprites.spike = new PIXI.Sprite(resources["sprite_spike"].texture);

			stage.addChild(this.sprites.background);

            var nm;

            //POWERUPS
            this.sprites.powerups = {};
            for(i=0;i<this.powerupNames.length;i++){
                nm = this.powerupNames[i].toString();
                this.sprites.powerups[nm] = new PIXI.Sprite(resources["powerup_"+nm].texture);
            }

            this.powerupOffset = this.sprites.spike.height/100+this.sprites.powerups[this.powerupNames[0]].height*(0.3)+50;

			//-ICONS/BUTTONS
			this.sprites.icons = {};
			for(i=0;i<this.iconNames.length;i++){
				nm = this.iconNames[i].toString();
				this.sprites.icons[nm] = new PIXI.Sprite(resources["icon_"+nm].texture);
				this.sprites.icons[nm].anchor.set(0.5);
				this.sprites.icons[nm].scale.set(0.8,0.8);
				this.sprites.icons[nm].alpha = 0;
				this.sprites.icons[nm].tint = 0x90a4ae;
				this.sprites.icons[nm].name = nm;
			}

			//--Pause Button
			this.pauseButton = new PIXI.Container();
			this.pauseButton.interactive = true;
			this.pauseButton.buttonMode = true;

			this.pauseButton.on((_isMobile)?"touchend":"mouseup",this.togglePause.bind(this));

			this.pauseButton.position.set(this.canvasWidth-60,50);

			this.pauseButton.addChild(this.sprites.icons["pause"]);
			this.pauseButton.addChild(this.sprites.icons["play"]);
			this.pauseButton.getChildByName("pause").alpha = 1;

			//--Mute Music Button
			this.muteMusicButton = new PIXI.Container();
			this.muteMusicButton.interactive = true;
			this.muteMusicButton.buttonMode = true;

			this.muteMusicButton.on((_isMobile)?"touchend":"mouseup",this.toggleMuteMain.bind(this));

			this.muteMusicButton.position.set(this.canvasWidth-145,50);

			this.muteMusicButton.addChild(this.sprites.icons["music_on"]);
			this.muteMusicButton.addChild(this.sprites.icons["music_off"]);
			this.muteMusicButton.getChildByName("music_on").alpha = 1;

			//--Text
			textOpt = {
				fontFamily: 'TimeBurnerBold',
				fill: "0x90a4ae",
				letterSpacing: 5,
				align: 'center',
				fontSize: 20
			};

			text = new PIXI.Text("MUSIC",textOpt);
			text.anchor.set(0.5,0.5);
			text.alpha = 1;
			text.y = 55;
			this.muteMusicButton.addChild(text);

			//--Mute FX Button
			this.muteFXButton = new PIXI.Container();
			this.muteFXButton.interactive = true;
			this.muteFXButton.buttonMode = true;

			this.muteFXButton.on((_isMobile)?"touchend":"mouseup",this.toggleMuteFX.bind(this));

			this.muteFXButton.position.set(this.canvasWidth-235,50);

			this.muteFXButton.addChild(this.sprites.icons["fx_on"]);
			this.muteFXButton.addChild(this.sprites.icons["fx_off"]);
			this.muteFXButton.getChildByName("fx_on").alpha = 1;

			//--Text
			text = new PIXI.Text("FX",textOpt);
			text.anchor.set(0.5,0.5);
			text.alpha = 1;
			text.y = 55;
			this.muteFXButton.addChild(text);

            //--Games Button
			this.gamesButton = new PIXI.Container();

			this.gamesButton.interactive = true;
			this.gamesButton.buttonMode = true;

			this.gamesButton.on((_isMobile)?"touchend":"mouseup",this.showPlayGamesMenu.bind(this));

			this.gamesButton.position.set(80,50);

            this.gamesButton.addChild(this.sprites.icons["games"]);
            this.gamesButton.getChildByName("games").alpha = 1;

            //--Text
            text = new PIXI.Text("PLAY\nGAMES",textOpt);
			text.anchor.set(0.5,0.5);
			text.alpha = 1;
			text.y = 67.5;
			this.gamesButton.addChild(text);

            //--Info Button
			this.infoButton = new PIXI.Container();

			this.infoButton.interactive = true;
			this.infoButton.buttonMode = true;

			this.infoButton.on((_isMobile)?"touchend":"mouseup",this.showInfo.bind(this));

			this.infoButton.position.set(190,50);

            this.infoButton.addChild(this.sprites.icons["info"]);
            this.infoButton.getChildByName("info").alpha = 1;

            //--Text
            text = new PIXI.Text("INFO",textOpt);
            text.anchor.set(0.5,0.5);
            text.alpha = 1;
            text.y = 55;
            this.infoButton.addChild(text);

            //--Web Button
            this.webButton = new PIXI.Container();

            this.webButton.interactive = true;
            this.webButton.buttonMode = true;

            this.webButton.on((_isMobile)?"touchend":"mouseup",this.gotoURL.bind(this,"https://samleo8.github.io/games/"));

            this.webButton.position.set(292,50);

            this.webButton.addChild(this.sprites.icons["web"]);
            this.webButton.getChildByName("web").alpha = 1;

            //--Text
            text = new PIXI.Text("DEV\nSITE",textOpt);
            text.anchor.set(0.5,0.5);
            text.alpha = 1;
            text.y = 67.5;
            this.webButton.addChild(text);

			//ANIMATIONS
			for (i=0;i<this.animations.jumping.totalFrames;i++) {
				this.animations.jumping.frames.push(resources["sheep_"+i].texture);
			}
			this.animations.jumping.frames.push(resources["sheep_0"].texture);

			//-HERO
			this.hero = new PIXI.extras.AnimatedSprite(this.animations.jumping.frames);
			this.hero.animationSpeed = 0.15;
			this.hero.loop = false;
			this.hero.anchor.set(0.5);
			this.hero.scale.set(0.35,0.35);

			//LOAD AUDIO
			for(i=0;i<this.audioLib.length;i++){
				nm = this.audioLib[i];
				this.audio[nm] = resources["audio_"+nm].sound;
				this.audio[nm].volume = this.audioVol[i];
				this.audio[nm].defaultVolume = this.audioVol[i];
			}
			this.audio["main_music"].play({loop:true});
			this.audio["main_music"].loop = true;

			this.allAssetsLoaded();
		});
	};

	this.loadFonts = function(){
		//INITIALIZE FONTS USING FontFaceObserver.JS
		this.fonts["TimeBurner"] = new FontFaceObserver("TimeBurner");
		this.fonts["TimeBurnerBold"] = new FontFaceObserver("TimeBurnerBold");

		this.totalFonts = Object.keys(this.fonts).length;
		this.totalFontsLoaded = 0;
		this.totalFontsFailed = 0;

		var i;
		for(i in this.fonts){
			this.fonts[i].load().then(
				this.checkAllFontsLoaded.bind(this,true),
				this.checkAllFontsLoaded.bind(this,false)
			);
		}
	};

	this.checkAllFontsLoaded = function(success){

		if(success) this.totalFontsLoaded++;
		else this.totalFontsFailed++;

		if( (this.totalFontsLoaded+this.totalFontsFailed)>=this.totalFonts){
			console.log(this.totalFontsLoaded+"/"+this.totalFonts+" Fonts Loaded...");

			this.initPreload();
		}
	};

	this.buildStartScreen = function(){
		this.startScreen = new PIXI.Container();

		var bg_basic = new PIXI.Graphics();
		//-Main Bg
		bg_basic.beginFill(0x37474f);
		bg_basic.drawRect(0,0,this.canvasWidth,this.canvasHeight);
		bg_basic.endFill();

		var rect = new PIXI.Graphics();
		//-Sides
		rect.beginFill(0xcfd8dc,0.9);
		rect.drawRect(0,this.canvasHeight/2-150,500,140);
		rect.drawRect(1100,this.canvasHeight/2-150,500,140);
		rect.endFill();

		//-Border for sides
		rect.lineStyle(8,0x90a4ae)
			.moveTo(0,this.canvasHeight/2-150).lineTo(500,this.canvasHeight/2-150)
			.moveTo(0,this.canvasHeight/2-10).lineTo(500,this.canvasHeight/2-10)
			.moveTo(1100,this.canvasHeight/2-150).lineTo(1600,this.canvasHeight/2-150)
			.moveTo(1100,this.canvasHeight/2-10).lineTo(1600,this.canvasHeight/2-10);

		this.startScreen.addChild(bg_basic);

		var textOpt = {
			fontFamily: 'TimeBurnerBold',
			fill: "#cfd8dc",
			stroke: "#90a4ae",
			strokeThickness: 10,
			letterSpacing: 10,
			align: 'center',
			fontSize:120
		};

		var text = new PIXI.Text("SOARING",Object.assign(textOpt));
		text.anchor.set(0.5,0.5);
		text.x = this.canvasWidth/2;
		text.y = this.canvasHeight/2-150;

		this.startScreen.addChild(text);

		text2 = new PIXI.Text("SHEEP",Object.assign(textOpt));
		text2.anchor.set(0.5,0.5);
		text2.x = this.canvasWidth/2+73;
		text2.y = this.canvasHeight/2-20;

		var _offset = 70;
		rect.y -= _offset; text.y -= _offset; text2.y -= _offset;

		this.startScreen.addChild(rect);
		this.startScreen.addChild(text);
		this.startScreen.addChild(text2);

		//-Actual loader bar
		this.loadingBar = new PIXI.Container();

		this.loadingBar.progressBar = new PIXI.Graphics();
		this.loadingBar.progressBar.maxWidth = 700;
		this.loadingBar.progressBar.maxHeight = 25;
		this.loadingBar.progressBar.strokeWidth = 6;

		//--Outline
		//-(Actual Bar drawn in progress handler)
		this.loadingBar.progressBar.lineStyle(this.loadingBar.progressBar.strokeWidth,0x90a4ae)
			.moveTo(-this.loadingBar.progressBar.maxWidth/2,0)
			.lineTo(this.loadingBar.progressBar.maxWidth/2,0)
			.lineTo(this.loadingBar.progressBar.maxWidth/2,this.loadingBar.progressBar.maxHeight)
			.lineTo(-this.loadingBar.progressBar.maxWidth/2,this.loadingBar.progressBar.maxHeight)
			.lineTo(-this.loadingBar.progressBar.maxWidth/2,-this.loadingBar.progressBar.strokeWidth/2);

		textOpt = {
			fontFamily: 'TimeBurner',
			fill: "#cfd8dc",
			letterSpacing: 5,
			align: 'center',
			fontSize: 40
		};

		this.loadingBar.progressText = new PIXI.Text("0%",textOpt);
		this.loadingBar.progressText.anchor.set(0.5,0.5);
		this.loadingBar.progressText.y = this.loadingBar.progressBar.maxHeight/2+this.loadingBar.progressBar.strokeWidth/2;
		this.loadingBar.progressText.x = this.loadingBar.progressBar.width/2+80;

		this.loadingBar.position.set(this.canvasWidth/2-50,this.canvasHeight*(7/8));

		this.loadingBar.addChild(this.loadingBar.progressBar);
		this.loadingBar.addChild(this.loadingBar.progressText);

		this.loadingBar.name = "loader_bar";
		this.startScreen.addChild(this.loadingBar);

		stage.addChild(this.startScreen);
	}

    //GENERATE OVERLAYS
    this.generateOverlays = function(){
        /* PAUSE OVERLAY */
        this.pauseOverlay = new PIXI.Container();

        var rect = new PIXI.Graphics();
        rect.beginFill(0x263238,0.7);
        rect.drawRect(0,0,this.canvasWidth,this.canvasHeight);
        rect.endFill();

        this.pauseOverlay.addChild(rect);

        var textOpt = {
            fontFamily: 'TimeBurnerBold',
            fill: "#cfd8dc",
            stroke: "#90a4ae",
            strokeThickness: 10,
            letterSpacing: 10,
            align: 'center'
        };

        var text = new PIXI.Text("PAUSED",Object.assign(textOpt,{fontSize:120}));
        text.anchor.set(0.5,0.5);
        text.alpha = 0.75;
        text.x = this.canvasWidth/2;
        text.y = this.canvasHeight/2-30;

        this.pauseOverlay.addChild(text);

        var line = new PIXI.Graphics();
        line.alpha = 0.85;
        line.position.set(this.canvasWidth/2-243,this.canvasHeight/2+35);
        line.lineStyle(1,0xeceff1).moveTo(0,0).lineTo(468,0);
        this.pauseOverlay.addChild(line);

        text2 = new PIXI.Text(((_isMobile)?"Tap":"Click")+" to continue ",
        Object.assign(textOpt,{
            fontFamily:'TimeBurner',
            fontSize:40,
            strokeThickness:1,
            letterSpacing: 8
        }));
        text2.anchor.set(0.5,0.5);
        text2.alpha = 0.75;
        text2.x = this.canvasWidth/2-8;
        text2.y = this.canvasHeight/2+70;

        this.pauseOverlay.addChild(text2);

        //-Add Event Listener
        this.pauseOverlay.on((_isMobile)?"touchend":"mouseup",this.togglePause.bind(this,false));

        /* INFO OVERLAY */
        this.infoOverlay = new PIXI.Container();

        var rect = new PIXI.Graphics();
        rect.beginFill(0x263238,0.98)
            .drawRect(0,0,this.canvasWidth,this.canvasHeight)
        .endFill();

        this.infoOverlay.addChild(rect);

        var textOpt = {
            fontFamily: 'TimeBurnerBold',
            fill: "#cfd8dc",
            stroke: "#90a4ae",
            strokeThickness: 10,
            letterSpacing: 10,
            align: 'center',
            padding:10
        };

        var text = new PIXI.Text("INFO",Object.assign(textOpt,{fontSize:75}));
        text.anchor.set(0.5,0.5);
        text.alpha = 0.98;
        text.x = this.canvasWidth/2;
        text.y = this.canvasHeight/8;

        this.infoOverlay.addChild(text);

        var textOpt2 = {
            fontFamily: 'TimeBurner',
            fill: "#cfd8dc",
            letterSpacing: 5,
            align: 'center',
            wordWrap: true,
            wordWrapWidth: this.canvasWidth*0.6,
            padding: 10,
            fontSize: 30
        };
        var text2 = new PIXI.Text("This game was created by Samuel Leong Chee Weng\nusing PIXI.js renderer library.\n\nThe web version is available on my website at\n https://samleo8.github.io/SoaringSheep",textOpt2);
        text2.anchor.set(0.5,0);
        text2.alpha = 0.98;
        text2.x = this.canvasWidth/2;
        text2.y = this.canvasHeight/6+35;

        this.infoOverlay.addChild(text2);

        var textOpt3 = Object.assign(textOpt,{strokeThickness:7,fontSize:45});

        var text3 = new PIXI.Text("MUSIC",textOpt3);
        text3.anchor.set(0.5,0.5);
        text3.alpha = 0.98;
        text3.x = this.canvasWidth/2;
        text3.y = this.canvasHeight/2;

        this.infoOverlay.addChild(text3);

        text2 = new PIXI.Text("http://www.noiseforfun.com/\nhttp://www.playonloop.com/",textOpt2);
        text2.anchor.set(0.5,0);
        text2.alpha = 0.98;
        text2.x = this.canvasWidth/2;
        text2.y = this.canvasHeight/2+45;

        this.infoOverlay.addChild(text2);

        text3 = new PIXI.Text("SPRITES",textOpt3);
        text3.anchor.set(0.5,0);
        text3.alpha = 0.98;
        text3.x = this.canvasWidth/2;
        text3.y = this.canvasHeight/2+160;

        this.infoOverlay.addChild(text3);

        text2 = new PIXI.Text("Material Design Icons\nSpike: http://scribblenauts.wikia.com/wiki/File:Steel_Spike.png",textOpt2);
        text2.anchor.set(0.5,0);
        text2.alpha = 0.98;
        text2.x = this.canvasWidth/2;
        text2.y = this.canvasHeight/2+230;

        this.infoOverlay.addChild(text2);

        this.infoOverlay.on((_isMobile)?"touchend":"mouseup",this.showInfo.bind(this));

        this.infoOverlay.alpha = 0;

        /* PLAY GAMES MENU */
        this.playGamesMenu = new PIXI.Container();

        rect = new PIXI.Graphics();
        rect.beginFill(0x263238,0.98)
            .drawRect(0,0,this.canvasWidth,this.canvasHeight)
        .endFill();

        this.playGamesMenu.addChild(rect);

        textOpt = {
            fontFamily: 'TimeBurnerBold',
            fill: "#cfd8dc",
            stroke: "#90a4ae",
            strokeThickness: 10,
            letterSpacing: 10,
            align: 'center',
            padding:10
        };

            //Title
        text = new PIXI.Text("GOOGLE PLAY GAMES",Object.assign(textOpt,{fontSize:60}));
        text.anchor.set(0.5,0);
        text.alpha = 0.98;
        text.x = this.canvasWidth/2;
        text.y = 25;

        this.playGamesMenu.addChild(text);

        //Welcome
        textOpt2 = {
            fontFamily: 'TimeBurnerBold',
            fill: "0xcfd8dc",
            letterSpacing: 5,
            padding:10,
            align: 'center',
            fontSize: 24
        };

        this.playGamesMenu.profile = new PIXI.Container();
        var profile = this.playGamesMenu.profile;

        profile.position.set(this.canvasWidth/2,225);

        profile.welcome_text = new PIXI.Text("Welcome,",textOpt2);
        profile.player_text = new PIXI.Text("PLAYER",Object.assign(textOpt2,{fontSize:48}));

        profile.welcome_text.anchor.set(0.5,0.5);
        profile.player_text.anchor.set(0.5,0.5);

        profile.welcome_text.y -= 55;

        profile.addChild(profile.welcome_text);
        profile.addChild(profile.player_text);

        this.playGamesMenu.profile = profile;
        this.playGamesMenu.addChild(this.playGamesMenu.profile);

        //Tabs
        this.playGamesMenu.tabs = {
            "leaderboard": new PIXI.Container(),
            "achievements": new PIXI.Container(),
            //"saved_games": new PIXI.Container(),
            "logout": new PIXI.Container()
        }
        var tabsNamesArr = ["Leaderboard","Achievements",/*"Saved Games",*/"Logout"];
        var tab, _nm;

        textOpt3 = {
            fontFamily: 'TimeBurnerBold',
            fill: "0x455A64",
            letterSpacing: 5,
            padding:10,
            align: 'center',
            fontSize: 32
        };

        for(i=0;i<tabsNamesArr.length;i++){
            _nm = tabsNamesArr[i].toLowerCase().split(" ").join("_");
            tab = this.playGamesMenu.tabs[_nm];
            tab.name = _nm;

            tab.alpha = 1;

            tab._height = 350;
            tab._width = 350;
            tab._diff = 80;
            tab._marginTop = 340;
            tab._marginLeft = (this.canvasWidth-tabsNamesArr.length*tab._width)/(tabsNamesArr.length+1);

            tab.bg = new PIXI.Graphics();
            tab.bg.beginFill(0xcfd8dc,0.98)
                .drawRect(0,0,tab._width-2,tab._height)
            .endFill();

            tab.text = new PIXI.Text(tabsNamesArr[i],textOpt3);
            tab.text.anchor.set(0.5,0.5);
            tab.text.position.set(tab._width/2, tab._height-60);

            tab.icon = this.sprites.icons[_nm];
            tab.icon.anchor.set(0.5,0.5);
            tab.icon.scale.set(1.3,1.3);
            tab.icon.tint = 0x455A64;
            tab.icon.alpha = 1;
            tab.icon.position.set(tab.text.x, tab._height/2-25);

            tab.position.set(tab._marginLeft*(i+1)+tab._width*i, tab._marginTop);

            tab.addChild(tab.bg);
            tab.addChild(tab.text);
            tab.addChild(tab.icon);

            this.playGamesMenu.addChild(tab);

            tab.interactive = true;
            tab.buttonMode = true;
            tab.on((_isMobile)?"touchend":"mouseup",this.pressPlayGamesButton.bind(this,tab.name));
        }

        this.playGamesMenu.interactive = true;
        this.playGamesMenu.buttonMode = true;
        this.playGamesMenu.on((_isMobile)?"touchend":"mouseup",function(){
            this.preventHeroJump++;
        }.bind(this));
    };

	this.allAssetsLoaded = function(){
			var i;

            this.generateOverlays();

			console.log("All assets loaded.");

			this.sprites.background.alpha = 0;

			//Sheep
			sheep = new PIXI.Sprite(this.animations.jumping.frames[0]);
			sheep.anchor.set(0.5,0.5);
			sheep.scale.set(0.35,0.35);
			sheep.rotation = -Math.PI/40;
			sheep.position.set(this.canvasWidth/2-200,this.canvasHeight/2-90);

			//Speech bubble
			var speech_bubble = new PIXI.Container();
			speech_bubble.position.set(this.canvasWidth/2,this.canvasHeight*0.66);

			//-Bubble
			var bubble = new PIXI.Graphics();
			bubble._width = 600+50;
			bubble._height = 250+30;
			bubble._radius = 40;
			bubble.beginFill(0xcfd8dc)
				.drawRoundedRect(-bubble._width/2,-bubble._height/2,bubble._width,bubble._height,bubble._radius)
				.drawPolygon( new PIXI.Point(-bubble._width/2+180,-bubble._height/2-60) , new PIXI.Point(-125,-bubble._height/2), new PIXI.Point(-95,-bubble._height/2) )
			.endFill();

			//-Text
			var textOpt = {
				fontFamily: 'TimeBurner',
				fill: "#607d8b",
				letterSpacing: 2,
				align: 'center',
				fontSize:38
			};

			var text = new PIXI.Text("Avoid the falling spikes!\nScore by bouncing off the sides.\n"+((_isMobile)?"Tap":"Click/[SPACE]")+" to JUMP\n\n- JUMP to Start! -",textOpt);
			text.anchor.set(0.5,0.5);

			speech_bubble.addChild(bubble);
			speech_bubble.addChild(text);

			//Re-position mute buttons
			this.startScreen.buttonsOffset = 70;

			this.muteMusicButton.x += this.startScreen.buttonsOffset;
			this.muteFXButton.x += this.startScreen.buttonsOffset;

			this.loadOptions();

			//Fade In Animation
			this.fadeObjects = [sheep, speech_bubble, this.infoOverlay, this.playGamesMenu, this.muteMusicButton, this.muteFXButton, this.infoButton, this.gamesButton, this.webButton];
                //in order of intended z-index

			for(i=0;i<this.fadeObjects.length;i++){
				this.fadeObjects[i].alpha = 0;
				stage.addChild(this.fadeObjects[i]);
			}

            var _fadeTimeInc = 10; //ms
            this.fadeInTimer = new Date().getTime();

            //Begin fade in via requestAnimationFrame.
            //WARNING: DO NOT USE SET INTERVAL
            //--After animation is complete, user can now "jump" to start the game.
            requestAnimationFrame(this.fadeInAnimation.bind(this,_fadeTimeInc));
	}

    this.fadeInAnimation = function(timeInc){
        /*
        var t = new Date().getTime();
        if(t-this.fadeInTimer>=timeInc){
            this.fadeInTimer = t;
        }
        //*/

        var i;
        var _fadeInc = 0.025;

        for(i=0;i<this.fadeObjects.length;i++){
            if(this.fadeObjects[i] == this.infoOverlay) continue;
            if(this.fadeObjects[i] == this.playGamesMenu) continue;

            this.fadeObjects[i].alpha += _fadeInc;
        }

        renderer.render(stage);

        //Once fade in animation is complete, allow user to "jump" to start game
        if(sheep.alpha>=1){
            for(i=0;i<this.fadeObjects.length;i++){
                if(this.fadeObjects[i] == this.infoOverlay) continue;
                //if(this.fadeObjects[i] == this.playGamesMenu) continue;

                this.fadeObjects[i].alpha = 1;
            }

            this.playGamesMenu.visible = false;

            this.startScreen.interactive = true;
            this.startScreen.buttonMode = true;

            this._jumpToStartGame = true;

            renderer.render(stage);

            console.log("Ready: Jump to start!");

            this.initPlayGames();

            return;
        }

        requestAnimationFrame(this.fadeInAnimation.bind(this));
    }

	this.startGame = function(){
        var i;

		console.log("Let the games begin!");

        if(this._gameStarted) return;

		this._jumpToStartGame = false;
		this._gameStarted = true;

        //Remove start screen items
		stage.removeChild(this.startScreen);

        for(i=0;i<this.fadeObjects.length;i++){
            stage.removeChild(this.fadeObjects[i]);
        }

        //Reinstate buttons and background
        this.sprites.background.alpha = 1;
		this.muteMusicButton.x -= this.startScreen.buttonsOffset;
		this.muteFXButton.x -= this.startScreen.buttonsOffset;

        /* ADDING OBJECTS FOR ACTUAL GAME */
        //--CRITICAL PERFORMANCE BOOST: ADD ALL THE ITEMS REQUIRED FOR THE GAME ONCE.
        //--THEN RESET VARIABLES, COORDINATES ETC IN newGame()

        //BG
		this.sprites.background.scrollingSpeed = 0.5;

		//LOAD SCORES AND OPTIONS
		this.score = 0;

		var textOpt = {
			fontFamily: 'TimeBurnerBold',
			fill: "#cfd8e0",
			stroke: "#b0becf",
			strokeThickness: 10,
			letterSpacing: 10,
			align: 'center'
		};

		//-Score text
		this.scoreText =  new PIXI.Text(this.score.toString(),Object.assign(textOpt,{fontSize:120}));

		this.scoreText.alpha = 0.7;
		this.scoreText.anchor.set(0.5,0.5);
		this.scoreText.x = this.canvasWidth/2;
		this.scoreText.y = this.canvasHeight/2;

		stage.addChild(this.scoreText);

		//-Highscore text
		this.highscoreText = new PIXI.Text(this.highscore.toString(),Object.assign(textOpt,{fontSize:40}));

		this.highscoreText.alpha = 0.7;
		this.highscoreText.anchor.set(0.5,0.5);
		this.highscoreText.x = this.canvasWidth/2+89;
		this.highscoreText.y = this.canvasHeight/2+70;
		stage.addChild(this.highscoreText);

		//-"/"-symbol
		this.overSym = new PIXI.Text("/",Object.assign(textOpt,{fontSize:50}));

		this.overSym.alpha = 0.7;
		this.overSym.anchor.set(0.5,0.5);
		this.overSym.x = this.canvasWidth/2+49;
		this.overSym.y = this.canvasHeight/2+50;
		stage.addChild(this.overSym);

		//CREATE OBSTACLE CONTAINER
		this.obstacles = new PIXI.Container();
		this.showObstacleSections();

		stage.addChild(this.obstacles);

        //CREATE POWERUP CONTAINER
        this.powerups = new PIXI.Container();
        stage.addChild(this.powerups);

		//HERO INITIALIZE
		this.hero.x = this.canvasWidth/2;
		this.hero.y = this.canvasHeight/2;
		this.hero.scale.x = Math.abs(this.hero.scale.x);

		this.hero.vx = this.maxSpeed;
		this.hero.ax = 0;
		this.hero.vy = 0;
		this.hero.ay = 0.10;
		this.hero.jumpStrength = 4;

		this.preventHeroJump = 0;

        //-Hero Shield
        this.heroShield = new PIXI.Graphics();
        this.heroShield.beginFill(0xffecb3,0.6)
            .drawCircle(0,0,this.hero.width/2+30)
        .endFill();
        this.heroShield.position = this.hero.position;

        stage.addChild(this.heroShield);
		stage.addChild(this.hero);

		//ADD OVERLAYS TO STAGE
		//..GRAPHICS FOR PAUSE OVERLAY IS DONE IN INITIALISATION FOR PERFORMANCE
		//..ADDING DONE HERE FOR Z-INDEX
		this.pauseOverlay.alpha = 0;
		stage.addChild(this.pauseOverlay);

        this.infoOverlay.alpha = 0;
        stage.addChild(this.infoOverlay);

        this.playGamesMenu.alpha = 0;
        stage.addChild(this.playGamesMenu);

		//ADD BUTTONS
		//..GRAPHICS FOR BUTTONS IS DONE IN INITIALISATION FOR PERFORMANCE
		//..ADDING DONE HERE FOR Z-INDEX
		stage.addChild(this.pauseButton);
		stage.addChild(this.muteMusicButton);
		stage.addChild(this.muteFXButton);
        stage.addChild(this.infoButton);
        stage.addChild(this.gamesButton);
        stage.addChild(this.webButton);

        this.totalGamesPlayed = 0;

		this.newGame();
	}

	this.newGame = function(){
		renderer.view.focus();

        //RESET VARIABLES AND OBJECT POSITIONS
        //-Score
        this.score = 0;
        this.scoreText.text = "0";

        //-Hero
        this.hero.x = this.canvasWidth/2;
		this.hero.y = this.canvasHeight/2;
		this.hero.scale.x = Math.abs(this.hero.scale.x);

		this.hero.vx = this.maxSpeed;
		this.hero.ax = 0;
		this.hero.vy = 0;
		this.hero.ay = 0.10;
		this.hero.jumpStrength = 4;

        //--Hero's shield
        this.heroShield.position = this.hero.position;
        this.heroShield.alpha = 0;

        this.shieldTimer = null;

		this.preventHeroJump = 0;

        //-Overlays
        this.pauseOverlay.alpha = 0;
        this.infoOverlay.alpha = 0;
        this.playGamesMenu.alpha = 0;

        //-Obstacles
        var i;
		for(i=0;i<=this.nObstacleSections;i++){
			this.obstacleSectionActive[i] = false;
		}

        //-Games Played
        this.totalGamesPlayed++;

		//START UPDATE LOOP
		this._paused = false;

			//TIMERS
            this.pauseTime = {
                "obstacle":0,
                "shield":0
            };
			this.obstacleTimer = new Date().getTime();

		requestAnimationFrame(this.update.bind(this));
	};

	this.keyEvent = function(e){
		var i,j;
		for(i in this.controls){
			var keyArr = this.controls[i]["keys"];
			for(j=0;j<keyArr.length;j++){
				if(e.keyCode == keyArr[j]){
					this[this.controls[i]["callback"]]();
					break;
				}
			}
		}
	};

	this.heroJump = function(event){
		if(this.preventHeroJump){
			this.preventHeroJump--; //makes sure that all false clicks which have been triggered are accounted for
            //console.log("False click prevented: "+this.preventHeroJump);
			return;
		}

		if(this._jumpToStartGame){
			this._jumpToStartGame = false;
            //console.log("User started game by clicking. "+this._jumpToStartGame);
			this.startGame();
            return;
		}

		if(!this._gameStarted) return;

		if(this._paused) return;

		this.audio["jump"].play();

		this.hero.gotoAndPlay(1);
		this.hero.vy = -this.hero.jumpStrength;
	};

	this.update = function(){
		var i,j;

		if(this._paused || !this._gameStarted) return;

		//BACKGROUND MOVEMENT
		this.sprites.background.tilePosition.x -= this.sprites.background.scrollingSpeed;

		//HERO MOVEMENT
		this.hero.vx += this.hero.ax;
		this.hero.vy += this.hero.ay;

		this.hero.y += this.hero.vy;
		this.hero.x += this.hero.vx;

        this.heroShield.position = this.hero.position;

		//OBSTACLE MOVEMENT AND COLLISION TEST
		for(i=0;i<this.obstacles.children.length;i++){
			var obs = this.obstacles.children[i];

			//Check for hero and obstacle hitTest
			if(this.hitTest(this.hero,obs,10,10)){
                if(this.heroShield.alpha){
                    this.obstacles.removeChild(obs);
    				this.obstacleSectionActive[obs.section] = false;

                    this.powerups.removeChild(obs.attachedPowerup);
                    this.heroShield.alpha = 0;
                    this.pauseTime["shield"] = 0;
                }
                else{
                    this.gameover();
                    return;
                }
			}

			obs.vy += obs.ay;
			obs.y += obs.vy;

			if(obs.y>=this.canvasHeight+obs.height+this.powerupOffset){
				this.obstacles.removeChild(obs);
				this.obstacleSectionActive[obs.section] = false;
			}
		};

        //POWERUP MOVEMENT AND COLLISION TEST
        for(i=0;i<this.powerups.children.length;i++){
            var pwr = this.powerups.children[i];

            //Check for hero and powerup hitTest
            if(this.hitTest(this.hero,pwr,10,10)){
                switch(pwr.type){
                    case 0: //SHIELD
                        this.heroShield.alpha = 1;
                        this.shieldTimer = new Date().getTime();
                        this.audio["shield"].play();
                        break;
                    case 1: //+1
                        this.incScore();
                        break;
                }
                this.powerups.removeChild(pwr);
            }

            pwr.y = pwr.attachedObs.y-this.powerupOffset;

            if(pwr.y>=this.canvasHeight+pwr.height){
                this.powerups.removeChild(pwr);
            }
        };

		//HERO BOUNDS CHECKS
		//Check for hero x-direction bounds, and bounce off wall
		if(this.hero.x<=this.hero.width/2 || this.hero.x>=(this.canvasWidth-this.hero.width/2)){
			this.hero.vx *= -this.speedInc;

            var _dir = (this.hero.vx<0)?-1:1;

			this.hero.vx = _dir*Math.max(Math.abs(this.hero.vx),this.minSpeed);

			this.hero.scale.x *= -1;
			this.sprites.background.scrollingSpeed *= -1;

			this.incScore();
		};

		this.hero.leeway = 50;

		//Check for hero y-direction bounds, and gameover if necessary
		if(this.hero.y<=this.hero.height/2-this.hero.leeway || this.hero.y>=(this.canvasHeight-this.hero.height/2+this.hero.leeway)){
			this.gameover();
			return;
		}

		//TIMERS
			var t=new Date().getTime();
			//OBSTACLE SPAWN
			if(t-this.obstacleTimer>=this.obstacleSpawnTime+this.pauseTime["obstacle"]){
				this.spawnObstacle();
			}

            //SHIELD FADE AWAY
            if(this.heroShield.alpha && t-this.shieldTimer>=this.shieldTimeInc+this.pauseTime["shield"]){
                this.shieldTimer = t;
                this.pauseTime["shield"] = 0;

                this.heroShield.alpha = Math.max(0,this.heroShield.alpha-this.shieldFadeInc);
            }

		//RENDER AND UPDATE
		renderer.render(stage);

		requestAnimationFrame(this.update.bind(this));
	};

	this.incScore = function(){
		this.score++;
		this.scoreText.text = this.score;

		this.saveOptions();
		this.highscoreText.text = this.highscore;

		this.audio["bounce"].play();
	}

	this.showObstacleSections = function(){
		//Draw opacity rectangle to show where the obstacles will fall from
		this.obstacleSections = new PIXI.Container();

		var i;
		var tempSprite = new PIXI.Sprite(this.sprites.spike.texture);
		tempSprite.scale.set(0.2,0.2);
		var padd = 5;
		var obsSecWidth = tempSprite.width;
		var startX, endX;

		for(i=1;i<=this.nObstacleSections;i++){
            this.obstacleSectionActive[i] = false;

			var rect = new PIXI.Graphics();
			rect.beginFill(0xd3d8dc,0.3);
			startX = i*(this.canvasWidth/(this.nObstacleSections+1))-obsSecWidth/2-padd/2;

			rect.drawRect(startX,0,obsSecWidth+padd,this.canvasHeight);
			rect.endFill();

			this.obstacleSections.addChild(rect);
		}

		stage.addChild(this.obstacleSections);
	}

	this.spawnObstacle = function(){
		var i;
		var obs = new PIXI.Sprite(this.sprites.spike.texture);

		obs.anchor.set(0.5);
		obs.scale.set(0.2,-0.2);

		//Ensure obstacle does not appear twice in the section at one time.
		var hasEmptySection = false;
		for(i=1;i<this.nObstacleSections;i++){
			if(!this.obstacleSectionActive[i]){
				hasEmptySection = true;
				break;
			}
		}
		if(!hasEmptySection) return;

		//RESET TIMERS
		this.pauseTime["obstacle"] = 0;
		this.obstacleTimer = new Date().getTime();

		var section;
		var sectionFound = false;
		for(i=0;i<10;i++){ //prevent infinite loop
			section = getRandomInt(1,this.nObstacleSections);
			if(!this.obstacleSectionActive[section]){
				sectionFound = true;
				break;
			}
		}
		if(!sectionFound) return;

		obs.section = section;
		this.obstacleSectionActive[section] = true;

		var startX = section*(this.canvasWidth/(this.nObstacleSections+1));
		var startY = obs.height/2;

		obs.x = startX;
		obs.y = startY;
		obs.vy = 0;

        //Ramp up acceleration as score increases
        var _startG = 0.07;
        var _maxG = 0.20;
		obs.ay = getRandomFloat(_startG,Math.min(_startG+this.score*0.01,_maxG));

        //Spawn powerup a few pixels above the spike. It'll fall at the same speed as the spike. Not easy to attain tho...
        /* --POWERUPS--
        0: Shield
        1: +1 (to score)
        */
        var powerup;

        if(Math.random()<=this.powerupChance){
            //Add powerup
            var type = getRandomInt(0,this.powerupNames.length-1);
            var texture;

            //console.log(this.powerupNames[type].split("_").join(" ").toUpperCase()+" powerup attached to spike!");
            powerup = new PIXI.Sprite(this.sprites.powerups[this.powerupNames[type]].texture);

            powerup.scale.set(0.3,0.3);
            powerup.anchor.set(0.5);

            powerup.x = obs.x;
            powerup.y = obs.y-this.powerupOffset;

            powerup.type = type;
            powerup.attachedObs = obs;
            obs.attachedPowerup = powerup;

            this.powerups.addChild(powerup);
        }

		this.obstacles.addChild(obs);
	};

    this.appBlur = function(){
        //Turn off music otherwise it will play in the background
        if(this.audio["main_music"])
            this.audio["main_music"].pause();

        this.togglePause(true);
    }

    this.appFocus = function(){
        //Turn back on music, checking if it was playing originally
        if(!this._musicMuted){
            if(this.audio["main_music"])
                this.audio["main_music"].play();
        }
    }

    this.showInfo = function(e){
		var i,nm;

		if(typeof e == "object"){
			if(e.type=="mouseup" || e.type=="touchend"){
				this.preventHeroJump++;
			}
		}

        //Toggle the display of the info page, along with the pausing
        if(this.infoOverlay.alpha){
            this.infoOverlay.alpha = 0;

            this.infoOverlay.buttonMode = false;
            this.infoOverlay.interactive = false;

            this.togglePause(false);
        }
        else{
            this.infoOverlay.alpha = 1;

            this.infoOverlay.buttonMode = true;
            this.infoOverlay.interactive = true;

            this.togglePause(true);
        }

        //Render the stage to show the info screen
        renderer.render(stage);
	};

    this.initPlayGames = function(e){
        this.loadOptions();

        if(typeof window.plugins == "undefined"){
            this.gamesButton.alpha = 0.4;
            renderer.render(stage);
            return;
        }

        window.plugins.playGamesServices.auth(function(){
            alert("Google Play login success!");
            this.isLoggedIn = true;

            //Syncing Locally-stored and Cloud-stored scores
            window.plugins.playGamesServices.getPlayerScore({
                "leaderboardId":this.leaderboardID.toString()
            }, function(result){
                var sc = parseInt(result.playerScore);
                alert("Retrieved score: "+sc);

                if(this.highscore > sc){
                    //Send the locally-stored highscore since it's the highest
                    this.GooglePlayServices.sendScore(sc);
                }
                else if(this.highscore < sc){
                    //Locally store the Google Play highscore since it's the highest
                    this.highscore = sc;
                    this.highscoreText.text = sc;

                    this.saveOptions();
                    renderer.render(stage);
                }
                else{
                    //SCORES IN SYNC
                }
            }.bind(Game), function(){
                //Score has never been submitted before
                //Send the locally-stored highscore since it's the highest
                if(this.highscore){
                    this.GooglePlayServices.sendScore(this.highscore);
                }
            }.bind(Game));

            //Fetch and save player data
            this.GooglePlayServices.fetchPlayerData();
        }.bind(Game),function(){
            alert("Google Play login failure: "+(this.isOnline)?"Press the Play Games button to try again!":"Check your connection and try again!");

            this.isLoggedIn = false;
        }.bind(Game));

        //GPlay.init();
        renderer.render(stage);
    }

    this.pressPlayGamesButton = function(tab_name){
        var i;

        if(typeof tab_name != "string") return;

        if(this.isLoggedIn){
            if(tab_name == "leaderboard"){
                this.GooglePlayServices.showLeaderboard(this.leaderboardID.toString());
                //window.plugins.playGamesServices.showAllLeaderboards();
            }
            else if(tab_name == "achievements"){
                this.GooglePlayServices.showAchievements();
            }
            else if(tab_name == "logout"){
                window.plugins.playGamesServices.signout(function(){
                    this.isLoggedIn = false;
                    console.log("Logout successful!");
                }.bind(Game),function(){
                    console.log("Failed to logout successfully!");
                });
            }
        }
    }

    this.showPlayGamesMenu = function(e){
        var i,nm;

        if(typeof event == "object"){
            if(e.type=="mouseup" || e.type=="touchend"){
                this.preventHeroJump++;
            }
        }

        if((typeof window.plugins != "undefined") && !this.isLoggedIn){
            this.initPlayGames();
        }

        //Toggle the display of the info page, along with the pausing
        if(!this.playGamesMenu.visible){
            if(!this.isOnline) return;
            if(typeof window.plugins == "undefined"){
                this.togglePause(true);

                if(confirm("Google Play Games is only supported in the Mobile App! Click 'OK' to be redirected to the Google Play Store. Cancel otherwise.")){
                    this.gotoURL("https://play.google.com/store/apps/details?id=io.samleo8.SoaringSheep");
                }

                return;
            }

            /*
            //If we are not logged in, or games API is not working, reinit, but don't show menu.

            if(!GPlay.isLoggedIn()){
                GPlay.init();
                return;
            }
            if(!GPlay.isGamesAPILoaded()){
                GPlay.initGamesAPI();
                return;
            }
            //*/

            //Make menu appear, and pause game
            this.playGamesMenu.alpha = 1;
            this.playGamesMenu.visible = true;

            this.playGamesMenu.profile.player_text.text = this.GooglePlayServices.player.name;

            //this.pressPlayGamesButton("leaderboard");

            this.togglePause(true);
        }
        else{
            this.playGamesMenu.alpha = 0;
            this.playGamesMenu.visible = false;
            //this.togglePause(false);
        }

        //Render the stage to show the info screen
        renderer.render(stage);
    };

    /*
    this.showHighscoreTable = function(response){
        var data = response.result;
        var playerData = {};
        var leaderboardItems = data.numScore;
        var leaderboardData = data.items;

        console.log(data);

        playerData.highscore = data.playerScore.scoreValue;
        playerData.name = data.playerScore.player.displayName;
        playerData.games_id = data.playerScore.player.playerId;

        console.log("Player Data: ", playerData);

        console.log("Leaderboard items: ",leaderboardItems);
        console.log("Leaderboard Data: ", leaderboardData);
    }
    //*/

	this.toggleMuteMain = function(forcedVal){
		if(typeof forcedVal == "object"){
			if(forcedVal.type=="mouseup" || forcedVal.type=="touchend"){
				this.preventHeroJump++;
			}
		}

		if(typeof forcedVal == "boolean"){
			if(this._musicMuted == forcedVal) return;

			this._musicMuted = !forcedVal;
		}

		if(this._musicMuted){
			this.muteMusicButton.getChildByName("music_off").alpha=0;
			this.muteMusicButton.getChildByName("music_on").alpha=1;
			renderer.render(stage);

			this.audio["main_music"].play();

			this._musicMuted = false;
		}
		else{
			this.muteMusicButton.getChildByName("music_off").alpha=1;
			this.muteMusicButton.getChildByName("music_on").alpha=0;
			renderer.render(stage);

			this.audio["main_music"].pause();

			this._musicMuted = true;
		}

		this.saveOptions("muteMain");
		console.log("BG Music "+((this._musicMuted)?"Muted":"Playing"));
	};

	this.toggleMuteFX = function(forcedVal){
		var i,nm;

		if(typeof forcedVal == "object"){
			if(forcedVal.type=="mouseup" || forcedVal.type=="touchend"){
				this.preventHeroJump++;
			}
		}

		if(typeof forcedVal == "boolean"){
			if(this._FXMuted == forcedVal) return;

			this._FXMuted = !forcedVal;
		}

		if(this._FXMuted){
			this.muteFXButton.getChildByName("fx_off").alpha=0;
			this.muteFXButton.getChildByName("fx_on").alpha=1;
			renderer.render(stage);

			for(i=0;i<this.audioLib.length;i++){
				nm = this.audioLib[i];
				if(nm == "main_music") continue;

				this.audio[nm].volume = this.audio[nm].defaultVolume;
			}

			this._FXMuted = false;
		}
		else{
			this.muteFXButton.getChildByName("fx_off").alpha=1;
			this.muteFXButton.getChildByName("fx_on").alpha=0;
			renderer.render(stage);

			for(i=0;i<this.audioLib.length;i++){
				nm = this.audioLib[i];
				if(nm == "main_music") continue;

				this.audio[nm].volume = 0;
			}

			this._FXMuted = true;
		}

		this.saveOptions("muteFX");
		console.log("BG Music "+((this._FXMuted)?"Muted":"Playing"));
	};

	this.togglePause = function(forcedVal,event){
        var i;

		if(!this._gameStarted) return;

		if(typeof event == "object" || typeof forcedVal == "object"){
			e = (typeof event == "object")?event:forcedVal; //sometimes `forcedVal` is the `event`
			if(e.type=="mouseup" || e.type=="touchend"){
				this.preventHeroJump++;
			}
		}

		if(typeof forcedVal == "boolean"){
			if(this._paused == forcedVal) return;

			this._paused = !forcedVal;
		}

		if(this._paused){
            this.infoOverlay.alpha = 0;
            this.infoOverlay.buttonMode = false;
            this.infoOverlay.interactive = false;

			this.pauseOverlay.alpha = 0;
			this.pauseOverlay.interactive = false;
			this.pauseOverlay.buttonMode = false;

            this.playGamesMenu.alpha = 0;
            this.playGamesMenu.visible = false;

			this.pauseButton.getChildByName("pause").alpha=1;
			this.pauseButton.getChildByName("play").alpha=0;

            for(i=0;i<this.pauseTime.length;i++){
			    this.pauseTime[i] += (new Date().getTime())-this.pauseTimer;
            }
			this._paused = false;

			requestAnimationFrame(this.update.bind(this));
		}
		else{
			this.pauseOverlay.alpha = 1;
			this.pauseOverlay.interactive = true;
			this.pauseOverlay.buttonMode = true;

			this.pauseButton.getChildByName("pause").alpha=0;
			this.pauseButton.getChildByName("play").alpha=1;

			renderer.render(stage);

			this.pauseTimer = new Date().getTime();
			this._paused = true;
		}

		console.log("Game "+((this._paused)?"Paused":"Resumed"));
	};

	this.gameover = function(){
		this._paused = true;
		this.audio["die"].play();

        //SEND HIGHSCORE IF PLAY GAMES AVAILABLE
        if(this.isLoggedIn){
            var sc = this.score;
            this.GooglePlayServices.sendScore(sc);
        }

		console.log("GAME OVER!\nScore: "+this.score+"\nHighscore: "+this.highscore+"\n");

        //CLEAR OBSTACLES
        var i;
        for(i=this.obstacles.children.length-1;i>=0;i--){
            this.obstacles.removeChild(this.obstacles.children[i]);
        }

        //CLEAR POWERUPS
        for(i=this.powerups.children.length-1;i>=0;i--){
            this.powerups.removeChild(this.powerups.children[i]);
        }

        /*
        if(this.isOnline && GPlay.isLoggedIn() && GPlay.isGamesAPILoaded()){
            GPlay.sendScore(this.score, "highscore");
        }
        */

		//RESTART GAME
		this.newGame();
	};

	this.loadOptions = function(){
		if(window.localStorage){
			if(window.localStorage["muteFX"] != null){
				this.highscore = window.localStorage["highscore"];

				this.toggleMuteFX(parseBoolean(window.localStorage["muteFX"]));
				this.toggleMuteMain(parseBoolean(window.localStorage["muteMain"]));
			}
			else{
				this.highscore = 0;
				this.toggleMuteFX(parseBoolean(this.defOptions["muteFX"]));
				this.toggleMuteMain(parseBoolean(this.defOptions["muteMain"]));
			}
		}
		else{
			console.log("WARNING: Browser does not support localStorage! Highscores and options will not be saved.");
			return false;
		}
	};

	this.saveOptions = function(opt){
		if(opt==null || typeof opt=="undefined"){
			opt = "all";
		}

		if(window.localStorage){
			this.highscore = Math.max(this.score,this.highscore);

			if(opt=="all" || opt=="score") window.localStorage["highscore"] = this.highscore;

			if(opt=="all" || opt=="muteFX") window.localStorage["muteFX"] = this._FXMuted;
			if(opt=="all" || opt=="muteMain") window.localStorage["muteMain"] = this._musicMuted;
		}
		else{
			console.log("WARNING: Browser does not support localStorage! Highscores and options will not be saved.");
			return false;
		}
	};

    this.GooglePlayServices = {
        "player":{
            "id":"",
            "name":"UNKNOWN",
            "title":"-",
            "iconURL":""
        },
        "fetchPlayerData": function(){
            var _self = this;
            window.plugins.playGamesServices.showPlayer( function(data){
                this.player.name = data['displayName'];
                this.player.id = data['playerId'];
                this.player.title = data['title'];
                this.player.iconURL = data['hiResIconImageUrl'];
            }.bind(_self));
        },

        "sendScore": function(score, leaderboardID){
                if(typeof score == "undefined" || score == null) return;

                if(typeof leaderboardID == "undefined" || leaderboardID == null){
                    leaderboardID = this.leaderboardID.toString();
                }

                var data = {
                    "score": parseInt(score),
                    "leaderboardId": leaderboardID
                };

                window.plugins.playGamesServices.submitScoreNow(data,function(){
                    alert("Score of "+score+" submitted to Google Play leaderboard  "+leaderboardID+"!");
                }.bind(Game),function(){
                    alert("Failure to submit score to Google Play!");
                });
        },
        "showLeaderboard": function(id){
            if(typeof id == "undefined" || id == null || id.toString().toUpperCase()=="ALL"){               window.plugins.playGamesServices.showAllLeaderboards();
            }
            else{
                var data = {
                    "leaderboardId": id
                }
                window.plugins.playGamesServices.showLeaderboard(data);
            }
        },

        "unlockAchievement": function(achievementName,num){
            if(typeof achievementName == "undefined" || achievementName == null){
                return;
            }
            if(typeof num == "undefined" || num == null){
                num = 0;
            }

            var achData = this.achievements.single[achievementName][num];
            var achievementID = achData.id;

            var data = {
                    "achievementId": achievementID.toString()
            }

            window.plugins.playGamesServices.unlockAchievement(data);
        },
        "incrementAchievement": function(achievementName, steps){
            if(typeof achievementName == "undefined" || achievementName == null){
                return;
            }
            if(typeof num == "undefined" || num == null){
                num = 0;
            }
            if(typeof steps == "undefined" || steps == null){
                steps = 1;
            }

            var achData = this.achievements.single[achievementName][num];
            var achievementID = achData.id;

            var data = {
                    "achievementId": achievementID.toString(),
                    "numSteps": steps
            }

            window.plugins.playGamesServices.incrementAchievement(data);
        },
        "showAchievements": function(){
            window.plugins.playGamesServices.showAchievements();
        }
    }

	this.hitTest = function(obj1, obj2, leewayX, leewayY){
		//Ensure both objects anchor points are centered
		var an1 = obj1.anchor;
		var an2 = obj2.anchor;

		obj1.anchor.set(0.5); obj2.anchor.set(0.5);

		if(Math.abs(obj1.x-obj2.x)<=(obj1.width+obj2.width-leewayX)/2 && Math.abs(obj1.y-obj2.y)<=(obj1.height+obj2.height-leewayY)/2){
			//obj1.anchor = an1; obj2.anchor = an2;
			return true;
		}
		else{
			//obj1.anchor = an1; obj2.anchor = an2;
			return false;
		}
	};

	this.resizeCanvas = function(){
		// Determine which screen dimension is most constrained
		this.ratio = Math.min(
			window.innerWidth/this.canvasWidth,
			window.innerHeight/this.canvasHeight
		);

		// Scale the view appropriately to fill that dimension
		stage.scale.x =	this.ratio;
		stage.scale.y = this.ratio;

		// Update the renderer dimensions
		//this.canvasWidth *= this.ratio;
		//this.canvasHeight *= this.ratio;

		renderer.resize(
			Math.ceil(this.canvasWidth * this.ratio),
			Math.ceil(this.canvasHeight * this.ratio)
		);

		renderer.render(stage);
	};

    this.gotoURL = function(url,e){
        if(typeof e == "object"){
			if(e.type=="mouseup" || e.type=="touchend"){
				this.preventHeroJump++;
			}
		}

        if(isApp()){
            if(device.platform.toUpperCase() === 'ANDROID') {
                navigator.app.loadUrl(url, { openExternal: true });
            }
            else if (device.platform.toUpperCase() === 'IOS') {
                window.open(url, '_system');
            }
        }
        else{
            window.open(url, '_blank');
        }
    }
}

//*-------GOOGLE PLAY SERVICES--------*//


//SCORES SENDING FOR CLIENT-ONLY GAMES DOESN'T WORK
//HOWEVER, CAN STILL USE THIS TO SAVE HIGHSCORES

/*
var GooglePlayServices = function(){
    this.client_id = {
        "android":"514509972850-9cdi9qajgltk7foscdns8jf1ffe83go6.apps.googleusercontent.com",
        "web":"514509972850-jma6151g1177bolmfpi9a150dbm7atr3.apps.googleusercontent.com",
        "web_test":"514509972850-nkv4v47360fp75rmbiubld0lq0kp078e.apps.googleusercontent.com"
    }

    this.noConnection = false;

    this.GoogleAuth;

    this.scoresList;

    //General Functions (Login, Logout, Init)
    this.init = function(login){
        if(login==null || typeof login == "undefined"){
            login = true;
        }

        if(gapi == null || typeof gapi == "undefined"){
            //Likely internet connection lost
            console.log("Bad internet connection: Cannot connect to Google API!");
            this.noConnection = true;
            return;
        }

        gapi.load('auth2', function(){
            // Retrieve the singleton for the GoogleAuth library and set up the client.
            var initOptions = {
              "client_id":
              //this.client_id["web_test"]
              this.client_id[(isApp())?"android":"web"]
            }

            gapi.auth2.init(initOptions).then(
                this.login.bind(this),
                this.onError.bind(this)
            );
        }.bind(this));
    }

    this.login = function(){
        if(this.noConnection) return;

        console.log("Logging into Google Play Games...");

        this.GoogleAuth = gapi.auth2.getAuthInstance();

        this.GoogleAuth.signIn().then(
            this.initGamesAPI.bind(this),
            this.onError.bind(this)
        );
    }

    this.logout = function(){
        game.playGamesMenu.alpha = 0;

        if(this.noConnection) return;

        this.GoogleAuth.signOut().then(function(){
            console.log("Signed Out!");
        }, this.onError.bind(this));

        this.GoogleAuth = null;
    }

    this.isLoggedIn = function(){
        if(this.noConnection) return false;

        if(this.GoogleAuth == null) return false;

        return this.GoogleAuth.isSignedIn.get();
    }

    //Play Games
    this.initGamesAPI = function(){
        if(this.noConnection) return;

        var self = this;

        gapi.client.load('games','v1', function(response){
            console.log("Play Games API Ready!");
        });
    }

    this.isGamesAPILoaded = function(){
        if(this.noConnection) return false;
        return !(gapi.client.games == null || typeof gapi.client.games == "undefined");
    }

    //-Scores
    this.leaderboards = {
        "highscore": "CgkI8sq82fwOEAIQAg" //leaderboardID
    }

    this.sendScore = function(score, leaderboard_name){
        if(this.noConnection) return;

        var self = this;

        if(score == null || typeof score == "undefined") return;
        if(leaderboard_name == null || typeof leaderboard_name == "undefined"){
            leaderboard_name = "highscore";
        }

        gapi.client.games.scores.submit({
            "leaderboardId": self.leaderboards[leaderboard_name],
            "score": score
        }).execute(function(response){
            console.log(response);
        });
    }

    this.getScores = function(leaderboard_name, type){
        if(this.noConnection) return;

        var self = this;

        if(leaderboard_name == null || typeof leaderboard_name == "undefined"){
            leaderboard_name = "highscore";
        }
        if(type == null || typeof type == "undefined"){
            type = "PUBLIC";
        }

        console.log("Retrieving "+type+" scores from "+leaderboard_name.toUpperCase()+" leaderboard");

        gapi.client.games.scores.list({
            "leaderboardId": self.leaderboards[leaderboard_name],
            "timeSpan": "ALL_TIME",
            "collection": type,
            "maxResults": 10
        }).then( function(response) {
                game.showHighscoreTable(response);
            },
            this.onError.bind(this)
        );
    }

    //-Achievements
    //TODO: achievements

    //Error Handling
    this.onError = function(error){
        var errorCodes = {
            "initialization":[
                "idpiframe_initialization_failed",
                "access_denied",
                "immediate_failed",
                "popup_closed_by_user"
            ]
        }

        console.error("Google Play Error ("+error.error+"):\n"+error.details);
    }
}
//*/

//*--------UNIVERSAL FUNCTIONS--------*//
function isApp(){
    if(_isApp == true) return true;

    return _isApp = (forceIsApp || (typeof device) != "undefined");
}

function isAndroid(try_anyway){
    if(_isAndroid!=null && !try_anyway) return _isAndroid;
    else return _isAndroid=(isApp() && (device.platform.toUpperCase() === 'ANDROID'));
}

function MobileCheck() {
	if(isApp()) return true;

	var check = false;
	(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
	return check;
};

function MobileAndTabletCheck() {
	if(isApp()) return true;

	var check = false;
	(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
	return check;
};

function getRandomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function parseBoolean(str){
	return (str.toString().toLowerCase() == "true");
}

//INITIALIZE APP
app.initialize();
