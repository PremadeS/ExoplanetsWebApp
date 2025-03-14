import Phaser from 'phaser';

import LoginScene from './scenes/LogInScene';
import PlanetDetailScene from './scenes/PlanetDetailScene';
import SignUpScene from './scenes/SignUpScene';
import UpgradesScene from './scenes/UpgradesScene';

class MainScene extends Phaser.Scene {
  constructor() {
    super({key : 'MainScene'});
  }

  init(data) {
    this.username = data.name;
    this.level = data.level;
    this.spaceship_level = data.spaceship_level;
    this.score = data.score;
  }

  preload() {
    this.load.image('spaceship', 'assets/ship/spaceship.png');
    this.load.image('spaceshipmove', 'assets/ship/spaceshipmove.png');
    this.load.image('background', 'assets/bg/bgtile.png');
    this.load.image('quiz', 'assets/bg/quiz.jpg');
    this.load.image('quiz2', 'assets/bg/quiz2.jpg');

    fetchPlanets(this);
  }

  create() {

    this.add.text(this.scale.width / 2 - 100, 20, `Score = ${this.score}`, {
              fontSize : '40px',
              fill : '#fff'
            })
        .setDepth(15);

    this.cameras.main.fadeIn(250, 0, 0, 0);
    background = this.add.tileSprite(0, 0, config.width, config.height, 'background');
    background.setOrigin(0, 0);

    spaceship = this.physics.add.sprite(this.scale.width / 2, this.scale.height / 2, 'spaceship');
    spaceship.setDepth(10);
    spaceship.setDrag(200);
    spaceship.setScale(0.5);
    spaceship.setTint(0x999999);

    this.statsButton = this.add.text(25, 80, 'Stats', {
                                 fontSize : '30px',
                                 fill : '#00ff00',
                                 fontFamily : 'Courier',
                                 backgroundColor : '#000',
                                 padding : {x : 10, y : 5},
                                 fixedWidth : 110
                               })
                           .setOrigin(0, 1)
                           .setInteractive()
                           .setDepth(10);

    this.statsButton.on('pointerover', () => {
      this.statsButton.setStyle({fill : '#ff0000', backgroundColor : '#111'});
    });
    this.statsButton.on('pointerout', () => {
      this.statsButton.setStyle({fill : '#00ff00', backgroundColor : '#000'});
    });

    this.statsButton.on('pointerdown', () => {
      this.toggleBox();
    });

    this.upgrades = this.add.text(this.scale.width - 160, 80, 'Upgrade', {
                              fontSize : '30px',
                              fill : '#00ff00',
                              fontFamily : 'Courier',
                              backgroundColor : '#000',
                              padding : {x : 10, y : 5},
                              fixedWidth : 145
                            })
                        .setOrigin(0, 1)
                        .setInteractive()
                        .setDepth(10);

    this.upgrades.on('pointerover', () => {
      this.upgrades.setStyle({fill : '#ff0000', backgroundColor : '#111'});
    });
    this.upgrades.on('pointerout', () => {
      this.upgrades.setStyle({fill : '#00ff00', backgroundColor : '#000'});
    });

    this.upgrades.on('pointerdown', () => {
      this.cameras.main.fadeOut(250, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('UpgradesScene', {
          username : this.username,
          level : this.level,
          spaceship_level : this.spaceship_level,
          score : this.score,
        });
      });
    });

    this.boxVisible = false;
    this.box = this.add.graphics({fillStyle : {color : 0x000000}});
    this.box.fillRect(100, 100, 400, 200);

    this.textContainer = this.add.container(100, 100);

    var usernameText = this.add.text(10, 10, 'Username: ' + this.username, {fontSize : '24px', fill : '#fff'});
    var levelText = this.add.text(10, 40, 'Level: ' + this.level, {fontSize : '24px', fill : '#fff'});
    var scoreText = this.add.text(10, 70, 'Score: ' + this.score, {fontSize : '24px', fill : '#fff'});
    var spaceshipLevelText = this.add.text(10, 100, 'Spaceship Level: ' + this.spaceship_level, {fontSize : '24px', fill : '#fff'});

    this.textContainer.add([ usernameText, levelText, scoreText, spaceshipLevelText ]);

    this.box.setAlpha(0);
    this.box.setDepth(9);
    this.textContainer.setAlpha(0);
    this.textContainer.setDepth(9);

    cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.addKeys('W,A,S,D');

    planets = this.physics.add.group();

    this.cameras.main.startFollow(spaceship, true, 0.05, 0.05);
    this.cameras.main.setZoom(1);

    this.spawnRandomPlanet();

    window.addEventListener('resize', () => resizeGame(this));
  }
  update() {
    let targetSpeedX = 0;
    let targetSpeedY = 0;
    let isMoving = false;

    if (this.input.keyboard.keys[87].isDown) {
      targetSpeedY = -slowMoveSpeed;
      isMoving = true;
    }
    if (this.input.keyboard.keys[83].isDown) {
      targetSpeedY = slowMoveSpeed;
      isMoving = true;
    }
    if (this.input.keyboard.keys[65].isDown) {
      targetSpeedX = -slowMoveSpeed;
      isMoving = true;
    }
    if (this.input.keyboard.keys[68].isDown) {
      targetSpeedX = slowMoveSpeed;
      isMoving = true;
    }

    const speedThreshold = 0.05;
    currentSpeedX = Phaser.Math.Interpolation.Linear([ currentSpeedX, targetSpeedX ], acceleration);
    currentSpeedY = Phaser.Math.Interpolation.Linear([ currentSpeedY, targetSpeedY ], acceleration);

    if (Math.abs(currentSpeedX) < speedThreshold)
      currentSpeedX = 0;
    if (Math.abs(currentSpeedY) < speedThreshold)
      currentSpeedY = 0;

    background.tilePositionX += (currentSpeedX * 6) + 0.5;
    background.tilePositionY += (currentSpeedY * 6);

    if (isMoving) {
      spaceship.setVelocity(currentSpeedX * 2, currentSpeedY * 2);

      const desiredAngle = Phaser.Math.Angle.Between(0, 0, currentSpeedX, currentSpeedY);
      const currentAngle = spaceship.rotation;

      let angleDiff = desiredAngle - currentAngle;
      angleDiff = Phaser.Math.Angle.Wrap(angleDiff);

      const smoothAngle = currentAngle + angleDiff * 0.1;
      spaceship.setRotation(smoothAngle);

      if (decelerationTween) {
        decelerationTween.stop();
        decelerationTween = null;
      }

      if (spaceship.texture.key !== 'spaceshipmove') {
        spaceship.setTexture('spaceshipmove');
      }
    } else {
      if (!decelerationTween && (spaceship.body.velocity.x !== 0 || spaceship.body.velocity.y !== 0)) {
        decelerationTween = this.tweens.add({
          targets : spaceship.body.velocity,
          x : 0,
          y : 0,
          ease : 'Power2',
          duration : 800,
          onComplete : () => {
            spaceship.setVelocity(0, 0);
            decelerationTween = null;
          }
        });
      }
      if (spaceship.texture.key !== 'spaceship') {
        spaceship.setTexture('spaceship');
      }
    }

    planets.children.each(planet => {
      planet.x -= (currentSpeedX * planetMoveSpeed) / slowMoveSpeed;
      planet.y -= (currentSpeedY * planetMoveSpeed) / slowMoveSpeed;

      const distance = Phaser.Math.Distance.Between(spaceship.x, spaceship.y, planet.x, planet.y);
      if (distance < 150 && planet.scale === planet.initialScale) {
        if (!planet.isGrown) {
          smoothScale(planet, planet.initialScale + 0.2, 250);
          changeColor(planet, false);
          planet.isGrown = true;
          planet.isShrunk = false;
        }
      } else if (distance >= 150 && planet.scale > planet.initialScale) {
        if (!planet.isShrunk) {
          smoothScale(planet, planet.initialScale, 250);
          changeColor(planet, true);
          planet.isShrunk = true;
          planet.isGrown = false;
        }
      }

      if (planet.x < -planet.width || planet.x > config.width + planet.width ||
          planet.y < -planet.height || planet.y > config.height + planet.height) {
        planet.destroy();
      }
    });

    if (Phaser.Math.Between(0, 100) > 77 && isMoving) {
      this.spawnRandomPlanet();
    }
  }

  spawnRandomPlanet() {
    let x, y;
    let overlap = true;
    let limit = 0;

    while (overlap && limit < 5) {
      if (Phaser.Math.Between(0, 1)) {
        x = Phaser.Math.Between(-planetSpawnDistance - 800, config.width + planetSpawnDistance);
        y = Phaser.Math.Between(-planetSpawnDistance - 800, 0);
      } else {
        x = Phaser.Math.Between(-planetSpawnDistance - 800, config.width + planetSpawnDistance + 800);
        y = Phaser.Math.Between(config.height, config.height + planetSpawnDistance + 800);
      }

      overlap = false;

      planets.children.each(planet => {
        let distance = Phaser.Math.Distance.Between(x, y, planet.x, planet.y);
        if (distance < planet.width + planet.mass / 10) {
          overlap = true;
        }
      });

      ++limit;
    }

    let planetId = Phaser.Math.Between(1, totalPlanetTypes);

    let planet = planets.create(x, y, `planet${planetId}`);
    planet.id = planetId;
    planet.name = planetData[planetId - 1].name;
    planet.type = planetData[planetId - 1].type;
    planet.distance_from_earth = planetData[planetId - 1].distance_from_earth;
    planet.discovery_year = planetData[planetId - 1].discovery_year;
    planet.mass = planetData[planetId - 1].mass;
    planet.radius = planetData[planetId - 1].radius;

    planet.setScale(planet.radius);
    planet.initialScale = planet.radius;
    planet.setDepth(5);
    planet.setTint(0x333333);

    planet.setInteractive();
    planet.on('pointerdown', () => {
      const distance = Phaser.Math.Distance.Between(spaceship.x, spaceship.y, planet.x, planet.y);
      if (distance < 150) {
        this.cameras.main.fadeOut(250, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('PlanetDetailScene', {
            id : planet.id,
            name : planet.name,
            type : planet.type,
            mass : planet.mass,
            radius : planet.radius,
            discovery_year : planet.discovery_year,
            distance_from_earth : planet.distance_from_earth,
          });
        });
      }
    });
  }
  toggleBox() {
    if (!this.boxVisible) {
      this.tweens.add({
        targets : [ this.box, this.textContainer, this.closeButton ],
        alpha : 1,
        ease : 'Cubic.easeIn',
        duration : 500
      });
      this.boxVisible = true;
    } else {
      this.closeBox();
    }
  }

  closeBox() {
    this.tweens.add({
      targets : [ this.box, this.textContainer, this.closeButton ],
      alpha : 0,
      ease : 'Cubic.easeOut',
      duration : 500
    });
    this.boxVisible = false;
  }
}

const config = {
  type : Phaser.AUTO,
  width : window.innerWidth,
  height : window.innerHeight,
  physics : {
    default : 'arcade',
    arcade : {
      gravity : {y : 0},
      debug : false
    }
  },
  scale : {
    mode : Phaser.Scale.FIT,
    autoCentre : Phaser.Scale.CENTER_BOTH
  },
  scene : [ MainScene, PlanetDetailScene, LoginScene, UpgradesScene, SignUpScene ]
};

let currentSpeedX = 0;
let currentSpeedY = 0;
const acceleration = 0.05;

const slowMoveSpeed = 1.5;
let easingTween;
let decelerationTween;

let spaceship;
let cursors;
let background;
let rotationTween;
let planets;
const planetMoveSpeed = 5;
const planetSpawnDistance = 800;
const game = new Phaser.Game(config);

let planetData;
let totalPlanetTypes;

async function fetchPlanets(scene) {
  try {
    const response = await fetch('http://localhost:3000/planets');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    planetData = await response.json();
    totalPlanetTypes = planetData.length;

    planetData.forEach(planet => {
      const url = planet.imageUrl;
      scene.load.image(`planet${planet.id}`, url);
    });

  } catch (error) {
    console.error('Error fetching planets:', error);
  }
}

function resizeGame(scene) {

  game.scale.resize(window.innerWidth, window.innerHeight);

  background.setSize(window.innerWidth, window.innerHeight);
}

function smoothScale(planet, targetScale, duration) {
  const initialScale = planet.scale;
  const scaleChange = targetScale - initialScale;
  const frameDuration = 16.67;
  const totalFrames = Math.floor(duration / frameDuration);
  let currentFrame = 0;

  const easeOut = (t) => {
    return 1 - Math.pow(1 - t, 2);
  };

  const scalePlanet = () => {
    if (currentFrame < totalFrames) {
      currentFrame++;
      const t = currentFrame / totalFrames;
      const easedT = easeOut(t);
      const newScale = initialScale + (scaleChange * easedT);
      planet.setScale(newScale);
      requestAnimationFrame(scalePlanet);
    } else {
      planet.setScale(targetScale);
    }
  };

  scalePlanet();
}

function changeColor(planet, setTint) {
  const fadeDuration = 250;
  const fadeFrames = Math.floor(fadeDuration / 16.67);

  if (!planet.isFadingIn)
    planet.isFadingIn = false;
  if (!planet.isFadingOut)
    planet.isFadingOut = false;

  if (setTint) {

    if (!planet.isFadingIn && !planet.isFadingOut) {
      planet.isFadingIn = true;
      let currentFrame = 0;

      const fadeIn = () => {
        if (currentFrame < fadeFrames) {
          currentFrame++;
          const tintColor = Phaser.Display.Color.Interpolate.ColorWithColor({r : 255, g : 255, b : 255}, {r : 51, g : 51, b : 51},
              fadeFrames,
              currentFrame);
          planet.setTint(Phaser.Display.Color.GetColor(tintColor.r, tintColor.g, tintColor.b));
          requestAnimationFrame(fadeIn);
        } else {
          planet.setTint(0x333333);
          planet.isFadingIn = false;
        }
      };
      fadeIn();
    }
  } else {

    if (!planet.isFadingOut && !planet.isFadingIn) {
      planet.isFadingOut = true;
      let currentFrame = 0;

      const fadeOut = () => {
        if (currentFrame < fadeFrames) {
          currentFrame++;
          const tintColor = Phaser.Display.Color.Interpolate.ColorWithColor({r : 51, g : 51, b : 51}, {r : 255, g : 255, b : 255},
              fadeFrames,
              currentFrame);
          planet.setTint(Phaser.Display.Color.GetColor(tintColor.r, tintColor.g, tintColor.b));
          requestAnimationFrame(fadeOut);
        } else {
          planet.clearTint();
          planet.isFadingOut = false;
        }
      };
      fadeOut();
    }
  }
}

game.scene.start('LoginScene');