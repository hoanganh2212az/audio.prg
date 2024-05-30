import { gameStarted, setGameStarted } from './buttons.js';

let scene, camera, renderer, ship, bullets = [], enemies = [], Ammos = [], healthPickups = [], stars = [];
let shipSpeed = 0.1, bulletSpeed = 1, enemySpeed = 0.1, lastBulletTime = 0, lastEnemyTime = 0, lastAmmoTime = 0, lastHealthPickupTime = 0;
let bulletInterval = 0.2; // Firing rate interval (in seconds)
let enemySpawnInterval = 1; // Initial enemy spawn interval (in seconds)
let enemySpeedIncreaseInterval = 10; // Interval for increasing enemy speed (in seconds)
let enemySpawnDecreaseInterval = 10; // Interval for decreasing enemy spawn interval (in seconds)
let clock = new THREE.Clock(), keys = {};
let gameOver = false, score = 10;
let health = 10; // Initial health
let explosions = []; // Declare explosions array here

let shakeDuration = 0;
let shakeIntensity = 0;

const MAX_ENEMY_SPEED = 0.5;

const shotSound = new Audio('sound/shot.mp3');
const losingSound = new Audio('sound/losing.mp3');
const ammoCrateSound = new Audio('sound/ammo_crate.mp3');
const explodeSound = new Audio('sound/explode.mp3');
const outOfAmmoSound = new Audio('sound/out_of_ammo.mp3');
const healthPickupSound = new Audio('sound/health.mp3');
const crashSound = new Audio('sound/crash.mp3');

// Initialize global volume settings
window.shotSoundVolume = 1.0;
window.explodeSoundVolume = 1.0;

function startGame() {
    setGameStarted(true);
    document.getElementById('buttons').style.display = 'none';
    init();
    updateScore();
    animate();
}

class Explosion {
    constructor(position) {
        this.particles = [];
        this.lifetime = 0.5; // Lifetime of the explosion in seconds
        this.startTime = clock.getElapsedTime();

        const particleGeometry = new THREE.SphereGeometry(0.05, 16, 16);
        const particleMaterial = new THREE.MeshBasicMaterial({ color: 0xffa500 });

        for (let i = 0; i < 20; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(position);
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            );
            scene.add(particle);
            this.particles.push(particle);
        }
    }

    update() {
        const elapsed = clock.getElapsedTime() - this.startTime;
        if (elapsed > this.lifetime) {
            this.particles.forEach(particle => scene.remove(particle));
            return false;
        }

        this.particles.forEach(particle => {
            particle.position.add(particle.velocity.clone().multiplyScalar(0.1));
            particle.material.opacity = 1 - (elapsed / this.lifetime);
        });

        return true;
    }
}

function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer();
    resizeCanvas();
    document.body.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);

    // Ship
    const shipGeometry = new THREE.BoxGeometry(1, 1, 1);
    const shipMaterial = new THREE.MeshBasicMaterial({color: 0x00ff00});
    ship = new THREE.Mesh(shipGeometry, shipMaterial);
    ship.position.z = -5;
    scene.add(ship);

    // Starfield
    createStarfield();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Event listeners for movement
    document.addEventListener('keydown', onDocumentKeyDown);
    document.addEventListener('keyup', onDocumentKeyUp);

    // Create warning message element
    const warningElement = document.createElement('div');
    warningElement.id = 'warning';
    warningElement.style.position = 'absolute';
    warningElement.style.bottom = '20px';
    warningElement.style.left = '50%';
    warningElement.style.transform = 'translateX(-50%)';
    warningElement.style.padding = '10px';
    warningElement.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
    warningElement.style.color = 'white';
    warningElement.style.fontSize = '18px';
    warningElement.style.borderRadius = '10px';
    warningElement.style.display = 'none';
    warningElement.style.zIndex = '1000';
    warningElement.innerText = 'OUT OF AMMO';
    document.body.appendChild(warningElement);
}

function onDocumentKeyDown(event) {
    if (!gameStarted) return; // Prevent movement if game is not started
    keys[event.key] = true;
}

function onDocumentKeyUp(event) {
    if (!gameStarted) return; // Prevent movement if game is not started
    keys[event.key] = false;
}

function createBullet() {
    if (score > 0) {
        const bulletGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.5);
        const bulletMaterial = new THREE.MeshBasicMaterial({color: 0xff0000});
        const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
        bullet.position.set(ship.position.x, ship.position.y, ship.position.z - 1);
        bullets.push(bullet);
        scene.add(bullet);

        // Decrease score by 1 for each bullet shot
        score -= 1;
        updateScore();

        // Play shot sound
        const shotAudio = shotSound.cloneNode();
        shotAudio.volume = window.shotSoundVolume;
        shotAudio.play();
    } else {
        // Show warning message
        document.getElementById('warning').style.display = 'block';
        setTimeout(() => {
            document.getElementById('warning').style.display = 'none';
        }, 1000); // Hide warning after 1 second

        const outOfAmmoAudio = outOfAmmoSound.cloneNode();
        outOfAmmoAudio.play();
    }
}

function createEnemy() {
    const enemyGeometry = new THREE.BoxGeometry(1, 1, 1);
    const enemyMaterial = new THREE.MeshBasicMaterial({color: 0x0000ff});
    const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
    enemy.position.set(Math.random() * 10 - 5, Math.random() * 5 - 2.5, -50);
    enemies.push(enemy);
    scene.add(enemy);
}

function createAmmo() {
    const AmmoGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const AmmoMaterial = new THREE.MeshBasicMaterial({color: 0xffff00});
    const Ammo = new THREE.Mesh(AmmoGeometry, AmmoMaterial);
    Ammo.position.set(Math.random() * 10 - 5, Math.random() * 5 - 2.5, -50);
    Ammos.push(Ammo);
    scene.add(Ammo);
}

function createHealthPickup() {
    const healthPickupGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const healthPickupMaterial = new THREE.MeshBasicMaterial({color: 0xff0000});
    const healthPickup = new THREE.Mesh(healthPickupGeometry, healthPickupMaterial);
    healthPickup.position.set(Math.random() * 10 - 5, Math.random() * 5 - 2.5, -50);
    healthPickups.push(healthPickup);
    scene.add(healthPickup);
}

function createStarfield() {
    const starGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const starMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    for (let i = 0; i < 1000; i++) {
        const star = new THREE.Mesh(starGeometry, starMaterial);
        star.position.set(
            (Math.random() - 0.5) * 200,
            (Math.random() - 0.5) * 200,
            (Math.random() - 0.5) * 200
        );
        stars.push(star);
        scene.add(star);
    }
}

function moveStars() {
    stars.forEach(star => {
        star.position.z += enemySpeed;
        if (star.position.z > 10) {
            star.position.z = -100;
        }
    });
}

function moveShip() {
    if (!gameStarted) return; // Prevent movement if game is not started

    if (keys['ArrowLeft'] && ship.position.x > -10) {
        ship.position.x -= shipSpeed;
    }
    if (keys['ArrowRight'] && ship.position.x < 10) {
        ship.position.x += shipSpeed;
    }
    if (keys['ArrowUp'] && ship.position.y < 5) {
        ship.position.y += shipSpeed;
    }
    if (keys['ArrowDown'] && ship.position.y > -5) {
        ship.position.y -= shipSpeed;
    }
    if (keys[' '] && clock.getElapsedTime() - lastBulletTime > bulletInterval) {
        createBullet();
        lastBulletTime = clock.getElapsedTime();
    }
}

function moveBullets() {
    bullets.forEach((bullet, index) => {
        bullet.position.z -= bulletSpeed;
        if (bullet.position.z < -100) {
            scene.remove(bullet);
            bullets.splice(index, 1);
        }
    });
}

function moveEnemies() {
    enemies.forEach((enemy, index) => {
        enemy.position.z += enemySpeed;
        if (enemy.position.z > 10) {
            scene.remove(enemy);
            enemies.splice(index, 1);
        }
    });
}

function moveAmmos() {
    Ammos.forEach((Ammo, index) => {
        Ammo.position.z += enemySpeed;
        if (Ammo.position.z > 10) {
            scene.remove(Ammo);
            Ammos.splice(index, 1);
        }
    });
}

function moveHealthPickups() {
    healthPickups.forEach((healthPickup, index) => {
        healthPickup.position.z += enemySpeed;
        if (healthPickup.position.z > 10) {
            scene.remove(healthPickup);
            healthPickups.splice(index, 1);
        }
    });
}

function detectCollisions() {
    // Collision detection for bullets and enemies
    enemies.forEach((enemy, enemyIndex) => {
        bullets.forEach((bullet, bulletIndex) => {
            if (bullet.position.distanceTo(enemy.position) < 1) {
                scene.remove(enemy);
                scene.remove(bullet);
                enemies.splice(enemyIndex, 1);
                bullets.splice(bulletIndex, 1);
                score += 5; // Increment score
                updateScore(); // Update score display

                // Clone the audio node and play the explosion sound
                const explodeAudio = explodeSound.cloneNode();
                explodeAudio.volume = window.explodeSoundVolume;
                explodeAudio.play();
                explosions.push(new Explosion(enemy.position));
            }
        });
    });

    // Collision detection for ship and enemies
    enemies.forEach((enemy, enemyIndex) => {
        if (ship.position.distanceTo(enemy.position) < 1) {
            health -= 1;
            score = Math.max(score - 10, 0); // Decrease the score by 10 but not below 0
            updateHealthBar();
            updateScore(); // Update the score display
            startScreenShake(); // Trigger screen shake

            // Change ship color to red for a short period
            ship.material.color.set(0xff0000);
            setTimeout(() => {
                ship.material.color.set(0x00ff00);
            }, 200); // Change back to green after 0.2 seconds

            // Play crash sound
            crashSound.play();

            // Remove the enemy after collision
            scene.remove(enemy);
            enemies.splice(enemyIndex, 1);

            if (health <= 0) {
                gameOver = true;

                // Play losing sound
                losingSound.play();

                setTimeout(() => {
                    document.getElementById('info').innerText = 'Game Over! Refresh to restart.';
                }, 500); // Display Game Over after delay
            }
        }
    });

    // Collision detection for ship and Ammos
    Ammos.forEach((Ammo, AmmoIndex) => {
        if (ship.position.distanceTo(Ammo.position) < 1) {
            scene.remove(Ammo);
            Ammos.splice(AmmoIndex, 1);
            score += 10; // Increment score by 10 when collecting Ammo
            updateScore();

            // Play ammo crate sound
            ammoCrateSound.play();
        }
    });

    // Collision detection for ship and health pickups
    healthPickups.forEach((healthPickup, healthPickupIndex) => {
        if (ship.position.distanceTo(healthPickup.position) < 1) {
            scene.remove(healthPickup);
            healthPickups.splice(healthPickupIndex, 1);
            health = Math.min(health + 1, 10); // Increase health by 1 but not above 10
            updateHealthBar();

            // Play health pickup sound
            healthPickupSound.play();
        }
    });

    // Collision detection for bullets and health pickups
    healthPickups.forEach((healthPickup, healthPickupIndex) => {
        bullets.forEach((bullet, bulletIndex) => {
            if (bullet.position.distanceTo(healthPickup.position) < 1) {
                scene.remove(healthPickup);
                scene.remove(bullet);
                healthPickups.splice(healthPickupIndex, 1);
                bullets.splice(bulletIndex, 1);
                health = Math.min(health + 1, 10); // Increase health by 1 but not above 10
                updateHealthBar();

                // Play health pickup sound
                healthPickupSound.play();
            }
        });
    });
}

function startScreenShake(duration = 0.2, intensity = 0.25) {
    shakeDuration = duration;
    shakeIntensity = intensity;
}

function updateScore() {
    document.getElementById('info').innerText = `Score: ${score}`;
}

function updateHealthBar() {
    const healthBar = document.getElementById('health');
    healthBar.style.width = `${(health / 10) * 100}%`;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    resizeCanvas();
}

function resizeCanvas() {
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    if (gameOver) {
        return;
    }

    requestAnimationFrame(animate);

    moveShip();
    moveBullets();
    moveEnemies();
    moveAmmos();
    moveHealthPickups();
    moveStars();
    detectCollisions();

    // Update explosions
    explosions = explosions.filter(explosion => explosion.update());

    // Apply screen shake effect
    if (shakeDuration > 0) {
        const shakeOffsetX = (Math.random() - 0.5) * shakeIntensity;
        const shakeOffsetY = (Math.random() - 0.5) * shakeIntensity;
        camera.position.x += shakeOffsetX;
        camera.position.y += shakeOffsetY;
        shakeDuration -= clock.getDelta();
    }

    if (clock.getElapsedTime() - lastEnemyTime > enemySpawnInterval) {
        createEnemy();
        lastEnemyTime = clock.getElapsedTime();
        // Increase enemy speed over time
        enemySpeed = Math.min(enemySpeed + 0.005, MAX_ENEMY_SPEED);
        // Decrease enemy spawn interval over time
        if (enemySpawnInterval > 0.2) {
            enemySpawnInterval -= 0.03;
        }
    }

    // Spawn Ammo if out of bullets
    if (score === 0 && Ammos.length === 0 && clock.getElapsedTime() - lastAmmoTime > 1) {
        createAmmo();
        lastAmmoTime = clock.getElapsedTime();
    }

    // Spawn health pickup if health is below 10
    if (health < 10 && healthPickups.length === 0 && clock.getElapsedTime() - lastHealthPickupTime > 5) {
        createHealthPickup();
        lastHealthPickupTime = clock.getElapsedTime();
    }

    renderer.render(scene, camera);
}

export { startGame, gameStarted };
